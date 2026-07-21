# Color Hunt — Build Plan

How to add features safely, and the order to do them in. Hand this (and the relevant PRD)
to Claude Code one step at a time.

---

## The repeatable loop (how any feature gets added)

1. **Spec it** — copy `PRD-feature-template.md`, fill it in (~5 min).
2. **Design** the screen(s) in Figma.
3. **Hand Claude Code** the filled PRD + a short prompt ("implement this; don't change X;
   keep the existing design system").
4. **Test** locally: `npm run dev`.
5. **Commit** (git) — a save point.
6. **Deploy** — push to GitHub; Vercel auto-builds.
7. **Measure** — analytics + ask ~10 real people.

**Rule: one feature at a time. Keep it working. Commit before starting the next.**

---

## Order (do these top-down)

### 0. Git + GitHub — the safety net (do this FIRST)
Gives you save points, safe experimentation, and enables deploy + everything below.
You need a free GitHub account first (github.com). Then hand Claude Code:

```
Set up version control for this project and connect it to GitHub.
- Run git init if needed; add a sensible .gitignore for a Node/Vite project
  (node_modules, dist, .env, .DS_Store).
- Make an initial commit of the current working app.
- Create a new PRIVATE GitHub repo named "color-hunt" and push to it. If you can't create
  the repo from the CLI, give me the exact commands to run after I create it on github.com.
- Then tell me the 3 git commands I'll use day-to-day to save my work.
Do not change any app code.
```

### 1. Deploy + Analytics — see who uses it
- **Deploy:** connect the GitHub repo to **Vercel** (free) → auto-deploys on every push →
  you get a public URL to share.
- **Analytics:** hand Claude Code the analytics prompt (see `PRD-today-color.md` §11) →
  then share the URL with ~10 people and watch the `photo_uploaded` + return signals.

### 2. PWA — make it installable / feel like an app
- Hand Claude Code the PWA prompt (manifest + service worker + iOS meta). Lets people
  "Add to Home Screen" and, later, get daily reminders — without the App Store.

### 3. Match Score — the payoff on the Your Color screen
- Spec: `PRD-today-color.md` §2 + §5.5.
- Compute the uploaded photo's dominant color, its distance to *today's one color* → a
  0–100 score, animated on Your Color. Every photo still saves regardless of the score.

### 4. Collection views — Calendar + Year in Color
- Spec: `PRD-collection.md`.
- Build the Collection screen: **Calendar** (dark cells + photos on found days) and
  **Year in Color** views, with the view switcher. Fix the bottom nav so Collection is the
  active item on this screen.

### Parked — Art Walk (Travel Mode) — NOT now
- Spec: `PRD-art-walk.md`. Needs native (Capacitor) + background GPS + a geodata pipeline.
  Revisit only **after the core is loved**. Do not start early; it's an order of magnitude
  bigger than everything above.

---

## The one discipline that keeps you sane
One feature at a time; commit before each. If something breaks, git rolls you back to the
last working save point — so you can always experiment without fear.
