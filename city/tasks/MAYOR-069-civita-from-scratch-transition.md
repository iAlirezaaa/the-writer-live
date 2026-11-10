# MAYOR-069 — Civita city, locals, home shell and live local atmosphere
Date: 2026-11-10
Status: ACTIVE CIVITA ASSETS IN PLACE / TEHRAN-ONLY MAIN ASSETS REMOVED / 1:1 MODEL INCOMPLETE

Owner request: rebuild home, town, pedestrian visuals from Civita di Bagnoregio; preserve author/writer's visual identity exactly. Remove former Tehran-built map features and stale environment from *active scene*, and retire old main-branch assets only after release safety checks. Historic frozen backup branches are not deletable: protect two verified snapshots.

## This change
1. Replace Tehran live weather/time dependency in world.js with a Europe/Rome Civita provider using source-attributed Open-Meteo current conditions and sunrise/sunset, no fake sensor claims.
2. Add a source-aware city pedestrian visual layer in the Civita town builder using already-licensed OSM footpath centrelines; these are *unidentified visual walkers*, not overwrites of character identities or user data, and never fictional mapped routes.
3. Add reversible Civita-style Lo Studio-inspired **interpretive exterior shell** around the preexisting writer room, preserving character mesh, appearance, authored work, camera and safe clickable access. Exact parcel/height unknown; label as study rather than real Lo Studio.
4. Ensure main-world active UI no longer labels Tehran and visual citizens from legacy coordinates do not visually obscure the Civita map. Keep legacy citizen simulator data intact and tests active.
5. CI/public pinned City/reader/observer copy gates must match actual active assets; no unverified deployment claims. Actively used Tehran files deleted/retired only when imports/tests permit; never delete backup branch, historical git objects or unrelated private content.

## Safety and provenance
Private `iAlirezaaa/the-writer` first; public `iAlirezaaa/the-writer-live` only after CI passes. Read 3dviz Pro Max SKILL/TWIN-WORLD and object-craft. Historical backup refs and manifest checked on both repos. OSM way metadata kept, geometry/height unknown explicitly marked proxy. Open-Meteo forecast uses current model data and local Europe/Rome clock; cite provider.

## Validation targets
Node JS syntax, fixed-clock DST and dawn/dusk/weather fixture, Three.js city roots and room-preservation test, offline failure/no invented geometry, camera bounds, historic legacy routes and collision probes, pinned-asset parity. Actual WebGL screenshots and GitHub Pages outcome require independent proof.

## Two new backlog ideas
- Licensed 3D Lazio regional DEM sampling at OSM house and footway anchors, preserving datum and vertical error instead of made-up cliff shape.
- Ground-truth Lo Studio building outline, window/door/two-storey section, then rebuild the protected writer-room anchor from temporary scene location using a reversible surveyed transform and daylight facade review.


## Executed changes and release proof — 2026-11-10
Status: ACTIVE CIVITA WORLD AND OLD CITY CODE CLEANED. Sources and tests are real; accuracy limitations below.

### Implementation (private first, then public)
- Actual main town builder was replaced with **Civita-only** `web/town.js`. Retired Tehran road/traffic/district construction code, asphalt, apartment and environmental sources removed from `web/` in both repositories. Public `.github/citizens-assets/town.js` now matches private Civita source blob. No reliance on former `.github/city-assets/` archive in Pages.
- `web/civita-environment.js` replaces Tehran weather: `Europe/Rome` daylight-saving-aware local time; forecast from current Open-Meteo model at 42.6277,12.1137; provider-based local sunrise/sunset; transparent offline fallback and attribution. Does not alter the author's own persistent clock.
- `web/civita-writer-house.js` builds a working, reversible **two-storey** tufa/peperino/wood/terracotta **Lo Studio-inspired** external study around the existing author-room group. Preserved exact original writer character appearance, room internals, click targets and persisted data. Real Lo Studio cadastral position/measurements **not established**.
- `web/civita-pedestrians.js` creates a bounded set of anonymous moving visual figures from **real OSM pedestrian-way source IDs** with shared geometry, not fake named residents. Previous fictional Tehran-layout citizen meshes hidden in outdoor views; writer/publisher cores and citizen data not deleted.
- `web/civita-room-plan.js` isolates the protected room geometry from the retired `web/urban-plan.js`; `web/civita-place-catalog.js` displays only OSM-sourced village/gate anchors and an openly labelled temporary writer-home anchor.
- Removed retired Tehran construction files, matching pinned public assets, old extraction workflows, historical city test files, obsolete `city/` source/survey/road/building/manifests/TODO/skills from **main**, and replaced the outdated README. Two historic backup branches and backup manifest remain untouched by design. Most old city data is still obtainable from immutable Git history.

### Actual CI and source checks
- Real public GitHub Pages build **42791057815** completed **SUCCESS**, including `Run actions/deploy-pages@v4`; see https://github.com/iAlirezaaa/the-writer-live/actions/runs/42791057815 .
- Its log explicitly reports `CIVITA-OSM-SNAPSHOT-OK`: **66 OSM ways**, **61 building ways** and **5 pedestrian ways**, zero rejected, one bounded source request on 2026-11-10, ODbL 1.0; actual height unverified on all 61. The static source is loaded preferentially by `web/civita-osm-render.js` with a bounded live Overpass fallback when unavailable.
- That run logged `CIVITA-CITIZENS-BUILD-OK` (9 checks), `CIVITA-CITY-BUILD-OK` (14 checks), `CIVITA-MAIN-TOWN-OK`, `CIVITA-WRITER-HOME-OK` (37 external geometry parts, author appearance unchanged), `CIVITA-PEDESTRIANS-OK` (12 source-linked sample people), `CIVITA-WRITER-HOME-CONSISTENCY-OK`, and `OBSERVATORY-OK`. Weather/provenance unit suites report 4, 5 and 3 passing checks respectively.
- A later cleanup still requires its own newest Pages status check before calling its exact SHA deployed. CI validates geometry/source contracts; real WebGL/browser screenshots and whether external OSM tiles load at a visitor's location have NOT been independently measured.

### Major limitations (not a 1:1 rebuilt village yet)
- World is a geographic map underlay, 61 OSM sourced 2D building roofprints represented as **temporary extruded volumes**, anonymous illustrative pedestrians and a reversible historic-looking author-home shell. True cliff/bridge DEM, authentic 3D facades, all floors/entrances/interiors, camera edge/horizon continuity, visual street-level authenticity, actual Lo Studio lot, and real resident counts still require licensed surveys and visual QA.
- No real author figure, private story, memory, publisher logic, or saved resident profiles were removed. The old resident routine graph is retained for data safety but is not valid as real Civita navigation; its outdoor representation is disabled pending sourced replacements.
- Frozen Tehran backups preserved intact: private SHA `cfdac995b6e070d472627b484c93d8fbf5f6ed2b`, public SHA `ececf9ffc041b1666b0425f4f1746d162b9dcf67`; no force push.

### Next two scoped research/backlog tasks
1. Licensed Lazio DEM/LiDAR terrain with vertical datum and precise sampled ground contact at the village, raised bridge, gates and author-house parcel.
2. Geolocate the true Lo Studio building shell, courtyard, accessibility and room plan from reusable official surveys. Use 3Dviz Pro Max for surveyed facades and interior preservation tests, with screenshots and collision checks.

Private/main and public/main deletion commits plus current city skill contain detailed supporting evidence. Do not report future changes as background work without a new task.
