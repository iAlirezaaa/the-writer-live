# Mayor backlog — 2026-11-08

Scope: **city only**. No writer, publisher, citizen route, memory, or story changes. Private repo is authoritative; public repo receives matching reviewed city documentation and only necessary pinned assets.

## Work log
- [x] MAYOR-001 (safe, documentation-only): inspect road and public deploy contracts, add a regression gate for city changes, and mirror this log and skill to the public repository. **No geometry/runtime code changed.**
- [ ] MAYOR-002: baseline the real 3D scene with existing probes and a street-level day/night visual check; record any blockers before modifying geometry.
- [ ] MAYOR-003: calculate a residential capacity plan for **at least 400 residents** (units, occupancy assumptions, emergency access, utilities and setbacks). This is a design target, **not an achieved capacity**.
- [ ] MAYOR-004: add school and police parcels only after verified free land, connected entrances and road clearance.
- [ ] MAYOR-005: survey a separate film studio and screenplay/shot-planning office without touching the writer/publisher premises.
- [ ] MAYOR-006: model north mountain silhouettes and an eastward forest road only after testing occlusion, clipping and continuous street topology.
- [ ] MAYOR-007: shared licensed animation library for birds, animals and street props, with instancing, reduced-motion and draw-call budgets.
- [ ] MAYOR-008: weather/day-night lighting and exploratory cultural venues with measured frame-time costs.

## Two new city ideas
- [ ] IDEA-001: public tram-stop micro-museum with a rotating exhibition of fictional city maps; static signage first, no new resident routes.
- [ ] IDEA-002: seasonal birdwatching trail and hidden observatory easter egg along the forest edge, with optional animations and no sound by default.

## Release acceptance
1. Read current source **and pinned** public deployment files before edits.
2. Run `node tests/urban_plan_probe.mjs .`, `node tests/city_districts_probe.mjs .`, `node tests/writer_house_consistency_probe.mjs .`.
3. For public artifact, also run `town_scene_probe.mjs` in `layout`, `paths`, and `wiring` modes against the actual snapshot, plus the Pages build gates.
4. Check footprint overlap, ground support, entrance/sidewalk accessibility, road graph connectivity and FPS/draw calls; compare street-level screenshots at day and night.
5. Report source sync, checks actually executed, visual checks and deployment separately. **Do not claim a green build or successful deployment without evidence.**

## Inspection findings
- Main town currently declares eight road segments; the district kit declares twelve extra blocks and a venue catalog.
- Public Pages workflow overlays pinned files from `.github/city-assets/` and `.github/citizens-assets/`; changing only public `web/` files is insufficient.
- Existing north mountain cones are already present in `web/town.js`; do not duplicate them before a visual survey.
- Existing pedestrian/vehicle paths and author/publisher assets are protected.
- Status: **documentation gate recorded; no runtime geometry released and no automated test execution claimed in this entry**.

## Iteration MAYOR-009 — housing access continuity (2026-11-08)
- [x] Replace the 12 eastern residential approach paths that terminate about 1.06 scene units short of asphalt, without relocating homes, roads, residents, writer or publisher.
- [x] Add a real Three.js geometry probe that measures each named housing walk vs the existing east-housing-link road edge, door face, ground elevation and minimum width.
- [x] Executed the dedicated private CI gate [run 42502228465](https://github.com/iAlirezaaa/the-writer/actions/runs/42502228465) — **FAILED, logs unavailable**. Confirmed all existing public-build checks on the pre-release staging branch before publication: [run 42502451800](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42502451800) — **SUCCESS**.
- [x] Mirrored reviewed scene, probe, skill and TODO to public main in [c68bd2b](https://github.com/iAlirezaaa/the-writer-live/commit/c68bd2b30bd1d8774081cbc94b1bdcc64ab5317b). The new Pages [run 42502537433](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42502537433) **SUCCEEDED**, including deployment.
- [x] Recorded private source [c5e4951](https://github.com/iAlirezaaa/the-writer/commit/c5e4951cec2d188c9ead5f872d11f77ca7955d87), public staging and deploy links, residual visual QA, and performance caveats.

## Two ideas proposed for after MAYOR-009
- [ ] IDEA-003: curb-ramp and tactile paving library at the school/police crosswalks, backed by continuous accessible-route probes.
- [ ] IDEA-004: studio-to-forest educational trail with small reusable film-set clue markers and a resident-free Easter egg index.

Status: source and live pinned assets synchronized and public staging + main Pages jobs passed. Private city CI run failed with no retrievable logs; do not count it as passing.

### Evidence for MAYOR-009
- Public run 42502537433 emitted `URBAN-PLAN-OK` (12 connected roads; 0 road disconnections, 0 parcel collisions), `ROAD-TOPOLOGY-OK` (85 connected asphalt cells), `CITY-DISTRICTS-OK` (15 discoverable places, planned housing capacity 432, 0 intersections), `HOUSING-ACCESS-OK` (12 paved homes; min walk width 2; road east-housing-link).
- Runtime change: one mesh per housing approach before and after (12 total); no new materials, no city agents, no altered traffic splines. Actual GPU draw calls and frame-time measurements: **NOT MEASURED**.
- Visual QA: street-level, accessibility ramps, mobile, day and night screenshots **NOT INSPECTED**.
- Full pedestrian access for school, police, screenplay office, film studio, and street crossing safety remain open; this iteration specifically covers the 12 eastern housing aprons.
- Private author/publisher/memory changes: **NONE** in MAYOR-009 scope.

## MAYOR-010 — real Tehran sky and weather (2026-11-08)
- [x] Separate **city** sky/light clock from author/world simulation time: always compute from Asia/Tehran, without modifying citizen schedules, author date, publisher actions or stored data.
- [x] Consume current **Tehran-only** model weather, hourly refreshed within API limits, with explicit data source, timestamp and fail-closed unavailable state. Use actual sunrise/sunset when valid; display Tehran clock even offline.
- [x] Make the existing pooled 96-particle environment reflect **rain/snow only when reported**; eliminate the fictional automatic 90-second snow cycle. Use available cloud cover for sky/scene atmosphere.
- [x] Implement pure, deterministic Node probes for Tehran time, API parsing, daylight transitions, precipitation, stale/no-network behavior and source pin consistency.
- [x] Run the **non-deploying public staging build** before public main promotion: [42504292543](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42504292543) PASS. Only reviewed city scene, UI cache pins, city test and skill files were copied; no author/publisher memory data. 
- [ ] Private city CI [42503793671](https://github.com/iAlirezaaa/the-writer/actions/runs/42503793671) FAILED and its logs were not retrievable; investigate separately before calling private CI healthy.
- [x] Record exact private/public commits and current live Pages success, sources, limitations and any uninspected screenshots.

### Two new municipal ideas (MAYOR-010)
1. **Weather-aware cultural events:** read-only ambient market umbrellas and park seating cues sourced from the same Tehran weather snapshot; no real events or new citizens implied.
2. **Accessible sky observatory:** optional rooftop viewpoint with a Tehran sunrise/sunset dial and an easter-egg star chart, requiring camera occlusion checks and reduced-motion support.

Status: published city-only change, last full Pages run [42504481657](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42504481657) PASSED; runtime direct weather API and street/night/mobile appearance remain UNVERIFIED. Open-Meteo free endpoint is NON-COMMERCIAL ONLY and not acceptable for a commercial product without switching to a licensed option.

### MAYOR-010 verified evidence
- Private source: [f100cc9](https://github.com/iAlirezaaa/the-writer/commit/f100cc9f459f2d011b4044f692d7b1a487c1eb69); private index cache bump: [8cbdd1a](https://github.com/iAlirezaaa/the-writer/commit/8cbdd1a9ae4400ec88287670183d91c1d6cc9693); private regression pin bump: [bd65a8e](https://github.com/iAlirezaaa/the-writer/commit/bd65a8e01f1a046ae2114757e5036339ff435d44).
- Public staging full pinned build: [42504292543](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42504292543) SUCCESS. Public production: [f8b1ee1](https://github.com/iAlirezaaa/the-writer-live/commit/f8b1ee10faf319947c91ede2fff179f9238cdcb1), Pages [42504481657](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42504481657) SUCCESS.
- Unit test: TEHRAN-ENVIRONMENT-OK (20:00 Tehran from a UTC fixture; rain/snow/stale data/failure; duplicate API calls avoided). Layout: URBAN-PLAN-OK, ROAD-TOPOLOGY-OK, CITY-DISTRICTS-OK, HOUSING-ACCESS-OK and TOWN-SCENE-OK.
- Verified blob SHA equality between private source and public pinned `web/world.js` → `.github/citizens-assets/world.js`, `web/town.js` → `.github/citizens-assets/town.js`, `web/city-growth.js` → `.github/city-assets/city-growth.js`, `web/tehran-environment.js` → `.github/city-assets/tehran-environment.js`.
- Public unpinned `web/world.js` is a legacy exporter overwrite; the deployed _site correctly uses the matched pinned file. Preserve this protection instead of overwriting an unrelated exporter's copy.
- Scope/performance: reuses 96 precipitation points; no new Three.js point lights or mesh allocation per animation frame. Actual GPU draw-call/frametime metrics NOT MEASURED. Clock formatting is limited to the existing periodic city update.
- Weather transport: client request to Open-Meteo's `current` and daily sunrise/sunset Tehran endpoint, polled no more than once every 15min per open client. Data is weather-model "current conditions", not a verified ground-station observation. Provider can see client IP on direct requests. Current successful HTTPS/CORS from a real production browser NOT VERIFIED.
- Failure: the weather panel clearly says unavailable and precipitation remains hidden; daylight uses Tehran timezone with 06:00–18:00 fallback if sunrise/sunset data unavailable. Never invent current rainfall.
- Visual QA: desktop street-level, rain/snow imagery, day/night/sunrise and mobile screenshots NOT INSPECTED.

