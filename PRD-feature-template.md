# New Feature PRD — <Feature Name>

> Copy this file, rename it `PRD-<feature>.md`, fill each section, then hand it to Claude
> Code with the prompt in §10. Keep it to roughly one page. Delete these italic notes.

## 1. What & why
*One or two sentences: what the feature does and why it matters. Tie it to the core.*

## 2. User story
As a **<user>**, I want **<…>** so that **<…>**.

## 3. Flow
*Numbered happy-path steps, start to finish.*
1.
2.
3.

## 4. Where it lives
*Is this a NEW screen + a nav entry, or an addition to an existing screen? Name it.*
- Screen:
- Entry point (nav / button / tab):

## 5. Data changes
*Any new fields on an entry, new state, new persistence? (see `state.js`) Or none.*
-

## 6. Rules & edge cases
*Empty state, errors, offline, first-time, and — importantly — the no-penalty check
(does anything here punish the user? it shouldn't).*
-

## 7. Out of scope
*What this feature explicitly does NOT include, so it stays small.*
-

## 8. Acceptance criteria (how I'll know it's done)
- [ ]
- [ ]
- [ ]

## 9. Files likely touched
*Best guess so Claude Code stays surgical.*
- `src/main.js`
- `src/styles.css`
-

## 10. Prompt for Claude Code
```
Implement the feature described in this PRD in the project (Vite vanilla-JS app, Color Hunt).
- Follow the EXISTING design system already in styles.css (colors, type, components) — do
  not restyle or invent new tokens.
- Do NOT change unrelated screens or logic.
- Add/modify only the files listed in §9 (tell me if you must touch others, and why).
- Match the flow in §3 and satisfy every acceptance criterion in §8.
- Respect the no-penalty rule in §6.
- Run `npm run build` to confirm it builds, then list exactly what you changed.
```
