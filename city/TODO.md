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
- [x] Public GitHub Actions real Three.js/scene/traffic tests and Pages deploy succeeded in run 42604022465. Real browser street/day/night screenshots and GPU performance remain unverified.
- [x] Public pinned-city source parity and Pages deployment verified: run 42604022465; weather pinned mismatch repaired in MAYOR-031.
- Backlog idea A: OSM source-versus-procedural map layer switcher with license/source attribution.
- Backlog idea B: geographic difference heatmap clipped to the writer block, showing mismatch without automatic street replacement.

## MAYOR-031 — Unblock public Pages by pinning canonical Tehran weather (2026-11-09)
- [x] Trace failing run 42603491954 to stale public `.github/city-assets/tehran-environment.js` requesting 35.6892 rather than writer-home anchor 35.715361987616696.
- [x] Create independent TODO before one-file pinned repair, sync private-approved weather source; public commit `65515b71fa9eeb703ada4d377d21232635311acc`.
- [x] Confirm `TEHRAN-ENVIRONMENT-OK`, writer-block preview and complete city scene/traffic tests plus Pages deployment in https://github.com/iAlirezaaa/the-writer-live/actions/runs/42604022465.
- [ ] Real browser day/night weather screenshot remains pending.
- Backlog A: add CI parity check for city weather module and its pinned public copy.
- Backlog B: live-page smoke test for geo origin, map preview availability and attribution visibility.

## MAYOR-032 — Tehran writer-block sourced SRTM terrain (2026-11-09)
- [x] Checked both frozen pre-Tehran backup refs and matching manifest; read required 3Dviz/TWIN-WORLD, coordinate and contour recipes.
- [x] Captured 64 genuine NASA/USGS SRTMGL1 V3 samples via OpenTopoData `srtm30m`, approx. 30m raster, EGM96 heights 1234–1243m; stored time-stamped private/public evidence under `city/survey/output/`.
- [x] Added clipped Three.js topographic mesh (203 triangles, hidden by default for safety) and 21 visible contour segments at 2m increments without changing physical ground, sidewalks, citizen routes or building footprints.
- [x] Public pinned city modules synchronized; actual GitHub Pages build and deployment passed: https://github.com/iAlirezaaa/the-writer-live/actions/runs/42609544002 .
- [ ] Real street/aerial/day/night screenshots and performance comparison not captured; no claim of 1:1 elevation reconstruction.
- Backlog idea 1: graded access ledger checking building door, pavement and zebra crossing heights against finer licensed/surveyed terrain.
- Backlog idea 2: interactive inspection mode for DEM ghost relief versus contour map and OSM way centers, without modifying physical simulation until certified.

## MAYOR-033 — One city-side balcony construction detail (2026-11-09)
- [x] Created independent task before edits; verified both immutable 2026-11-09 recovery refs and shared manifest.
- [x] Implemented a single 22-member railing on `home-east` upper-left procedural balcony, snapped to existing slab/wall; one draw call with 792 vertices and no traffic or pedestrian edits.
- [x] Preliminary JavaScript geometry preflight: home/rail inside OSM writer-block candidate, exact slab contact, no collider, existing plan audit passes.
- [ ] Real Three.js CI, scene layout, housing access, traffic, public Pages and visually captured day/night screenshots: pending explicit run evidence.
- [ ] No building footprint/height evidence inside block; do not call the improved home a true Tehran building.
- Backlog 1: per-building documented/inferred/procedural facade ledger, licensed OSM/survey reference per component before claiming a real Tehran facade.
- Backlog 2: reusable close-up LOD balcony/rail kit with slab/wall attachment probes and no nav-collision regression; require photo/licensing gate for any specific property.

## MAYOR-034 — Overture writer-block sourced building layer (2026-11-09)
- [x] Registered independently before edits; frozen private/public backup branches and matching manifest verified unchanged.
- [x] Consulted 3Dviz Pro Max SKILL/TWIN-WORLD, historical-diorama and CityGML source/ID recipes; inspected existing room, city and path tests.
- [x] Acquired and clipped 4 actual public Overture building roofprint candidates inside OSM road-bounded writer block. Capture 2026-11-09T12:18:12Z; 0 verified heights, 1 source footprint intersects writer-room reserve. External public acquisition was necessary because private Actions runner did not start; resulting source imported to private canonical repository before coding renderer.
- [x] Created one source-grounded 3D city building layer: 3 transparent symbolic-height 6.0m masses plus a 4th **outline-only** preserved around the writer room; no sources claim real height, no physical colliders, no citizen routing edits.
- [x] Added source/geometry unit tests and registered the renderer through `web/town.js` in private; copied necessary visual assets and test harness to public pinned city modules.
- [x] Real public GitHub Pages tests and deployment verified: https://github.com/iAlirezaaa/the-writer-live/actions/runs/42617301697 ; Overture mapped footprints: 4, generated transparent symbolic-height volumes: 3, writer room preserved. Browser screenshots, actual building heights, performance and 1:1 map parity remain unverified.
- Backlog idea 1: build real-road-to-building topological clearance ledger for mapped OSM centerlines vs Overture ML roofprints; reject any volume crossing known road lines.
- Backlog idea 2: stepwise **writer-room-preserving** replacement of procedurally placed town buildings with source-backed real building footprints, waiting on licensed verified height/entrance and safe navigation updates.

## MAYOR-037 — Real Tehran, one geolocated building at a time (2026-11-09)
- [x] User promoted exact real-city geography to persistent highest priority: see `city/GOAL.md`, `city/buildings/manifest.json`; hourly mayor automation prompt updated without changing cadence.
- [x] Verified private/public frozen backups and common manifest before any city mesh edit; read 3Dviz SKILL/TWIN-WORLD, source-ID/evidence-layer recipes.
- [x] Rebuilt source roofprint `3d7b8239-b1e0-48bc-8868-ae4a4d392586` as an independent city 3D object with identical source six-point boundary (965.737 m²), illustrative 6m height, neutral non-surveyed facade, no collision. Removed only its duplicated transparent bulk ghost; 2 other ghost masses and the room-protected outline remain.
- [x] Added code-level map/area/room validation and real Three.js Node probe, updated district and source probes; copied matching city module/test/pins to public repo.
- [x] Public Three.js Node/scene/traffic tests and Pages deployment succeeded at https://github.com/iAlirezaaa/the-writer-live/actions/runs/42626660016 (source building 01: 60 vertices, 965.737 m², no duplicate). [ ] Real browser screenshots, verified true building height, roof/façade and photographic similarity remain outstanding.
- Next idea 1: compare Microsoft ML / Overture roof clusters with independent higher-resolution licensed data for building-by-building segmentation; do not invent legal parcels.
- Next idea 2: add a per-building calibrated WGS84-ground-contact and aerial-screenshot similarity review, recording source footprint IoU, confidence and screenshot provenance.

## MAYOR-038 — Throw out old fictional city, rebuild source-only writer block
- [x] Required independent task created first; both original frozen backup
  branch SHAs and matching recovery manifest verified.
- [x] The live town now defaults to `web/town-tehran-rebuild.js`; all older
  houses, fictional district geometry, 432-place housing blocks, mountains,
  road-grid cars and decor are **not instantiated** in that town group.
- [x] Real-map default consists of OSM street-frame, coarse SRTM, Overture
  roofprint candidates, and one individually mapped roofprint shell; writer
  room and exterior remain independently owned by world.js.
- [x] Kept legacy fallback only by explicit `mapMode:"legacy"`, and
  switched prior regression harnesses to legacy mode without touching writer
  data/citizen identity/routine source.
- [x] Actual source-only Three.js city test, public pinned-world cache, and Pages deploy confirmed in https://github.com/iAlirezaaa/the-writer-live/actions/runs/42628790047 ; zero fictional city meshes, four source map layers, writer room preserved.
- [ ] Public browser screenshot/FPS/visual-accuracy survey; footpaths and citizen avatars are owned outside town and not relocated yet.
- Backlog A: map the existing fictional citizen path visuals to future
  surveyed real sidewalk/crosswalk geometry with strict identity/clock protection.
- Backlog B: licensed roofprint segmentation and height/elevation survey for
  current four potentially merged ML polygons before claiming building counts.

## MAYOR-039 — Second mapped building and floor/store evidence (2026-11-09)
- [x] Created independent task BEFORE edits and verified private/public frozen recovery refs and identical manifest; read required 3Dviz Pro Max, twin-world, source-ID and evidence-layer recipes.
- [x] Audited 54 OSM nearby features (7 buildings, 47 roads), **no recorded shop/commercial tags and no building:levels** in this snapshot; mapped OSM alley service ways are outside the approved block. The 4 Overture within-block candidate roofprints also lack real heights/floor counts.
- [x] Reconstructed the exact 15-vertex aerial polygon for Overture ID `3d2290d6-c533-4c11-b2c0-079f0ee2e29e`, 1035.58 sqm, in an independent one-mesh 3D shell with a symbolic 6m envelope and single 3m metric guide; no invented shop names/doors/windows.
- [x] Retired duplicate translucent Overture volume; updated default sourced town from four to five groups, two independently modeled footprints plus one bulk anonymous mass and one writer-room-protected outline.
- [x] Actual Three.js tests for second mapped building, source-only renderer and legacy layout passed: https://github.com/iAlirezaaa/the-writer-live/actions/runs/42642944967 .
- [ ] Public Pages deployment **BLOCKED**: pre-existing legacy citizen-route test fails at local X=0 Z=8.7; same failure in previous run https://github.com/iAlirezaaa/the-writer-live/actions/runs/42641786729 . No citizen route rewrite or test bypass undertaken.
- [ ] Actual screenshots, surveyed storeys/shop names and real alley topology remain unavailable; do not claim verification.
- New backlog A: query licensed commercial/shop/POI addresses inside the block and verify frontage alignment before creating any real storefront.
- New backlog B: collect legally reusable building heights, `building:levels`, entrances and interior access/service alleys per source polygon; only then replace schematic floor guides and roads with surveyed 3D shapes.

## MAYOR-042 — finish the real-source building 03 and ensure render bounds (2026-11-09)
- [x] Create an independent TODO in `city/tasks/MAYOR-042-complete-third-building-validation.md` before any code changes.
- [x] Retire empty bulk mesh from the displayed source-only scene; preserve all four mapped Overture outlines.
- [x] Align `town-tehran-rebuild.js` evidence guard and geometric regression expectations with third independent source plan.
- [ ] Execute real Node/Three.js and legacy probes, capture street/overhead/day/night frames, then publish private→public only if release gates pass.
- [ ] Verify any eventual Pages deployment by run ID, not historical success.

### Two NEW backlog ideas (MAYOR-042)
1. **Licensed facade confidence index:** each source-backed building side records independently verified windows, entrances, shop POIs and levels with dates/rights/uncertainties before detailed modeling.
2. **Camera-anchored evidence diff:** reusable aerial and street cameras with georeferenced source outlines, screenshot hashes and bounded FPS counters to quantify each visible city revision.

## MAYOR-043 — Populate Tehran writer block visibly without replacing geography (2026-11-09)
- [x] Independent pre-change task `city/tasks/MAYOR-043-writer-block-live-streetscape.md` registered privately.
- [x] New compact Three.js interpretive city layer: 19 trees, 27 shrubs, 16 lampposts, 9 stationary display cars placed by sourced one-block road ring and exclusion checks; 11 InstancedMesh drawables.
- [x] Direct Three.js scene assembly checked: 7 groups, 25 renderables, finite bounds, preserved writer room/exterior, 3 independent source roofprints, zero physical traffic and no citizen-route mutation; night lamp emissive response increases.
- [ ] Browser aerial / street / day / night screenshots and real FPS/visibility: not captured; must not be implied.
- [ ] Legacy-regression and public Pages pipeline: separately inspect; public published SHA only after mirror and successful deploy.

### Two new backlog ideas (MAYOR-043)
1. **Block object provenance inspector:** geolocated evidence table differentiating real OSM/Overture lines from guessed context props, with toggles per confidence level.
2. **Measured frontage + floor registry:** independently licensed levels, entrances, commercial POIs and units for each actual building prior to replacing illustrative architecture.

## MAYOR-044 — Architectural illustrative skins on sourced building masses (2026-11-09)
- [x] Registered stand-alone task before code; consulted mandatory Tehran and vendored 3Dviz skills and license checks.
- [x] Attached Three.js facade illustration to 3 true Overture roofprints, without changing mapped geometry, rooms, citizens or traffic: 40/47/70 repeated bays, nine InstancedMesh objects in total.
- [x] Executed actual vendored Three.js source-only builder in isolated JS: 7 top-level groups, 34 finite-bound renderables; still no physical colliders, no measured facade/height/level/units.
- [ ] Run new authored facade probe in public Pages and certify CI; report public hash only on success.
- [ ] Capture real street, aerial, day, night visual comparisons; do not claim verification without images.

### Two new backlog ideas (MAYOR-044)
1. **Georeferenced licensed façade evidence board:** map each observed shopfront, entrance, balcony and window to actual building ID with date, license and confidence before upgrading illustration to T3.
2. **Architectural animation performance gate:** tune draw calls for rooftop and window variation using measured frame time and low/mobile camera captures, keeping static city physics unchanged.

## MAYOR-045 — authentic OSM road-tag direction and speed overlay (2026-11-09)
- [x] Register independent pre-edit TODO and audit both immutable backups, mandatory Tehran and 3Dviz skills.
- [x] Inspect dated official OSM survey source; identify actual `maxspeed=30` on 4 writer-block road ways, two explicit `oneway=yes`, one `oneway=no`, one unknown.
- [x] Implement source-only diagram: source-way-aligned directional arrows and 30 km/h tags without claiming actual signage positions, adding colliders or changing vehicle/citizen traffic routing.
- [x] Record individual road provenance, local road orientation and tags in `city/roads/writer-block-regulations.json`.
- [x] Direct vendored Three.js scene builder confirms 8 town groups, finite objects, 4 sourced speed labels, 4 diagram arrows, separate preserved author room, zero physics cars.
- [ ] Run mandatory Node and legacy regression in public Pages CI, inspect outcomes, synchronize pinned assets, and confirm real deployment separately.
- [ ] Actual aerial/street/day/night browser screenshots still required; do not claim observed visual accuracy.
### Two new backlog ideas (MAYOR-045)
1. **Dated road-rule change ledger:** poll only on demand for OSM `oneway`, `maxspeed`, `surface`, `width`, `sidewalk` and matched municipality traffic records, with confidence and license.
2. **LOD2-building evidence ingestion:** verify one Overture `building_part`, floor/height and one independently licensed photo/entrance per source building ID before modifying actual roof, units or shops.
