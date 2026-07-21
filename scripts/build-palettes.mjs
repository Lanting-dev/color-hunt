// Offline: for each curated Met object, fetch metadata + image, pre-compute its
// palette with the SAME extractor the app uses, and write src/data/paintings.json.
// Run: npm run palettes

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import jpeg from 'jpeg-js';
import { extractPalette } from '../src/color/extract.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const IMG_DIR = join(ROOT, 'public', 'paintings');
const OUT = join(ROOT, 'src', 'data', 'paintings.json');

// Curated public-domain (CC0) works, chosen for beautiful, distinct, matchable color.
const CURATED = [
  { id: 45434,  era: 'Edo / ukiyo-e',      fact: 'From “Thirty-six Views of Mount Fuji.” The tiny peak sits calmly beneath the wave’s reaching claw.' },
  { id: 436535, era: 'Post-Impressionism', fact: 'Painted from the garden of the asylum at Saint-Rémy; the cypresses “occupied his thoughts” like obelisks.' },
  { id: 437881, era: 'Dutch Golden Age',   fact: 'Pure morning light on a wall — one of the first Vermeers ever to reach an American collection.' },
  { id: 438821, era: 'Post-Impressionism', fact: 'A Tahitian retelling of the Annunciation, painted during Gauguin’s very first year on the island.' },
  { id: 435809, era: 'Northern Renaissance', fact: 'Part of Bruegel’s cycle of the seasons (1565) — a founding work of Western landscape painting.' },
  { id: 435882, era: 'Post-Impressionism', fact: '“With an apple I will astonish Paris,” Cézanne said. Here are the apples.' },
  { id: 438816, era: 'Romanticism / Barbizon', fact: 'A vast canvas Rousseau reworked for two decades — and never considered finished.' },
  { id: 436528, era: 'Post-Impressionism', fact: 'Irises from the last year of Van Gogh’s life, painted in the garden at Saint-Rémy.' },
  { id: 437980, era: 'Post-Impressionism', fact: '“As beautiful of line and proportion as an Egyptian obelisk,” Van Gogh wrote of the cypress.' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchMeta(id) {
  const r = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
  if (!r.ok) throw new Error(`meta ${id}: ${r.status}`);
  return r.json();
}

async function download(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`image ${url}: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

// decode JPEG -> sampled opaque [r,g,b] pixels (cap ~12k for speed)
function samplePixels(buf, cap = 12000) {
  const { width, height, data } = jpeg.decode(buf, { useTArray: true, maxMemoryUsageInMB: 1024 });
  const total = width * height;
  const stride = Math.max(1, Math.floor(total / cap));
  const px = [];
  for (let i = 0; i < total; i += stride) {
    const o = i * 4;
    if (data[o + 3] < 125) continue;
    px.push([data[o], data[o + 1], data[o + 2]]);
  }
  return px;
}

async function main() {
  mkdirSync(IMG_DIR, { recursive: true });
  mkdirSync(dirname(OUT), { recursive: true });

  const out = [];
  for (const { id, era, fact } of CURATED) {
    process.stdout.write(`• ${id} … `);
    const m = await fetchMeta(id);
    const imgUrl = m.primaryImageSmall || m.primaryImage;
    if (!m.isPublicDomain || !imgUrl) {
      console.log('SKIP (not public-domain or no image)');
      continue;
    }
    const buf = await download(imgUrl);
    writeFileSync(join(IMG_DIR, `${id}.jpg`), buf);
    const palette = extractPalette(samplePixels(buf), 5)
      .map(({ hex, lab, weight }) => ({ hex, lab, weight })); // drop rgb from stored data

    out.push({
      id: `met-${id}`,
      title: m.title,
      artist: m.artistDisplayName || 'Unknown',
      year: m.objectBeginDate || null,
      date: m.objectDate || '',
      era,
      museum: 'The Metropolitan Museum of Art',
      source: 'The Met — Open Access',
      license: 'CC0 / Public Domain',
      creditLine: m.creditLine || '',
      objectUrl: m.objectURL || '',
      image: `paintings/${id}.jpg`,
      coords: null, // reserved for the v2 location layer
      fact,
      palette,
    });
    console.log(`ok  ${palette.map((p) => p.hex).join(' ')}`);
    await sleep(300);
  }

  writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(`\nWrote ${out.length} paintings -> ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
