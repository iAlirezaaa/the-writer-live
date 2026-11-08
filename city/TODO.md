# Municipal development register — The Writer
Updated: 2026-11-08. Owner: City subsystem only. Private authoring repo is the source of truth; publish only matched public assets.

## Iteration 001: prepared and implemented in authoring source
- [x] Confirm separate municipal skills and protected author/publisher/citizen subsystems.
- [x] Extend the road **graph** from the south junction to western civic services, the eastern residential area and the eastern forest; add a connected film-studio service spur.
- [x] Build 12 x 4-storey housing blocks with 3 flats/floor x 3 people/flat: **432 planned resident places**, not active simulated agents.
- [x] Build a school, police station, screenplay/decoupage office and out-of-town film studio without editing writer/publisher logic.
- [x] Add northern mountain distance layer, eastern trees, five animated birds, two ambient cats, and pooled seasonal particle weather.
- [x] Add four traffic-regulation signposts, a shared window/trunk/foliage instancing library, and public explorer entries.
- [x] Extend the geometry and capacity acceptance probes.
- [x] Synced reviewed assets and documentation to public pinned repo in [7152a8e](https://github.com/iAlirezaaa/the-writer-live/commit/7152a8ed29a7aaab492bd71d378ca217571c8750).
- [x] Public Pages build/deployment succeeded: [run 42497633411](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42497633411).
- [ ] Street-level, day/night and mobile screenshot reviews remain unverified; do not declare visual QA complete.

## Next municipal backlog
- [ ] Map real pedestrian clearances, marked crosswalks and step-free ramps beside the new school and police station.
- [ ] Make 20–30 km/h speed-zone and yield behaviour enforceable in car trajectories, not only signage, without breaking current crossing priorities.
- [ ] Introduce inside-out LOD interiors for school classrooms, police reception and screenplay/storyboard wall, only loaded when inspected.
- [ ] Add weather controls that are explicitly fictional and coordinated with the existing sky/day-night state.
- [ ] Create procedural seeded micro-event scenarios: lost umbrella, town clean-up, gallery opening, school bell; reuse the same motion archive.
- [ ] Add city navigation entrances, footpaths to the film studio and a safe turn-around/parking bay.
- [ ] Automate pin consistency checks and city-only regression dashboards before publishing.

## Two new ideas proposed by the municipal maintainer
1. **Urban seasonal archive**: a tiny set of reusable street-furniture/foliage variants and autumn/winter overlays with no duplicate textures or geometry.
2. **City secrets index**: discoverable environmental clues (film slate 102, hidden rooftop telescope) that reveal purely fictional history in the existing city guide, without influencing the writer's thoughts or achievements.

## Safety and reporting
Every session: mark new TODO first; change source; run the urban/city/scene probes; sync the public pin files; verify deployment, then mark done with commit/PR references. Mark visual inspection as pending until screenshots are actually examined. Do not publish private data or modify story archives, memory, resident roster, publisher logic or animation library identity.

## Iteration 002 — city-only QA inventory (2026-11-08)
- [ ] Before geometry changes, inventory pedestrian-access checks for school, police, housing and film studio; keep all scene geometry unchanged in this iteration.
- [ ] Confirm public pinned-file mapping and current deployment status before any runtime publication.
- [ ] Record verification status honestly; no browser visual inspection or runtime probes have been executed by this documentation-only update.

## Two new backlog proposals (iteration 002)
1. **Accessible civic wayfinding**: reusable tactile crossing markers and high-contrast wayfinding near school/police, gated by 1.5-unit unobstructed pedestrian width and door-landing probes.
2. **Shared night-light budget inspector**: diagnostic overlay counting unique lights, draw calls and instanced emissive windows per district; no additional lights at runtime.

## Iteration 003 — reproducible municipal gate (2026-11-08)
- [x] Register a documentation-only acceptance-gate task before editing skills; no geometry, traffic, animation or citizen paths changed.
- [x] Add a precise pass/fail evidence template to `city/skills/city-regression/SKILL.md` (source revision, probes, pinned mirror, Pages run, visual states).
- [ ] Run the Node probes in a checkout and capture exit codes; connector file reads do not execute them.
- [ ] Compare private source and public pinned blobs and inspect latest Pages run before any runtime publication.
- [ ] Capture street, aerial, day, night and mobile screenshots for physical access validation.

## Two new backlog ideas (iteration 003)
1. **Municipal clearance manifest**: machine-readable civic doorway/sidewalk/crosswalk clearance fixtures, versioned under `city/` and validated before runtime changes.
2. **District ambience density cap**: per-district pooled bird, cat, foliage and weather budgets with a deterministic performance benchmark, without touching citizen paths.

Status: documentation-only; runtime probes, visual QA and deployment for this iteration NOT VERIFIED.

## Iteration 004 — pinned-source parity checklist (2026-11-08)
- [x] Register this bounded, documentation-only task before modifying municipal skills.
- [x] Audit six private-to-public city pin mappings: all six Git blob SHAs matched at audit time (urban-plan, road-surface, town-districts, town, world, city-growth).
- [ ] Execute geometry and scene probes in a runnable checkout before any runtime change; this iteration changes no runtime assets.
- [ ] Record fresh Pages status separately from prior successful deployment.

## Two new backlog ideas (iteration 004)
1. **Pin drift sentinel**: compare a declared allowlist of private city source blobs with public pinned assets at each publication and block any mismatched runtime release.
2. **Civic access evidence cards**: generate per-building school/police/studio entrance cards with coordinates, clearance, ground height and screenshot reference, without storing citizen routes.

Iteration 004 evidence: six source/pin blobs matched via GitHub fetch_file (2026-11-08). Node geometry/scene probes NOT RUN; screenshots NOT INSPECTED; new Pages deployment NOT VERIFIED. Documentation-only; no runtime publication authorized.

## MAYOR-013 — Tehran weather freshness documentation (2026-11-08)
- [x] Register independent TODO at `city/tasks/MAYOR-013-tehran-weather-staleness-audit.md` before editing skills.
- [x] Inspect private Tehran environment module and existing regression probe; compare the private module SHA against both public copies: `b4c23c71328a3838d30facbec998e96530a6ea45` in all three locations at audit time.
- [x] Extend municipal release-gate skill with timestamp, cache, retry, midnight and provider-failure test matrix.
- [ ] Execute Node tests, real-browser provider fetch, visual QA and fresh Pages deployment checks; none executed in this documentation-only audit.

## Two new backlog proposals (MAYOR-013)
1. **Provider timestamp contract fixture**: a deterministic, city-only set of weather payloads covering explicit offsets, offset-free Tehran time, stale readings and malformed fields.
2. **Weather fallback visual snapshot**: compare dawn, noon, dusk and midnight lighting under fresh, unavailable and just-expired provider states without altering citizen clocks.

Release: documentation only; no runtime assets changed or newly deployed; test execution and real-time Tehran weather in production NOT VERIFIED.

## MAYOR-014 — weather regression evidence (2026-11-08)
- [x] Register independent task before editing skills/backlog.
- [x] Compare private/public `tests/tehran_environment_probe.mjs`: both blob SHA `6142e53403f29ae2ffcd61869c2fae07d7fc8ca5`.
- [x] Inspect previous CI: private `tehran` job in run 42512547908 concluded **failure**; public `deploy` job in run 42512570666 concluded **success**.
- [ ] Diagnose private failure: job log fetch returned 404 BlobNotFound; no assertion-level diagnosis available.
- [ ] Run Node probe and browser visual/network QA for a new revision; not executed here.

## Two new backlog proposals (MAYOR-014)
1. **Weather CI artifact retention:** upload deterministic Tehran probe stdout/stderr and test result as short-lived GitHub Actions artifacts for reproducible diagnosis, without private state.
2. **Clock/weather split-status badge:** city-only diagnostic badge displaying separately the last verified Tehran clock test and live provider-fetch age; never mislabel cached or unavailable weather as live.

Release: documentation-only. Previous public deploy success is historical and does not validate new runtime behavior; private CI remains red.


## MAYOR-016 — Clock-driven routed traffic (2026-11-09)
- [x] Independent TODO registered before runtime changes in `city/tasks/MAYOR-016-clock-driven-traffic-graph.md`.
- [x] Replace repeating four straight lanes with clock-anchored directed routes and turning arcs that stay inside the actual road union.
- [x] Add 4 junction signals, pedestrian-demand signal poles clear of citizen sidewalks, headlights for Tehran night, braking and turn indicators.
- [x] Add public/private matching route geometry, reload-continuity and night-headlight regression tests.
- [x] Public CI `CITY-TRAFFIC-OK` passed: [run 42534337743](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42534337743).
- [x] Pages release successful after an independent repository correction of the unrelated world.js syntax error: [run 42534627200](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42534627200). City work did not alter writer logic.
- [ ] Browser-level nighttime render, GPU/light budget and long-run real intersection collision observation require visual verification.

### Two proposed backlog ideas (MAYOR-016)
1. **Intersection occupancy arbitration**: safe turn/merge tokens with right-of-way priorities that prevent car overlap without reintroducing deadlocks.
2. **Adaptive real-light pool**: give SpotLights to only nearby/on-screen headlights while every far car retains emissive lenses and turn/brake visibility.
