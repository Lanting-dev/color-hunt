# ColorHunt — Build Plan (for approval)

Status: **planning only, no code written yet.** Approve or edit this, then I build.
Scope target: **Phase 0** (weekend prototype) with the structure already laid so Phase 1 slots in cleanly.

Phase 0 deliverable (from PRD §10): one mobile page —
`today's painting → upload photo → extract both palettes → LAB score → side-by-side reveal.`

---

## 1. Stack & why

| Choice | Decision | Why |
|---|---|---|
| Framework | **Vanilla JS + Vite** | Lightest path for a solo builder; PRD's first suggestion. No framework tax on a 3-screen app. React can come later if state grows. |
| Language | Plain JS (JSDoc types) | Fast iteration; no build-config rabbit holes. |
| Color math | Custom module in **CIELAB / CIEDE2000** | PRD wants perceptual distance. Small, dependency-free, testable. |
| Palette extraction | **k-means (k=5) in LAB**, k-means++ seed | Better perceptual clusters than median-cut; deterministic with fixed seed. |
| Storage | `localStorage` (single-player, no accounts) | PRD §8. Diary/streak land here in Phase 1. |
| Hosting | Vercel/Netlify (later) | Free, static. |
| Painting images | **Bundled locally** in `/public` | Sidesteps CORS entirely (see §4). Public-domain only. |

---

## 2. The CORS insight that shapes the architecture

Reading pixels from a **cross-origin** image *taints the canvas* — `getImageData` throws. That matters:

- **User photo** → a local `File`, same-origin, safe to read pixels. ✅ Extract at runtime.
- **Painting** → we **pre-compute its palette offline** and store it in JSON. At runtime we only *display* the painting, never read its pixels. So the painting image can even be remote and it still works.
  - We'll still bundle painting images locally for reliability + offline PWA later.

**Consequence:** runtime color extraction only ever runs on the user's own photo. Painting palettes are data, not computed live.

---

## 3. File structure

```
ColorHunt/
├─ index.html
├─ vite.config.js
├─ package.json
├─ public/
│  └─ paintings/            # bundled public-domain images (met-XXXX.jpg …)
├─ src/
│  ├─ main.js               # app bootstrap + screen router
│  ├─ state.js              # localStorage read/write (diary, streak) — stubbed in P0
│  ├─ daily.js              # deterministic "painting of the day" (Wordle-style)
│  ├─ color/
│  │  ├─ extract.js         # image → 5-color weighted palette (k-means, LAB)
│  │  ├─ convert.js         # sRGB ↔ XYZ ↔ LAB
│  │  ├─ distance.js        # CIEDE2000 (ΔE00)
│  │  └─ score.js           # two palettes → 0–100  (ALL tunables live here)
│  ├─ ui/
│  │  ├─ screens.js         # today / capture / reveal
│  │  └─ swatches.js        # palette strip rendering
│  └─ styles.css
├─ data/
│  └─ paintings.json        # the dataset (schema in §5)
├─ scripts/
│  └─ build-palettes.mjs    # offline: painting image → palette → paintings.json
└─ PLAN.md
```

---

## 4. Runtime flow (Phase 0)

```
load → daily.js picks today's painting (date-seeded, same for everyone)
     → render Today screen: painting + its stored palette + accent = painting's dominant color
user taps "Find the match" → <input type=file capture=environment> (PRD §8, simplest)
     → extract.js: downsample photo to ~120px, k-means(5) in LAB → weighted palette
     → score.js: compare photo palette vs painting palette → score
     → Reveal screen: side-by-side, two palette strips, animated score count-up
```

Accent color follows the painting (PRD §14) — one CSS custom property `--accent` set from the day's dominant swatch.

---

## 5. Paintings data schema (`data/paintings.json`)

```jsonc
[
  {
    "id": "met-436535",
    "title": "Wheat Field with Cypresses",
    "artist": "Vincent van Gogh",
    "year": 1889,
    "era": "Post-Impressionism",
    "museum": "The Met",
    "source": "Met Open Access",
    "license": "CC0 / Public Domain",
    "image": "/paintings/met-436535.jpg",
    "coords": null,               // reserved for v2 location layer (PRD §6)
    "fact": "Van Gogh painted this from the asylum garden at Saint-Rémy…",  // Phase 1
    "palette": [                  // pre-computed, weighted, sorted by weight desc
      { "hex": "#6b8ec4", "lab": [58.2, -4.1, -28.0], "weight": 0.34 },
      { "hex": "#c9b168", "lab": [72.9,  2.3,  46.1], "weight": 0.27 }
      // … 5 total, weights sum ~1.0
    ]
  }
]
```

- `weight` = fraction of pixels in that cluster → lets scoring weight dominant colors.
- `lab` stored so runtime skips re-converting the painting.
- `fact` / `coords` present now but unused in P0 → Phase 1 & v2 need no schema change.

**Dataset build:** I hand-pick ~20–30 CC0 works (Met Open Access API gives direct image URLs + `isPublicDomain`). `scripts/build-palettes.mjs` runs the *same* extraction offline and writes `palette` into the JSON, so painting and photo palettes are computed identically → fair scoring.

---

## 6. Scoring design (the PRD's open question #2)

You chose **"decide later."** The honest position: **you cannot tune a score curve before feeling real numbers.** So the deliverable is not a magic formula — it's making the curve *one constant we turn.*

Pipeline:
1. Each side = 5 weighted LAB colors.
2. **Weighted bipartite match** photo↔painting (greedy nearest on a 5×5 ΔE00 matrix, run both directions, symmetric average). Weight each matched pair by the pair's populations.
3. Aggregate → `D` = weighted mean ΔE00 (perceptual distance, 0 = identical).
4. `score = round(100 · exp(−D / DECAY))`, clamped [0, 100].

Everything lives in `score.js` as named constants:

```js
export const SCORE = {
  DECAY: 30,        // ← the ONE knob. Higher = more generous.
  MIN: 0, MAX: 100,
};
```

Generous-leaning starting point (`DECAY = 30`):

| Mean ΔE00 (D) | Score | Feels like |
|---|---|---|
| 5  | 85 | near-perfect match |
| 10 | 72 | strong |
| 15 | 61 | good |
| 20 | 51 | fair |
| 30 | 37 | weak |

After we can shoot real photos, we slide `DECAY` (and maybe add a floor) until 80+ feels *earned but reachable*. That's the whole tuning story — no rewrite needed.

**Testability:** color math is pure functions → I'll add tiny sanity tests (e.g. identical palettes → 100; grayscale vs vivid → low) so refactors don't silently break scoring.

---

## 7. What's intentionally NOT in Phase 0

Deferred to Phase 1 (structure already reserved): diary timeline, streaks, daily fact reveal, daily rotation across the full set. v2 (location/museum, GPS, Taiwanese-painter editions) untouched. This keeps the weekend build to: **extract → score → side-by-side.**

---

## 8. Open questions I need from you before/while building

1. **Dataset size for P0:** start with ~8–10 paintings (faster) or the full 20–30? (I lean 8–10 to validate fun first.)
2. **Painting sourcing:** want me to pull specific works from The Met Open Access, or hand you a curated shortlist to approve first?
3. **Name:** PLAN uses "ColorHunt" (the folder). Keep, or pick from Palette Diary / Hue / Chroma?
4. Anything above you want changed before I write code.
```
