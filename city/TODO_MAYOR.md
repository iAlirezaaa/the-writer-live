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
- [ ] Separate **city** sky/light clock from author/world simulation time: always compute from Asia/Tehran, without modifying citizen schedules, author date, publisher actions or stored data.
- [ ] Consume current **Tehran-only** model weather, hourly refreshed within API limits, with explicit data source, timestamp and fail-closed unavailable state. Use actual sunrise/sunset when valid; display Tehran clock even offline.
- [ ] Make the existing pooled 96-particle environment reflect **rain/snow only when reported**; eliminate the fictional automatic 90-second snow cycle. Use available cloud cover for sky/scene atmosphere.
- [ ] Implement pure, deterministic Node probes for Tehran time, API parsing, daylight transitions, precipitation, stale/no-network behavior and source pin consistency.
- [ ] Verify normal private testing and non-deploying public staging tests before changing the public pinned files; never copy private author or publisher content.
- [ ] Record exact private/public commits and current live Pages success, sources, limitations and any uninspected screenshots.

### Two new municipal ideas (MAYOR-010)
1. **Weather-aware cultural events:** read-only ambient market umbrellas and park seating cues sourced from the same Tehran weather snapshot; no real events or new citizens implied.
2. **Accessible sky observatory:** optional rooftop viewpoint with a Tehran sunrise/sunset dial and an easter-egg star chart, requiring camera occlusion checks and reduced-motion support.

Status: TODO recorded **before** runtime edits. Open-Meteo's public free endpoint is **non-commercial only**; if this public site is commercial a licensed endpoint or alternative provider must replace it before production use. Current sky/weather and direct API transport have not yet been verified on the production browser.
