// Palette extraction: image pixels -> ~k weighted colors, via k-means in CIELAB.
// Pure core (`extractPalette`) is shared by the browser and the offline build script,
// so paintings and user photos are analysed identically -> fair scoring.

import { rgbToLab, labToRgb, rgbToHex } from './convert.js';

// deterministic PRNG so palettes are stable across runs
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const distSq = (p, c) => {
  const dl = p[0] - c[0], da = p[1] - c[1], db = p[2] - c[2];
  return dl * dl + da * da + db * db;
};

/**
 * @param {Array<[number,number,number]>} rgbPixels  sampled opaque pixels
 * @param {number} k
 * @returns {Array<{hex:string, lab:number[], rgb:number[], weight:number}>}
 */
export function extractPalette(rgbPixels, k = 5, seed = 1) {
  if (rgbPixels.length === 0) return [];
  const labs = rgbPixels.map(([r, g, b]) => rgbToLab(r, g, b));
  const rand = mulberry32(seed);
  const n = labs.length;
  const K = Math.min(k, n);

  // k-means++ initialisation
  const centers = [labs[Math.floor(rand() * n)]];
  while (centers.length < K) {
    const d2 = labs.map((p) => {
      let m = Infinity;
      for (const c of centers) { const d = distSq(p, c); if (d < m) m = d; }
      return m;
    });
    const sum = d2.reduce((a, b) => a + b, 0);
    let t = rand() * sum, i = 0;
    while (i < n - 1 && (t -= d2[i]) > 0) i++;
    centers.push(labs[i]);
  }

  // Lloyd iterations
  const assign = new Array(n).fill(0);
  for (let iter = 0; iter < 14; iter++) {
    for (let i = 0; i < n; i++) {
      let m = Infinity, mi = 0;
      for (let c = 0; c < K; c++) {
        const d = distSq(labs[i], centers[c]);
        if (d < m) { m = d; mi = c; }
      }
      assign[i] = mi;
    }
    const sums = Array.from({ length: K }, () => [0, 0, 0, 0]);
    for (let i = 0; i < n; i++) {
      const a = assign[i], p = labs[i];
      sums[a][0] += p[0]; sums[a][1] += p[1]; sums[a][2] += p[2]; sums[a][3]++;
    }
    for (let c = 0; c < K; c++) {
      if (sums[c][3] > 0) {
        centers[c] = [sums[c][0] / sums[c][3], sums[c][1] / sums[c][3], sums[c][2] / sums[c][3]];
      } else {
        centers[c] = labs[Math.floor(rand() * n)]; // re-seed empty cluster
      }
    }
  }

  const counts = new Array(K).fill(0);
  for (const a of assign) counts[a]++;

  return centers
    .map((lab, c) => {
      const [r, g, b] = labToRgb(lab[0], lab[1], lab[2]);
      return {
        hex: rgbToHex(r, g, b),
        lab: lab.map((v) => +v.toFixed(2)),
        rgb: [r, g, b],
        weight: +(counts[c] / n).toFixed(4),
      };
    })
    .filter((p) => p.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}

// --- browser helpers -------------------------------------------------------

const MAX_DIM = 120; // downsample cap: fast, and averages out sensor noise

export async function paletteFromFile(file, k = 5) {
  const bitmap = await createImageBitmap(file);
  try {
    return paletteFromBitmap(bitmap, k);
  } finally {
    bitmap.close?.();
  }
}

export function paletteFromBitmap(bitmap, k = 5) {
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const px = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 125) continue; // skip transparent
    px.push([data[i], data[i + 1], data[i + 2]]);
  }
  return extractPalette(px, k);
}
