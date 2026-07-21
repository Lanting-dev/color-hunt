# PRD — Collection

> Collection is where the daily hunt accumulates. It's the app's memory: every "Your
> Color" you've made, seen through different lenses. It carries the long-term reward
> (a collection that only ever grows) and the sharing surface.

---

## 1. What it is

A top-level section that shows your history of daily color finds. It is **the same
dataset viewed through switchable views** (Notion-style), not separate screens with
separate data.

An entry = one day you completed a hunt:
`{ date, colorHex, photo, score, paintingId }`

## 2. Navigation — two levels (keep these distinct)

- **Level 1 — bottom nav (app sections):** `Home` · `Collection` · `Profile`.
  Collection is one tab; its icon is active only when you're in it.
- **Level 2 — view switcher inside Collection:** a segmented control at the top that
  swaps the *view*, not the data: `Calendar` · `Year` (+ future views, see §3.3).

## 3. Views

### 3.1 Calendar view (default)
A month-by-month calendar for reliving specific days.
- Dark day cells on the dark canvas; a **found day shows its photo thumbnail**; empty days
  stay dark and recessive; other-month days are dimmed.
- Date number sits with each cell (placement — inside corner vs below — is an open
  decision, §9).
- Month navigation (‹ / ›). Above the grid: the **Monthly Recap** (§5).
- Job: "go back to a specific day / this month."

### 3.2 Year in Color view (Year in Pixels)
The whole year at a glance.
- A 12-column (months) × 31-row (days) grid; each day = **one solid cell of the color you
  found that day**; empty days stay dark; future days are blank.
- Header: `2026 · N colors found` (accumulation made visible).
- Job: "see my whole year's palette / share it."

### 3.3 Future views
- **Color Sets** — entries regrouped by color (all your blues, all your yellows), a
  cross-cutting collection. Candidate 3rd view.
- **Photos** — a plain gallery grid of the photos, if wanted.

## 4. Day detail (tap a day)
Tapping any found day opens that day's full entry: the photo, the day's color, the match
score, and which painting it came from (and where in it). This is the same content as the
"Your Color" screen, re-opened from history.

## 5. Monthly Recap (positive, not pressure)
A small stats row above the Calendar: `day streak`, `new art`, `new colors` (this month).
- These are **positive counts / celebrations of what you did**, framed as a recap.
- **`day streak` must never punish** a break — it's "you've been going X days," not a
  timer that scolds you when it resets.
- In the Year view the top line is a yearly count instead (`N colors found`).

## 6. Retention & the no-penalty rule (carried from the core PRD)
- **Empty days recede** (dark cells / blank pixels), so the Collection never highlights
  "days you missed." Missing a day is invisible, not red.
- The reward is **accumulation** — the calendar fills, the year mosaic grows, the count
  goes up. Progress is *what you have*, never *what you lack*. No progress bars.

## 7. Sharing
Two natural, beautiful share units:
- **Month** — a Monthly Recap / month grid.
- **Year in Color** — the full-year color mosaic ("my year, in the colors I found").
Both are share targets; a share affordance lives in the Collection header.

## 8. Data model (implementation)
- Entries persist locally (`state.js`, keyed by day). Each: `date`, `colorHex`, `photo`
  (thumb), `score`, `paintingId`.
- Views are pure renderers over the same entries; switching views never mutates data.
- Counts (streak, new colors, year total) are derived from the entries at render time.

## 9. Open decisions
1. View switcher labels: `Calendar / Year` vs `Month / Year` (they are one timeline at two
   zooms — could even be a single zoomable view instead of two).
2. Calendar cells: **photo thumbnail** vs **solid color**. If Calendar also shows only the
   color, it differs from Year only by zoom → then merge them into one zoomable view.
3. Date placement in the calendar cell (corner vs below).
4. Whether the Monthly Recap changes content per view (Month recap vs Year count) — current
   assumption: yes.
5. Whether/when to add Color Sets and Photos as further views.
6. Section name is **Collection** (decided). Keep it consistent everywhere (no "Diary").
