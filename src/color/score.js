// Two weighted palettes -> a 0-100 match score.
//
// The whole "how generous is scoring" question lives in ONE knob: SCORE.DECAY.
// Higher = more generous. Calibrate it once you can feel real photos; no rewrite.

import { ciede2000 } from './distance.js';

export const SCORE = {
  DECAY: 18, // the knob. score = 100 * exp(-meanDeltaE / DECAY). Lower = stricter.
  MIN: 0,
  MAX: 100,
};

// weighted mean of the nearest ΔE00 from each color of A to any color of B
function directional(a, b) {
  let dsum = 0, wsum = 0;
  for (const ca of a) {
    let m = Infinity;
    for (const cb of b) {
      const d = ciede2000(ca.lab, cb.lab);
      if (d < m) m = d;
    }
    dsum += m * ca.weight;
    wsum += ca.weight;
  }
  return wsum > 0 ? dsum / wsum : Infinity;
}

// symmetric perceptual distance between two palettes (0 = identical)
export function paletteDistance(a, b) {
  return (directional(a, b) + directional(b, a)) / 2;
}

export function scoreMatch(paletteA, paletteB) {
  const distance = paletteDistance(paletteA, paletteB);
  const raw = SCORE.MAX * Math.exp(-distance / SCORE.DECAY);
  return {
    score: Math.max(SCORE.MIN, Math.min(SCORE.MAX, Math.round(raw))),
    distance: +distance.toFixed(2),
  };
}

// "One color a day" scoring (PRD §5.5): did the photo contain today's single
// color? We score the closest small patch of sampled pixels, not the photo's
// dominant color, because a hunt can succeed with a found object in the scene.
export function scoreColor(photoLabs, targetLab) {
  if (!photoLabs.length) return { score: SCORE.MIN, distance: Infinity };
  const distances = photoLabs.map((lab) => ciede2000(lab, targetLab)).sort((a, b) => a - b);
  const sampleCount = Math.min(120, Math.max(16, Math.round(distances.length * 0.01)));
  const patch = distances.slice(0, sampleCount);
  const distance = patch.reduce((sum, value) => sum + value, 0) / patch.length;
  const raw = SCORE.MAX * Math.exp(-distance / SCORE.DECAY);
  return {
    score: Math.max(SCORE.MIN, Math.min(SCORE.MAX, Math.round(raw))),
    distance: +distance.toFixed(2),
  };
}
