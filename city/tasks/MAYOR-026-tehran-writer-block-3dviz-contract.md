# MAYOR-026 — Tehran writer-block digital twin and 3Dviz Pro Max adoption
Date: 2026-11-09
Status: planned before editing project instructions; DOCUMENTATION / AUTOMATION ONLY.

## User mandate
1. Treat the place as a faithful reconstruction of Tehran, *not* a fictional Tehran-inspired city. Build only the **writer's block** first; expand the physical survey perimeter only when explicitly authorized.
2. WGS84 writer-home anchor: `35.715361987616696, 51.3642455031707`, already stored in `TEHRAN_GEO_ORIGIN` in `web/urban-plan.js`. Local +X east, -Z north; time zone `Asia/Tehran`.
3. Before building new objects or remaking old ones, consult the already-vendored `cognition/skills/3dviz-pro-max/SKILL.md` and `TWIN-WORLD.md`, search the relevant recipe/kit and choose reuse/adapt/custom asset per object. Preserve one Three.js scene / existing builders and licenses.
4. Obtain licensed, dated, attributed base-map geometry (prefer independent open data such as OSM with licensing obligations, surveyed dimensions and permitted photos), align roads, curb lines, paths, cadastral-looking plot edges only if sourced, footprints, orientation and terrain to verified evidence. A Google Maps pin is an origin, not a licensed mesh/imagery export. Do not guess unspecified buildings or heights and claim one-to-one reproduction.
5. Distinguish actual Tehran geography from artistic/fictional gameplay entities already in the world. Keep the writer/publisher stories, citizen IDs/routes and protected mechanics untouched.

## Scope / initial build contract
- Phase 0: source inventory, map datum, exact writer-block perimeter, alignment/control points, evidence confidence table and baseline screenshots.
- Phase 1: ground + true road/sidewalk network + block-level heights/contours and curb/crosswalk/access/parking measured from data; no new outside-block geometry.
- Phase 2: one representative building + one city prop using 3Dviz silhouette/assembly/material workflow, then inspect close/overview/day/night screenshots and performance.
- Phase 3: preserve existing stable IDs, move/replace only safe in-scope objects after city regression gates; document necessary re-homing as a separate design decision, not an implicit citizen-route rewrite.
- Requirements: actual source attribution/provenance, measured coordinates/errors, bounding boxes, ground support, traffic clearance, door access, light/performance budget, baseline day/night/mobile frames and test evidence.
- Do not overwrite procedural roads/geometry without verified location data; the present anchor alone does **not** prove the current street map is correct.

## Validation and release
Before any runtime change: `tests/tehran_georeference_probe.mjs`, `tests/urban_plan_probe.mjs`, `tests/road_topology_probe.mjs`, `tests/city_districts_probe.mjs`, `tests/writer_house_consistency_probe.mjs`, `tests/town_scene_probe.mjs`, and public Pages/build checks. Existing citizen/traffic safety must not regress. For this task only documentation and automation may be synced; no city mesh is altered.

## Backlog ideas
1. **Evidence-linked map editor**: highlight each block road/parcel/prop by WGS84 geometry, dataset license, last-survey date and measured uncertainty, with a manual approve/reject gate.
2. **3D asset review ladder**: per-prop T0–T3/LOD silhouettes, on-ground/contact tests, camera overview/close-up and screenshot-diff approval before replacing old assets.

## Report
- GitHub source and vendored 3Dviz skill inspected; repository under `cognition/skills/3dviz-pro-max/` is already integrated.
- Map origin verified in `web/urban-plan.js`. Existing road/parcel coordinates are still procedural.
- Geometry/runtime tests: NOT RUN in this documentation-only change.
- Map ground survey: NOT DONE; map perimeter beyond the writer anchor NOT SURVEYED.
- Physical reconstruction and object redesign: NOT STARTED by this task.
