# MAYOR-038 — Remove ALL legacy fictional town geometry from the live scene; rebuild sourced Tehran block from zero
Date: 2026-11-09
Status: IMPLEMENTED; source-only default and public Pages Node/Three.js CI deployment VERIFIED; browser screenshot QA pending.

## Updated user directive
The user explicitly authorizes removing **all old town houses and fictional city decoration** rather than laboriously correcting them, while **never deleting the author's room**. The city shown by default must be rebuilt from licensed real-world overhead geography. Protect author room, author/publisher story data, citizen identity/routine data, and restore capability. Do not imply undocumented building heights/entrances or fake accurate topology.

## Exact frozen backups verified
- [x] Private immutable snapshot: `backup/writer-block-pre-tehran-rebuild-2026-11-09` -> `cfdac995b6e070d472627b484c93d8fbf5f6ed2b`.
- [x] Public immutable snapshot -> `ececf9ffc041b1666b0425f4f1746d162b9dcf67`.
- [x] Matching backup manifest `city/backups/writer-block-pre-tehran-rebuild-2026-11-09.md` blob `4821f550f9228adb7ba68e188ca8ee8a10b2dd04`. Backups never deleted/overwritten.

## Source/review checklist
- [x] Read `city/skills/tehran-writer-block/SKILL.md`, MAYOR-026, `city/GOAL.md`.
- [x] Read `cognition/skills/3dviz-pro-max/SKILL.md`, `TWIN-WORLD.md`, and `historical-diorama` recipe.
- [x] Verified world scene builds writer's interior `writerInteriorWorldRoot` and writer's exterior `writerExterior` **outside** `buildTown`; removing the old town will not delete room meshes.
- [x] Licensed source available: 4 OSM road centerline sides and 4 Overture map roofprint candidates (0 measured heights, 1 intersects protected room), SRTM 30m coarse height.
- [x] Old `buildTown` currently draws massive fictional roads/12 blocks/civic venues/432 nominal population/mountains and random houses BEFORE the source overlays. The overlay cannot dominate visually while those meshes are active.
- [x] Original legacy town can be preserved in code for reversible diagnostic `mapMode:"legacy"`, but production default must be NEW source-only town with **no meshes from fictional builders**.

## Single significant but reversible scene switch
- [x] New `web/town-tehran-rebuild.js` owns a clean `town` root containing ONLY OSM street paving/labels, licensed map land, dated SRTM contours, and the 4 Overture footprint candidates rendered as 2 generic height-unknown proxies + 1 standalone shape + 1 protected-room outline. No extra fictional houses, shops, offices, lawn, trees, mountains, cars, road grid or districts.
- [x] `web/town.js` defaults to new build and retains **opt-in legacy** compatibility solely for diagnosis/recovery. Do not change writer interior, exterior, author history or citizen routes.
- [x] Verify model count and footprint location, writer room and bounding box, no legacy city builders invoked or colliders installed, and that default day/night/weather update contract doesn't crash.
- [x] Run real Three.js tests plus existing legacy regression with explicit `mapMode:"legacy"` in *test harness only*; document tests that require migration before calling release success.
- [x] Only after test pass: sync PRIVATE source to public `web`/pinned copies, run Pages release checks and capture real screenshots only if available.

## Exactly two new backlog ideas
1. Replace the currently old citizen-route *visual locations* in a later separately approved task with georeferenced walkable-access nodes after road/crosswalk survey; keep IDs and routines stable.
2. Expand legal open-data coverage inside the current block to segment four possibly merged ML roofprints into individual surveyed buildings; build each only when individually documented, including roof heights and door positions.

## Constraints and confidence
All real road widths, sidewalks/curbs and building heights are still **visual proxies**. Overture candidates may merge multiple properties. This stage is a truthful from-scratch visual map reset within the established single block, **NOT** full 1:1 exact Tehran, not a traffic system reconstruction, and not an expansion beyond this block.

## Real execution evidence, 2026-11-09
- Source-only scene build: https://github.com/iAlirezaaa/the-writer/commit/6786e25293ae76948af7d70dc90b960102c2a3aa . Default-town switch: https://github.com/iAlirezaaa/the-writer/commit/dd009d1c59a8cdd6ddfe092bb00ab546c5ca8cc7 .
- Successful PUBLIC Pages CI and deployment: https://github.com/iAlirezaaa/the-writer-live/actions/runs/42628790047 , public head `571b2dc022ebc4ede20dfde5860b3294b5d23a12`.
- Actual `TEHRAN-SOURCE-ONLY-REBUILD-OK` log: **4 sourced scene layers**, **11 source 3D meshes/line objects**, **0 old city buildings/roads/cars**, **4 road centerline source edges**, **4 Overture source roofprint candidates**, **0 measured building heights**, writer room/exterior independent and preserved. `TEHRAN-4-SOURCED-STREETS-OK`, `TEHRAN-REAL-BUILDING-ROOFPRINTS-OK` and prior `TOWN-SCENE-OK layout/paths/wiring` passed. Legacy acceptance explicitly invoked `mapMode:"legacy"`, not the default; that test does NOT prove legacy geometry is rendered on the public map.
- Build pin blockers fixed without modifying writer/publisher/citizen state: public `prepare_car_deploy.py`, `prepare_city_deploy.py`, `prepare_observer_deploy.py`, `prepare_citizens_deploy.py` and public observatory cache probe now reference the source-only world version. Pages workflow pins source-only town module and loads VM regression.
- **Limitations:** source aerial polygons may merge real buildings; not a 1:1 Tehran replica. Existing citizen display is independently owned by `web/citizens.js` and intentionally not deleted/altered; author exterior stays to preserve room access. Screenshots of actual public browser (before/after, street/top-down/day/night) and FPS were NOT captured, and city route/physics migration remains a separate future task.
