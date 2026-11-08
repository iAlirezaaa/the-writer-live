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
