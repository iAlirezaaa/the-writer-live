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

## MAYOR-017 — Tehran georeference contract (2026-11-09)
- [x] Register independent task before editing skill: `city/tasks/MAYOR-017-tehran-georeference-contract.md`.
- [x] Inspect `web/urban-plan.js`: exact WGS84 writer-home coordinates already present, local X east / Z south; existing roads remain procedural, NOT mapped Tehran streets.
- [x] Document accuracy, licensing and regression release gates in municipal skill.
- [ ] Run geospatial round-trip, urban, road, scene and night tests in checkout; not executed in this audit.
- [ ] Source licensed Tehran GIS road/building/elevation data and compare against site coordinates before scene changes.

### Two backlog ideas (MAYOR-017)
1. **Tehran parcel provenance ledger:** city-only table of geographic features with license, capture date, projection, confidence and source-to-scene error.
2. **Georeferenced visual discrepancy viewer:** optional debug-only overlay of actual mapped street centerlines against simulated road meshes, with meter-scale error badges and no changes to citizen routing.

Status: documentation-only. No geometry, weather runtime, citizen paths, public pinned assets or deployment changed. No test execution or real-world accuracy claimed.

## MAYOR-019 — Tehran environment source-of-truth (2026-11-09)
- [x] Create independent task `city/tasks/MAYOR-019-tehran-live-clock-weather-contract.md` before changing municipal QA guidance.
- [x] Audit anchor and timezone declarations in `web/urban-plan.js`; confirm procedural geometry is not a surveyed Tehran street map.
- [x] Document timezone/solar-phase/weather provenance and stale-data acceptance gates in `city/skills/city-regression/SKILL.md`.
- [ ] Trace actual city clock, sky and weather runtime consumers and implement only after source/probe validation.
- [ ] Run Node scene/geometry tests and visual day/night/mobile checks; NOT RUN in this documentation-only iteration.
- [ ] Confirm fresh Pages build before claiming any deployment; NOT VERIFIED.

### Two new backlog ideas (MAYOR-019)
1. **Solar-phase fixture set**: reference Tehran seasonal sunrise/sunset timestamps with deterministic rendering snapshots and boundary checks.
2. **Weather provenance badge**: compact observed-at/source/freshness display in city diagnostics; no render-loop network calls or private location exposure.

Status: documentation-only; no runtime files, roads, citizen paths or author/publisher data modified. Public mirror is documentation-only; live weather and solar-driven lighting are NOT yet implemented or verified.

## MAYOR-020 — weather coordinate/provenance audit (2026-11-09)
- [x] Register task `city/tasks/MAYOR-020-weather-anchor-source-audit.md` before editing municipal guidance.
- [x] Compare home anchor (35.715361987616696, 51.3642455031707) to the forecast request (35.6892, 51.3890): coordinates differ.
- [x] Document that Open-Meteo forecast `current` values are model-based estimates, not direct on-site observations.
- [ ] Change weather request only after deterministic coordinate, clock, fallback and existing city/scene probes pass.
- [ ] Browser-level network, day/night visuals, Pages deployment: NOT VERIFIED.

### Two new backlog ideas (MAYOR-020)
1. **Single-source weather anchor adapter**: generate provider query coordinates from `TEHRAN_GEO_ORIGIN` and add an exact-coordinate assertion in the environment probe, without touching any citizen route.
2. **Model-versus-station provenance switch**: show weather source type, sample location, observation/model timestamp and freshness in a compact city-only diagnostics badge.

Status: documentation-only; no runtime files changed, no executable tests run, no deployment claimed.

## MAYOR-022 — stale weather regression assertion (2026-11-09)
- [x] Register independent `city/tasks/MAYOR-022-weather-probe-anchor-regression.md` before code edits.
- [x] Replace outdated latitude 35.6892 assertion in private `tests/tehran_environment_probe.mjs` with exact home latitude/longitude and `Asia/Tehran` checks.
- [x] Mirror only the test to public `tests/tehran_environment_probe.mjs`.
- [ ] Execute Node probes and browser/Pages verification; not confirmed in this run.

### Two backlog ideas (MAYOR-022)
1. **Shared anchor test import:** read `TEHRAN_GEO_ORIGIN` directly from the city plan in the probe, eliminating duplicated numeric coordinates in test assertions.
2. **Weather source parity CI:** block city-only releases when the public pinned environment source differs from the private source or when a test references obsolete Tehran-center coordinates.

Status: test-only source correction; no runtime assets, city geometry, traffic, citizens, writer/publisher state or live deployment changed. Node/browser test execution NOT VERIFIED.

## MAYOR-024 — weather freshness contract reconciliation (2026-11-09)
- [x] Register independent task before skill edits: `city/tasks/MAYOR-024-weather-freshness-contract.md`.
- [x] Read current environment module and probe: parse rejects timestamp difference >90 min; snapshot cache needs fetch age <45 min and source age <100 min; poll interval 15 min; failure retry 75 sec.
- [x] Correct regression guidance: earlier 30-min freshness limit is aspirational, not implemented. Provider `current` is model-derived, not station-observed.
- [ ] Run deterministic boundary tests, live API fetch, Tehran night/day browser snapshots and full urban/road/scene probes: NOT RUN.
- [ ] Verify public documentation parity and fresh Pages deployment separately; no runtime release in this iteration.

### Two backlog ideas (MAYOR-024)
1. **Forecast freshness boundary harness**: deterministic fake-clock cases for 44/45-min fetch age, 89/90/91-min parse age, 99/100-min provider age, and 74/75-second retry, without external network calls.
2. **Forecast attribution micro-panel**: show model-estimate label, provider timestamp, cache age and unavailable status, without claiming station observations or altering writer/citizen clocks.

Status: documentation-only. No geometry, traffic, author/publisher/citizen data, runtime weather source or deployment modified. Existing Node/visual acceptance tests NOT EXECUTED.


## MAYOR-026 — Geographically faithful Tehran writer block + 3Dviz Pro Max (2026-11-09)
- [x] Register independent TODO first: `city/tasks/MAYOR-026-tehran-writer-block-3dviz-contract.md`.
- [x] Confirm the existing WGS84 home anchor **35.715361987616696, 51.3642455031707** in `web/urban-plan.js`. Current roads/buildings are procedural, **not** one-to-one Tehran geography.
- [x] Confirm the full skill is already vendored privately at `cognition/skills/3dviz-pro-max/`, with a Twin World integration guide. Keep local Three.js and use this skill to rebuild one city prop/structure at a time.
- [x] Define geographic reconstruction **limited to the actual road-bounded writer block**, pending legitimate map-footprint/perimeter evidence. City expansion elsewhere is paused, not erased from historical backlog.
- [x] Create `city/skills/tehran-writer-block/SKILL.md` and update city handbook, urban code, municipal growth and release-gate instructions. Update existing hourly "شهردار شهر نویسنده" automation; retain its cadence and previous safety requirements.
- [ ] Source licensed street/parcel/elevation data and document the exact block polygon, uncertainty and attribution before altering the runtime world.
- [ ] Conduct screenshot comparison to real geography, street-level and overhead before claiming that Tehran was recreated.
- [ ] Runtime city geometry/object rebuild in this iteration: **NOT PERFORMED**. No tests or Pages deployment claimed from documentation updates.

### Two additional backlog ideas — MAYOR-026
1. **Map evidence coverage ledger** — georeferenced feature registry showing dataset/license/date, positional uncertainty and unknown surfaces so no prop is described as 1:1 without evidence.
2. **Old-vs-new 3D prop proof gate** — reproducible 3Dviz workflow using silhouette/ground contact/material/LOD assessments, close + wide screenshot comparisons and frame-budget tests before replacing low-fidelity objects.

Status: instruction changes and automation updated; geographic capture, real modeling and performance verification remain pending.


## MAYOR-027 — Freeze current map before accurate Tehran rebuild (2026-11-09)
- [x] Snapshot the entire private source repository at `cfdac995b6e070d472627b484c93d8fbf5f6ed2b` on `backup/writer-block-pre-tehran-rebuild-2026-11-09`.
- [x] Snapshot the entire public deploy repository at `ececf9ffc041b1666b0425f4f1746d162b9dcf67` on the identically named backup branch, including pinned city overlays and public town snapshot.
- [x] Add `city/backups/writer-block-pre-tehran-rebuild-2026-11-09.md` with exact Git blob checksums, recovery links and **selective, city-only** rollback instructions.
- [x] Update `city/skills/tehran-writer-block/SKILL.md` and `city/skills/mayor-release-gate/SKILL.md` to require snapshot verification before future geometry changes.
- [ ] Capture comparable overhead/street-level/night/day baseline visuals before the first real-world mesh replacement; none claimed by this Git backup.
- [ ] Implement real Tehran block geometry only after verified map source and license; **no geometry edited by this backup task**.

### Two ideas (MAYOR-027)
1. Run a test-only map rollback to a temporary branch using the restricted city-file allowlist, then verify urban/traffic/citizen compatibility without affecting live production.
2. Store a fixed camera baseline comparison set for the legacy map and each audited Tehran-block replacement, with source-attribution and frame-time notes.

Backup branches preserve exact source revisions. Runtime tests and Pages redeployment were not needed for branch creation and are not claimed here.


## MAYOR-028 — sourced Tehran writer block (2026-11-09)
- [x] Verify immutable recovery branches from 2026-11-09 (private cfdac995 / public ececf9ff) before any new mapped objects.
- [x] Write city-only task first: `city/tasks/MAYOR-028-osm-writer-block-basemap.md`.
- [x] Develop source-aware WGS84 local transformation, read-only official OSM / Overpass fallback, way/node compiler, boundary-face extraction and data-provenance guards.
- [x] Export ODbL-attributed actual OSM data for a 230 m survey around 35.715361987616696, 51.3642455031707. 47 road ways, 7 footprint ways, no surveyed building heights.
- [x] Derive the containing **OSM roadway-centerline candidate** polygon (~12,265 m²; four named source ways), labelled provisional not parcel-accurate. Do not replace the legacy town from the source alone.
- [x] Six source/regression tests passed on [public CI run 42592983509](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42592983509), which also acquired the real map JSON. Private workflow failed and logs unavailable; no claim of successful private CI.
- [x] Persist map data under `city/survey/output/writer-block-survey.json`; city-only docs/scripts/tests are mirrored privately/publicly. View `city/survey/README.md` for provenance and exact limitations.
- [ ] Build isolated source-backed Three.js 3D survey preview with measured street *centerlines* and available plan outlines only. Do not invent building height or road width.
- [ ] Collect licensable accurate facades/ground elevations/curb widths, compare screenshots and replace only one proven object using 3Dviz Pro Max and existing city safety/LOD gates.
- [ ] Full real Tehran scene reconstruction and visual/throughput acceptance: **NOT DONE**; no existing town roads, houses or car/citizen routes changed.

### Two new backlog ideas — MAYOR-028
1. **Street alignment uncertainty overlay** — georeferenced before/after distance and confidence comparisons between fictional and OSM road centerlines, protected author scene IDs.
2. **Licensed asset provenance + 3Dviz proof gate** — asset catalog of verified real Tehran street fixtures, photos and geometric constraints with one-object safe replacement checks and LOD review.

Status: one source-backed GIS baseline completed and archived, no premature runtime city-map publication.


## MAYOR-030 — Visible OSM road-centerline preview (2026-11-09)
- [x] Registered independent city task before runtime edits and checked exact frozen backup refs in both repos.
- [x] Created one source-backed, non-colliding overlay in `web/writer-block-road-preview.js` and wired it into the existing town scene. This is **visual geography**, not surveyed roadway surfaces.
- [x] Lightweight in-process JS geometry check: source coordinates match survey polygon, area ≈12,264.69 m², writer home contained, one mesh and finite ground coordinates, existing urban plan audit still valid.
- [ ] GitHub Actions executable test and browser street/day/night screenshots: blocked/unverified; runner did not start jobs. Do not claim website deployment or measured GPU/visual performance.
- [ ] Public pinned-city source parity and Pages deployment: record only after attempting public sync.
- Backlog idea A: OSM source-versus-procedural map layer switcher with license/source attribution.
- Backlog idea B: geographic difference heatmap clipped to the writer block, showing mismatch without automatic street replacement.
