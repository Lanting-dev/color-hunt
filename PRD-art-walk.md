# PRD — Art Walk (Travel Mode)

> Reviewer stance: senior PM / UX strategist. This document does **not** just describe the
> feature — it challenges the assumptions behind it. Look for the **⚠ Challenge** callouts;
> those are the decisions that will make or break Art Walk.

---

## 0. Three things to decide before anything else (read this first)

1. **⚠ Platform.** True *passive, background* GPS is effectively impossible on web/PWA — it
   needs a native app with "Always" location + OS geofencing. Color Hunt is currently
   web-first. **Art Walk is the feature that would force you native.** Either accept that,
   or accept a degraded "foreground-only" version. This is the single biggest constraint.
2. **⚠ Data density.** "Every walk becomes an art walk" is only true where art *lives*.
   Most streets have zero locatable artworks. Without a density strategy, most walks end in
   an empty summary — which is worse than not having the feature.
3. **⚠ Scope.** GPS + maps + a geodata pipeline + native is a *large* feature — an order of
   magnitude bigger than the daily loop. Honest recommendation: **Art Walk is a v2/"someday"
   bet, not part of the first shippable product.** Treat this PRD as the north star for that
   bet, not next month's build.

---

## 1. Executive Summary

Art Walk turns travel into an ambient art experience. The app passively tracks a walk and,
when the user passes an artwork's single curated **Art Origin** (where it was made, depicts,
or came from), silently records an **Art Encounter**. At the end, a reflective **Art Walk
Summary** shows the route, distance, time, and — tying back to Color Hunt's soul — the
**artworks and colors** the user walked through.

**Why build it:** the core Color Hunt is an *intentional daily* act; travel is a *low-effort,
exploratory* mode where a daily task feels like a chore. Art Walk captures the traveler
context with a different contract: **you do nothing; the place rewards you.**

**Reasoning for the shape:** we deliberately reject Strava's competitive engine and Pikmin
Bloom's character-collection. The collectible is *encounters with real art in real places* —
quieter, more meaningful, harder to fake, and unique to this product.

## 2. Product Vision

> *When you happen to walk where art was born, you'll feel it.*

Note the wording. The naive vision ("turn any ordinary walk into an art walk") over-promises.
**⚠ Challenge:** an ordinary suburban walk has no art origins nearby; selling "any walk"
sets users up for disappointment. Reframe honestly: Art Walk makes the *art-dense* walks
(old cities, cultural districts, travel) magical, and stays gracefully invisible elsewhere.

Positioning vs neighbours:
- **Strava:** performance, competition, segments. We take the *passive route-recording*, drop
  the competition.
- **Pikmin Bloom:** collect cute characters everywhere. We collect *real encounters with art*,
  which are scarce and place-true — a feature, not a bug (scarcity = meaning).

## 3. Problem Statement

Daily Color Hunt works as a home ritual but assumes intention and attention. On a trip the
user is (a) already stimulated, (b) unwilling to add a task, (c) often offline/roaming, and
(d) moving through exactly the kind of places (historic cities, museums districts) that are
art-dense. There's a gap: the app goes quiet precisely when the user is most surrounded by art.

**⚠ Challenge the problem itself.** Is "I want my walk passively enriched by art" a real,
felt need, or a designer's romantic idea? We have no evidence yet. Before building the heavy
version, validate the *desire* cheaply (see §17 and §18) — e.g., a manual "I'm walking here"
mode, or even a non-GPS "art near this place" lookup. Don't let the elegance of the concept
skip the demand test.

**Secondary risk:** a travel mode can *confuse* the core. Two modes ("do the daily hunt" vs
"do nothing, just walk") must not blur into "now I have two obligations."

## 4. User Personas

- **The Wanderer (primary).** Travels a few times a year, loves museums and old towns, is
  *turned off* by gamified/competitive apps. Wants meaning, not points. → Art Walk's
  passive/reflective design is built for her.
- **The Local Stroller (secondary).** Lives in an art-dense city, walks daily. Could get value
  *without* traveling — which challenges the "Travel Mode" framing (see §19).
- **The Completist (edge).** Wants to "collect all the art origins." → risks turning the quiet
  experience into a checklist; we should *not* optimise for him, but he'll appear.

**⚠ Challenge:** the personas most attracted to "passive, no-pressure" are also the least
likely to *return to open a summary*. A passive feature can be so frictionless it's forgettable.
The summary + notification design (see §8) is what converts passivity into a remembered moment.

## 5. User Stories

- As a traveler, I want the app to quietly notice the art around me **without me starting a
  task**, so exploring stays effortless.
- As a traveler, I want a **beautiful summary at the end of my walk**, so the day becomes a
  keepsake.
- As a user, I want encounters to **flow into my Collection** (artworks + colors), so travel
  and my daily practice are one story.
- As a privacy-conscious user, I want to **turn tracking on only when I choose** and know my
  routes stay mine.
- As an offline traveler, I want it to **work without data/roaming**.

## 6. Jobs To Be Done

- *When I'm exploring an unfamiliar place, help me sense the art history under my feet without
  effort, so I notice what I'd have walked past.*
- *When a walk ends, give me a memory of what I encountered, so the trip feels richer later.*
- *When I get home, let my travel encounters live alongside my daily colors, so it's one
  collection, not two apps.*

Reasoning: JTBD keeps us honest that the deliverable is a **feeling** (serendipity, memory),
not a metric (distance, count). Strava sells numbers; we sell noticing.

## 7. Experience Principles

1. **Passive, not task-based** — zero required actions to get value.
2. **Serendipitous** — the reward is discovery, so surprise > completeness.
3. **Place-first** — the location, not the user's performance, is the hero.
4. **Reflective, not competitive** — no leaderboards, no "beat yesterday."
5. **Minimal interruption** — never pull the user out of their actual trip.
6. **(added) Honest about emptiness** — an art-free walk must feel calm, not failed.
7. **(added) Privacy- and battery-respectful** — the feature must earn "Always" location.

**⚠ Challenge principle #4.** Removing competition removes exactly what makes Strava sticky.
"Reflective" is beautiful but weak as a retention engine. We need *non-competitive* pull
instead: a **personal map that fills in over time**, encounters flowing into the Collection,
and the occasional "you walked through where Monet stood" delight. If those aren't enough,
the feature will be loved-but-forgotten. Decide consciously.

## 8. User Journey

1. **Opt-in / setup** — explain value, request location ("Always" or "While Using" — trade-off
   below), request notifications (optional).
2. **Start** — manual "Start walk" vs auto-detect walking (trade-off in §9).
3. **During** — app is silent/backgrounded; optional lightweight "live" screen (route + a soft
   count) for those who want it.
4. **Encounter** — recorded automatically. **⚠ Key decision:** *notify or stay silent?*
   - *Silent:* purest serendipity, discovered only in the summary. Risk: feels like nothing
     happened; no in-the-moment magic (you don't look up at the actual place).
   - *Subtle ping:* "🎨 You're near where *The Great Wave* was made" — creates a real-world
     look-up moment. Risk: interruption, notification fatigue.
   - **Recommendation:** subtle, *optional*, **off by default**; let the delight-seekers turn
     it on. Default experience is discovered in the summary.
5. **End** — manual stop, or auto-end on inactivity. Generate summary.
6. **After** — save to Collection; optional share; encounters merge into the color diary.

## 9. Functional Requirements

- **F1 Walk session**: start/stop. *Recommend manual start* (reliable, battery-honest, clear
  consent) with **optional** auto-detect as a later enhancement. **⚠** Auto-detecting "a walk"
  is battery-hungry and error-prone (it fires on drives, treadmills, etc.); "effortless" is
  not worth a dead battery and false walks. Manual start is a small tap that buys reliability.
- **F2 Passive tracking**: record route while session active (and, if native + Always,
  monitor origin geofences even when app is backgrounded).
- **F3 Encounter detection**: see §10.
- **F4 Summary generation**: route, distance, duration, encounters, colors (see §12).
- **F5 Persistence**: save walks + encounters locally; sync later if accounts exist.
- **F6 Share**: export a summary card.
- **F7 Settings**: tracking on/off, notifications on/off, units, delete walks.

## 10. Encounter Detection Logic

Core rule: an encounter fires when the user is **within radius R of an Art Origin, while
moving at walking speed, and hasn't already encountered that origin this walk.**

Parameters & trade-offs:
- **Radius R (~50–150m).** Tight = precise but misses (GPS drifts 10–30m in cities; curation
  is approximate). Loose = generous but false "encounters" (you were a block away). Because
  the origin is *itself* an approximation ("near where this lives"), lean **generous (~100m)**
  and frame copy as "you passed near," not "you stood on the exact spot."
- **Movement filter.** Ignore speeds >~10 km/h to exclude cars/trains/bikes. **⚠** But a slow
  tram or a stop-and-go car could false-positive; and a fast walker downhill could be excluded.
  Use speed *and* a short dwell (e.g., within radius for ≥20–30s) to confirm "walking through."
- **Dedupe.** One encounter per origin **per walk** (recommend); decide separately whether an
  origin already collected on a *previous* walk still counts as a fresh encounter or shows as
  "seen before" (see Edge Cases). Recommend: still record, but mark repeat encounters visually
  so the map/collection doesn't feel padded.
- **Detection mechanism.** *Continuous polling* (accurate, battery-hungry) vs **OS geofencing**
  (battery-friendly, OS-managed, but limited count — iOS monitors ~20 regions at once).
  **Recommendation:** dynamic geofencing — monitor only the origins near the user's current
  area, re-arming as they move. Continuous high-accuracy only during an explicit "live" view.

**⚠ Challenge "meaningful place = one exact point."** Real meaning is often an *area* (a
district, a harbor, a neighborhood), not a pin. Consider allowing an origin to be a small
polygon/zone, not just lat/lng + radius, for cultural-origin cases.

## 11. Art Origin Data Model

```
Artwork {
  id, title, artist, palette[]        // reuse the existing color extraction
  origin: {
    type: "created" | "depicts" | "cultural" | "museum",
    lat, lng,
    radius_m,                          // or geometry: polygon for zones
    confidence: 0–1,                   // curation certainty
    source,                            // Wikidata Qid / manual / museum record
    note                               // "painted from this spot"
  }
}
```

**⚠ Challenge: "each artwork has exactly ONE origin."**
- *Pro:* simple to curate, simple UX, avoids duplicate encounters. Good default.
- *Con:* many artworks genuinely have several meaningful places (made in Arles, depicts the
  café, culturally Provençal). Forcing one loses richness and forces subjective curation.
- *Trade-off decision:* keep **one *primary* origin** for detection simplicity, but allow the
  data model to store others as non-triggering "related places" shown in the detail. Best of
  both: clean detection, richer story.

**⚠ Coverage is the real problem.** Most public-domain artworks (portraits, still lifes,
abstracts) have **no** locatable origin → the map is empty outside a few art capitals.
Mitigations, in order of preference:
1. **`museum` origin type** — every artwork has a *holding institution* with a real address.
   This guarantees non-zero density in any city with museums, and is trivially sourced.
2. **Curate depth over breadth** — hand-pick a few hundred artworks with strong, real origins
   in target cities (Paris, Kyoto, NYC…). Density where travelers actually go.
3. **Wikidata pipeline** — `coordinate location`, `location of creation`, `depicts` + place
   coordinates. Cheap but noisy; needs confidence filtering + human review.
4. **User/partner contributions** — later.

## 12. Map & Art Walk Summary

Summary contents (priority order): **route polyline**, **the encounters** (artwork thumbnails
placed along the path where they happened), **colors encountered**, then the utilitarian
stats (distance, duration, count).

Reasoning for order: encounters + colors are the *emotional* payload; distance/time are Strava-
brain and should be secondary here. **The color strip is the bridge to the core product** —
each encountered artwork contributes its palette, so *your walk has its own palette*, which can
flow into the Collection ("the colors of your Kyoto morning"). This is the feature's best idea:
travel and the daily color diary become one artifact.

**⚠ Offline maps.** Travelers are often roaming/offline. A summary that needs live map tiles
fails exactly when it's most used. Options: cache tiles for the walk area, use a lightweight
vector/abstract route render (no real map needed — a stylized path on the app's dark canvas
could be *more* on-brand than Google-style tiles), or download-region-first. **Recommend an
abstract, brand-styled route** over literal map tiles: cheaper, offline-friendly, prettier,
and it keeps the focus on art not cartography.

## 13. UX Flow

- **Entry point** — *decision:* a dedicated **Walk** affordance vs a mode toggled from Home.
  A 4th nav tab signals "this is a big thing" (raises expectations + adds permanent clutter);
  a contextual "Start an Art Walk" surfaced when the user seems to be traveling is lighter.
  **Recommend:** a single prominent entry (not a permanent tab) until the feature is proven.
- Start → minimal live state (or fully background) → end → **Summary** (the hero screen) →
  Save / Share → encounters appear in Collection.

## 14. Edge Cases

- **Empty walk (no origins nearby).** Most common case outside art cities. Must feel *calm*:
  "A quiet walk today — no art crossed your path." Never "0 encounters ✗." Optionally show the
  route + colors of the user's *own* surroundings if we can (ties to color hunt).
- **Vehicle movement** (car/train/plane) — speed filter + dwell; never record drive-by.
- **GPS loss** (tunnels, indoors, urban canyon) — degrade gracefully; don't fabricate.
- **Inside the actual museum** — the user is *at* the origin (the museum holds the work). Is
  that an encounter? Probably yes, and a special one. Decide.
- **Same origin, multiple times / multiple days** — dedupe rules (§10); mark repeats.
- **Battery dies / app killed mid-walk** — persist incrementally so a partial walk survives.
- **User forgets to stop** — auto-end on prolonged inactivity; cap walk length.
- **No connectivity** — full offline path (see §12, §15).
- **Sensitive locations** (home, clinics, etc.) — never surface, never share by default (§16).
- **Location spoofing / fake walks** — acceptable to ignore (no competition = low incentive to
  cheat; another reason the non-competitive stance is good).

## 15. Technical Considerations

- **⚠ Background location = native.** iOS/Android support background geofencing + "Always"
  location; **web/PWA cannot** reliably track in the background. Consequences:
  - *Option A — go native* (Capacitor/React Native wrapping, or native): unlocks the true
    passive vision; large scope + app-store overhead.
  - *Option B — foreground-only "active walk"*: user keeps the app open/screen-on while walking
    (like some run trackers). Less passive, worse battery, but shippable on web. A viable *v0*
    to test demand before going native.
  - *Recommendation:* validate with Option B (or even a manual "check what art is near here"
    with no tracking), and treat full passive Art Walk as the reason to invest in native later.
- **Geofence limits** (iOS ~20 regions) → dynamic re-arming around the user.
- **Battery** — geofencing over continuous polling; no high-accuracy unless a live view is open.
- **Offline** — cached/abstract maps, on-device origin dataset for the region.
- **Data pipeline** — ingest + geocode + confidence-filter origins; ongoing curation cost.

## 16. Privacy Considerations

Continuous location is among the most sensitive data a phone holds. Non-negotiables:
- **Explicit, informed opt-in**; clear "why we need location," granular (tracking vs
  notifications separate).
- **On-device first** — compute encounters locally; don't ship raw routes to a server unless
  the user opts into cloud sync.
- **Minimal retention + easy delete** — user can delete any walk/route permanently.
- **No precise-location social exposure by default** — shared summaries should be shareable
  without leaking exact home/route unless the user chooses.
- **Never surface sensitive places**; comply with GDPR/《個資法》; no selling of location data
  (consistent with an ad-free product stance).

## 17. Success Metrics

- **Leading (health of the idea):** % of travelers who enable Art Walk; walks started; **median
  encounters per walk** (the density-health metric — if this is ~0, the concept is failing);
  summary open rate; save + share rate.
- **Lagging (value):** traveler retention / reactivation; encounters flowing into Collection;
  qualitative delight ("I looked up and there it was").
- **Guardrails:** location-permission opt-out rate, battery complaints, notification opt-out.

**⚠ Challenge the metrics.** Encounter *count* is a vanity metric that will tempt us to loosen
detection and pad the map — destroying the "meaning through scarcity" principle. Protect a
qualitative north star: *did the user feel a moment of wonder?* Measure via post-walk
micro-survey, not just counts.

## 18. Risks & Open Questions

- **Platform risk (highest):** passive vision needs native; conflicts with web-first strategy.
- **Data density risk:** sparse origins → empty walks → dead feature outside art capitals.
- **Battery/permission friction:** "Always" location is a big ask; opt-out could be high.
- **Retention risk:** reflective-not-competitive may be too quiet to bring people back.
- **Scope risk:** far larger than the core; wrong bet for a solo builder to make early.
- **Curation cost:** ongoing human effort to keep origins meaningful and correct.
- **Cannibalization:** two modes may dilute the simple daily loop.

Open questions: notify-on-encounter default? one origin vs primary+related? museum-as-origin
yes/no? dedicated tab vs contextual entry? abstract route vs real map? native now or later?

## 19. Future Opportunities

- **Drop "Travel" framing** → "Art Walk" for *locals* too (the Local Stroller persona); travel
  is just the highest-value case, not the only one.
- **Curated Art Walk routes** — "a 40-min Vermeer walk in Delft" — turns passive discovery into
  an optional guided experience (and a monetization/partnership surface with museums & tourism
  boards).
- **Walk palettes → Collection** — each walk becomes a color entry; deepen the one-collection
  story.
- **Gentle social** — share a walk's route+art+colors as an art object (still non-competitive).
- **AR at the origin** — stand where it was painted, see the painting overlaid.
- **Premium** — Art Walk / curated routes as a paid tier once the free core has an audience.
