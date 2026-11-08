# MAYOR-016 — Clock-driven traffic graph and real night headlights
Date: 2026-11-09
Status: IMPLEMENTED / synchronized; city regression and Pages deployment passed; live browser visual QA pending.

## Reported defects
- Vehicles only follow straight lanes / short repeated loops.
- 3-car grouping and reload restarts despite earlier offsets.
- At night emissive material alone does not illuminate surrounding asphalt.

## Scope and acceptance
1. Replace straight-line wrap with directional turns along connected asphalt roads. Route choices must vary over a long deterministic sequence, anchored to wall-clock time (Tehran local clock for lighting), not page elapsed time.
2. Never allow off-road wheel centers; ensure path samples stay inside `ROAD_SEGMENTS` road-surface union. Protect crosswalk and no-touch citizen schedules.
3. Add visible headlamp elements and a bounded budget of real light sources, night/dusk switching based on Tehran time and scene-day factor; brake and turning indicators.
4. Add executable deterministic route, overnight and reload tests to existing city traffic probe.
5. Validate private source, then synchronize public `web/town-cars.js` and pinned `.github/citizens-assets/town-cars.js`. Inspect live CI deploy outcome.

## Safety gate
Only city vehicle code, tests and city documentation. No writer/publisher logic, citizen paths, snapshot, secrets or unrelated app changes.

## New backlog
- Dynamic turn-signal prioritization and intersection occupancy lock to prevent future gridlock.
- Camera-proximity adaptive headlight shadow/light pool budget for mobile devices.

## Test & publish log
Pending.

## Implementation and verification report (2026-11-09)
- Vehicle routes use a directed junction graph aligned to the authored road plan (north-residential and south civic blocks), 12 independent fixed-seed fleet itineraries, legal quadratic turns, and absolute-epoch initial phase. Four cross-traffic signal junctions change phase in wall-clock time.
- Prior 64-unit modulo lanes and grouped starting slots were removed. Route lengths are about 33 km per vehicle before the deterministic itinerary wraps; this is long-cycle movement, **not a mathematically non-repeating infinite simulation**.
- Night lights use Tehran civil-time plus the scene's day/night factor. All headlights have visible luminous lenses and volumetric cone meshes; six shared-budget shadowless spotlights illuminate the road. Braking and turn indicators are animated.
- Moved crossing signal posts behind the authored `z=11.3` public footpath after an actual town-scene geometry failure.
- In a V8 mock-Three diagnostics run, 181,147 road-graph samples were on asphalt (0 offroad). A simulated crossing-demand run had 0 proximity errors. These are mocked checks, not visual browser acceptance.
- **Real Node/Three.js public CI run**: https://github.com/iAlirezaaa/the-writer-live/actions/runs/42534337743
  - PASS `CITY-TRAFFIC-OK` with stopped cars, request frames, crossing frames and swept person gap.
  - PASS urban plan, road topology, city housing access, town-scene layout/paths/wiring, observatory and citizen probes.
  - A prior deployment failed at an unrelated `web/world.js` syntax error (writer forearm animation). The public file was subsequently restored to match the private source by another repository update; this city task did not modify writer animation logic.
- Public pinned vehicle modules and town module synced exactly with the private source. Public build guardians, version tokens and observer cache regression updated for the new fleet.
- **Pages deployment verified** in successful workflow [42534627200](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42534627200). This certifies CI build/deploy, not real-browser nighttime lighting, GPU frame time or long-run intersection safety.
