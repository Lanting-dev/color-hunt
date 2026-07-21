# PRD — Core Mechanic v2: "Today's Color"

> Replaces the earlier "match the full palette + score" loop. The core action is now
> **one color a day**, drawn from a masterpiece — simple enough to ride the viral
> "color hunting" behaviour, but with a painting's soul and a personal, penalty-free
> collection underneath.

---

## 1. The soul (unchanged)

> **Your everyday life and the world the masters saw are the same world.**

The app quietly proves this: **Today's Color** comes from a master → you go find it in
your day → **Your Color** is your own photo of that same color. The master's color and
your ordinary life's color turn out to be the same color.

## 2. Core daily loop

```
Today's Color  (one solid color, drawn from today's painting)
   → tap the card → see its SOURCE (the painting, with a pin on the exact spot the color lives)
   → "Upload your image" (a photo from your day that matches the color)
   → Your Color  (your photo becomes the swatch, tagged with today's color)
              + a match score animates in: "how close did you get?"
   → it's saved to your collection (regardless of the score)
```

One line: **one color today → find it → your photo becomes the swatch.**

Design principle: the hero must be **an unambiguous single color** (the task is "find
*this*"), AND it must be **inseparable from the painting** (or it's just a random color).
We resolve this by: default = a clean solid color chip (clear target); tap = the color
dissolves to reveal the painting with a pin showing exactly where it was sampled from
(an eyedropper from one precise point). Clear target + real source.

## 3. The three Home states (built, see Figma 187:602 / 559 / 772)

1. **Today's Color** — solid color card, "Tap to see its source" pill, a light bottom
   strip showing `HEX` (RGB optional). The card *is* today's color.
2. **Source (revealed)** — same card, now the painting, "Back to the color" pill, and a
   pin at the color's real location in the artwork.
3. **Your Color** — after upload, the user's photo fills the card; the bottom strip is
   filled with today's color; title becomes "Your Color".

The daily Home shows **only today's one color** — no swatch row, no "3/7", no preview of
what's coming. (The multi-color view lives in the Collection, see §6.)

## 4. Weekly structure — one painting per week

- Each **week = one painting**. Its palette (≈7 colors) is spread across the 7 days —
  **one color per day**, revealed one at a time. The user does **not** see the full
  palette in advance (surprise is part of the daily pull).
- Over the week the painting **gradually reveals itself**, color by color. This is framed
  as *unfolding/discovery*, never as a progress meter.
- A new painting rotates in each week regardless of completion (it's a theme, not a hard
  goal).

## 5. Retention — accumulation, never penalty

Deliberately **no streak penalty, no progress bar.** Both re-introduce goal-pressure and
spoil the surprise. Instead:

- **Progress = accumulation, not a goal to fill.** The reward is *what you've gathered*
  (your collection growing), never *what you lack*.
- **The painting slowly appearing** over the week gives forward curiosity ("what's
  today's color?") without a counter.
- **Every find always counts.** A color you find is *always* saved to your collection,
  even on a partial week. No day is ever wasted → nothing to lose.
- **Full-week achievement is a quiet bonus**, awarded if you complete all 7 — never an
  all-or-nothing gate. Missing a day costs nothing; you simply don't get that badge.

## 5.5 Match score — a positive reward, never a penalty

The hunt earns a **match score** (0–100): how close the user's photo is to *today's one
color*. It appears on the **Your Color** screen with a satisfying count-up animation — the
payoff of the hunt, and a very shareable line ("I matched Vermeer's blue 92%").

Rules that keep it penalty-free and on-brand:

- It scores **your photo vs today's single color** (a LAB color-distance → score), **not**
  the whole palette. Simple, matches "one color a day."
- It is a **per-find celebration**, decoupled from retention: **every photo is saved to
  the collection regardless of the score.** A low score costs nothing.
- No streaks are broken, nothing is lost. It only ever adds a "how close did you get?"
  moment and a reason to try another shot (optional).
- Copy scales warmly with the score (e.g. "Uncanny — the same light as Vermeer" →
  "A quiet rhyme. Keep looking."). Never punishing language.

(Implementation note: reuse the existing `color/extract.js` + `color/score.js`; for the
single-color version, take the photo's dominant color and compute distance to today's
color rather than palette-to-palette.)

## 6. Collection & Color Sets (the long-term reward + growth)

- Every "Your Color" photo is saved. The **Collection** is a wall that only ever grows.
- **Two ways to look back:**
  - **By painting** — a completed week's painting + your 7 photos side by side (this is
    also the multi-color "explore where each color lives" view — the retrospective).
  - **By color — "Color Sets"** — your photos regrouped across time by color (all your
    blues, all your yellows). A cross-cutting, ever-growing personal artifact.
- **Sharing** happens from two natural units: a completed week (painting × your photos)
  and a Color Set grid. Both are inherently beautiful → free reach (growth engine).

## 7. Optional — name your own color

- Users may **optionally** name a color *they found* (e.g. "Tuesday calm"). This is
  personal/expressive, **not** an official system color name (we never auto-name colors).
- **Must be optional and skippable** — default to an auto-title (date/context); let users
  rename later. Naming must never add friction to the core loop.
- Symmetry: the master's color has a **source** (given); your color gets a **name**
  (yours). This turns the collection into a personal, shareable color journal.

## 8. Info shown per color (keep it minimal)

Only four things on Home: **the color** (clear, large) · **its source** (which painting /
where in it) · **the action** (Upload) · **the date / "Today's Color"**. Everything else
is secondary/quiet or on-tap: `HEX` small; the pin location on tap. **Cut entirely:**
CMYK (print-only), official color names, and — recommended — RGB. No progress bar.

## 9. How "today's color" is derived (implementation)

- Painting of the day is deterministic (Wordle-style, `daily.js`). Palette is
  pre-extracted per painting (k-means, with each color's `{hex, lab, weight, x, y}` —
  `x,y` = where that color sits in the painting, used for the pin).
- Today's color = one palette entry per day; ordered by **chroma** so a day never lands on
  a dull near-neutral. (The full "one painting/week, one color/weekday" scheduling is the
  next step on top of this.)
- Screens implemented in the Vite/vanilla-JS app (`src/main.js`, `styles.css`). The visual
  design system (colors, type, icons) is maintained separately and is not specified here.
  Public-domain artwork only.

## 10. Open decisions

1. Exact weekly cadence (7 colors/7 days vs 5 weekdays + weekend recap/share).
2. Which color leads the week (recommend the most iconic as the hook).
3. Color Set threshold before it becomes a shareable grid (e.g. 10 photos).
4. Whether Home shows any hint the painting is "revealing" (subtle) or nothing at all.
5. Product name — "Color Hunt" clashes with the existing palette site colorhunt.co;
   revisit before launch.

## 11. Measurement & validation (how we'll know anyone actually uses it)

Because we ship **web-first** (no app store), usage is measured directly — richer than an
app-store install count. The question is not "how many downloads" but **"does anyone
complete the loop and come back?"**

**Tooling**
- Privacy-friendly, **cookieless** web analytics — no cookie banner, no personal data sold
  (consistent with an ad-free / privacy stance). Vercel Web Analytics if hosted on Vercel,
  otherwise Umami or Plausible.
- Auto-tracked: visitors, page views, returning visitors.

**Key events (loop-health signals)** — fired from the existing code, without changing its
behaviour, via a tiny `track(event, props)` helper that no-ops when analytics isn't
configured (so local dev never errors):
- `hunt_opened` — Today's Color rendered
- `source_revealed` — tapped the card to see the painting
- `photo_uploaded` — a photo was processed
- `match_scored` — with a score bucket (`0–59` / `60–79` / `80–100`)
- `collection_opened` — Collection rendered
- (later) `shared` — a share card was generated

**North-star signal (what actually validates the idea)**
- Not raw visits, but: (a) **`photo_uploaded` per visitor** — did they *complete a hunt* —
  and (b) **D1 / D7 return** — did they *come back*. A handful of strangers who complete +
  return beats a big vanity visit count.

**Early method**
- At n < ~50, qualitative beats dashboards: put the link in front of ~10 real people, watch
  them, and ask "would you open this again?". Analytics confirms; people explain.

**Guardrail**
- Never loosen the mechanic to inflate event counts. The real success signal is qualitative:
  someone saying *"I notice colours differently now."*
