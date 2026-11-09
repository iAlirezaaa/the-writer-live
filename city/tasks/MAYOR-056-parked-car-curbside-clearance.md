# MAYOR-056 — Curbsiding the source-only illustrative parking (geometry gate)
Date: 2026-11-10
Status: COMPLETE FOR THIS ONE NONPHYSICAL VISUAL EDIT; source-only, legacy, traffic and public Pages CI PASS

## Concrete small edit
Correct the existing block-only parking proxy group in `web/writer-block-illustrative-context.js` to sit next to the modeled curb, not near the middle of the *illustrative* asphalt band, while retaining all 9 cars, the licensed OSM road centerline ring, the Overture building geometry, the writer's room, all citizens' routes and source-only map mode. Never add unsurveyed buildings or move a real road.

Currently `planWriterBlockContext` places center of a 1.60m wide car 58% across a proxy 3.05m road half-width; nominal lateral distance from car to the proxy curb is 3.05-(0.58*3.05+0.80)=0.481m. Change to 70% to obtain 3.05-(0.70*3.05+0.80)=0.115m curbside separation and increase nominal central clearance by 0.366m. These values are purely **scene/vehicle dimensions**, not measured widths or real parking permissions. Use existing source-aligned oneway rotation from MAYOR-055.

Add explicit non-colliding 4-corner safety checks for each illustrative car against the block/source-roofprints, plus midpoint no-penetration test of the proxy sidewalk band. Mark assumed parking legality and surveyed curb width null. Add a deterministic standalone test and source-only probe assertions. A projection overlap is not legal clearance certification.

## Mandatory evidence and recovery
- Anchor EPSG:4326 WGS84 (35.715361987616696, 51.3642455031707), local +X east and +Z south.
- OSM block source 2026-11-09, ODbL-1.0; actual road/curb/parking widths still unknown.
- Overture roofprints 2026-11-09, ODbL-1.0; 4 polygons are not verified separate house counts or facades.
- Immutable GitHub ref checks: private `cfdac995b6e070d472627b484c93d8fbf5f6ed2b`; public `ececf9ffc041b1666b0425f4f1746d162b9dcf67`. Two matching backup manifests confirmed.
- Reviewed mandatory city skills, MAYOR-026, `cognition/skills/3dviz-pro-max/SKILL.md`, `TWIN-WORLD.md`, `references/physical-interaction.md`, `data/recipes/accessible-clearance-study.json`. 3Dviz guidance: check transforms/contact, compact InstancedMesh, distinguish visualization from legally proven street envelopes.

## Independent external research
- OSM official data terms and attribution: https://www.openstreetmap.org/copyright (ODbL).
- Overture Buildings official guide: https://docs.overturemaps.org/guides/buildings/ (ML roofprint uncertainty).
- Microsoft ML footprints: https://github.com/microsoft/GlobalMLBuildingFootprints (CDLA Permissive 2.0 original, different licence from Overture's combined dataset).
- Tehran municipal parcel publication (access requires legal confirmation): https://tp4.ir/جزئیات-سابقه-طرح-تفصیلی-در-سامانه-تهر/ (public viewing not equivalent to bulk-redistribution rights).
- Regional Daryan-e No street photographs are contextual only; no photography is proof of the writer block's exact building count, building height, or curb dimensions.

## Release criteria
1. Deterministic 9 proxy parked cars and source OSM one-way headings preserved.
2. Centerline/curb-side gap of each proxy is >=0.10m and central clearance increases from 0.969m to 1.335m using a 1.6m-wide body; neither is a real surveyed distance.
3. Every car rectangle (four corners and each side midpoint) stays inside the OSM centerline candidate ring and outside source building polygons and protected room buffer. No car intrusion into the modeled sidewalk.
4. No scene route/citizen model mutation and no actual legal parking claim.
5. Run Node source-only, road topology, legacy paths/traffic and pinned Pages CI, capture screenshots when possible and differentiate actual run evidence from assumptions. Only after passing checks sync private -> public pinned files. If tests fail, hold public changes.

## Two NEW backlog ideas
1. **Tehran parcel licence gate**: validate municipal parcel WFS/shapefile reuse terms, timestamp and authoritative topology and compare it to merged Overture polygons to replace unknown house counts without guessed splits.
2. **Measured parking/access lane matrix**: for each one-way/two-way way ID, explicitly record surveyed clear driving width, curb setbacks, two sidewalk clearances, fire/emergency sweep and parking restrictions; only then enable physical car parking and accessible collision-based routes.

## Execution evidence — private gate
- Physical area: `web/writer-block-illustrative-context.js` only; the car proxy offsets and eight boundary sample points per car (4 corners plus 4 side midpoints) are checked against Overture mapped polygons, OSM block candidate and protected room. Source-only asset import versions were updated in `web/town-tehran-rebuild.js` and `web/town.js`; no other scene owner was modified.
- `tests/tehran_source_only_rebuild_probe.mjs` now verifies curbside separation, positive central modeled clearance, parking-law UNKNOWN, unchanged 9-car source-only inventory, and previous one-way orientation.
- Geometry comparison executed directly against the **current private GitHub modules** and prior public baseline: PASS. Nine car proxy bodies remained, 72 oriented body samples clear (not merely centers); mean center shift 0.412m; minimum separation from Overture candidate outlines 2.295m; protected home-anchor separation 39.835m; proxy curb clearance 0.115m; central free proxy half-road width 1.335m. Trees/lamps/shrubs preserved; six one-way car directions preserved. All actual site curb widths/parking restrictions remain UNKNOWN.
- Source-only Three.js Node, legacy tests, public pinned SHA equality, browser screenshots, Pages deployment and legal parking compliance are not yet claimed as done. Record separate CI evidence when completed.


## Final public verification — 2026-11-10
- Public visual-code release commit: `8ebe6732f1d9ea5a41aa623d50850e86c153f29b` https://github.com/iAlirezaaa/the-writer-live/commit/8ebe6732f1d9ea5a41aa623d50850e86c153f29b
- Private/public source and test Git blob parity checked on all six source files; three deploy-pinned JS copies were committed in the same atomic Git tree (9 total paths).
- **Actual GitHub Actions** https://github.com/iAlirezaaa/the-writer-live/actions/runs/42705112418 completed with `success` on exact source code release SHA. Its logs show `TEHRAN-ENVIRONMENT-OK` (mocked provider/timezone), `TEHRAN-SOURCE-ONLY-REBUILD-OK`, `ROAD-TOPOLOGY-OK`, `CITY-DISTRICTS-OK`, `TOWN-SCENE-OK layout`, `TOWN-SCENE-OK paths`, `TOWN-SCENE-OK wiring`, `CITY-TRAFFIC-OK` and `actions/deploy-pages@v4` success. The legacy scene's 432 residents are a proxy/test design capacity, NOT documented 400 actual residents of this Tehran block.
- Ground-truth survey **not acquired**: municipal parcel/height geometry requires licence verification, no roofprint may be split on assumptions; no real curb width or parking law established. Browser screenshots/day-night comparisons **NOT CAPTURED**. This is a curbside adjustment inside the schematic model, not certification of physical parking or exact Tehran reconstruction.
- Protected writer room, all narrative/publisher data, citizen routes, map extent, existing OSM source geometry, and actual network physics remain untouched.
