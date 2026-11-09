---
name: tehran-writer-block-digital-twin
description: Plan verifiable Tehran block geometry and improve existing 3D city objects with the vendored 3Dviz Pro Max skill, without moving protected writer/citizen data.
---

# Tehran writer-block digital twin / 3Dviz Pro Max

## Activation and priority
Run this skill on **every** municipal/city visual, architectural, road, terrain, vegetation, prop, lighting or asset review. The latest user mandate replaces the former goal of a fictional/procedural Tehran-inspired map: the geographically faithful neighborhood is the target. Only the **single block containing the writer's home** is in geographic modeling scope for now. Existing distant scenery may remain as legacy placeholders but must be marked *not surveyed*, not silently treated as real Tehran.

Read in this order:
1. `city/tasks/MAYOR-026-tehran-writer-block-3dviz-contract.md`
2. `web/urban-plan.js` / `TEHRAN_GEO_ORIGIN`, `city/skills/tehran-georeference.md`
3. `cognition/skills/3dviz-pro-max/SKILL.md` and `cognition/skills/3dviz-pro-max/TWIN-WORLD.md` (already vendored; read from the private project checkout)
4. Owning Three.js builder: `web/town.js`, `web/town-districts.js`, `web/city-growth.js`, `web/objects.js`, etc.
5. `city/skills/mayor-release-gate/SKILL.md`, city regressions, public pinned deployment mapping.

## Ground truth and exact spatial frame
- Verified **home-anchor coordinate** (WGS84): `35.715361987616696, 51.3642455031707`; keep scene X east and Z south (north is -Z). Use a consistent metric projection/control points for precise small-block data; `geoToCityLocal` is a tangent approximation, not a measured survey.
- Do **not** assume a Google Maps view/pin is permission to scrape, trace or embed proprietary tiles/imagery. Record terms/attribution for any independently licensed basemap, OSM extracts, public cadastral/elevation records or photographs. Preserve source timestamp, accuracy, and coverage for every feature.
- Do **not** invent a precise rectangular block boundary, house/building footprints, street width, orientation, floors, rooftops, elevation or facade. A 1:1 claim requires real measurements, explicit correspondences and screenshot/camera ground-truth checks. If a feature is unsupported, tag as `unknown/proxy`.
- Work only inside a georeferenced `writer-block` area-of-interest polygon. Determine its road-bounded polygon from sourced geometry before altering scene parcels. Hold outside-block additions until the owner expands the area.
- Each future real-world object needs `id`, WGS84 geometry/transform, local metric transform, original feature/source ID, license, capture date, positional/height confidence, representation tier, and evidence link. Avoid storing person- or household-specific sensitive detail.

## 3Dviz Pro Max mandatory object workflow
- Use the already vendored `cognition/skills/3dviz-pro-max/` rather than an unreviewed install or another renderer. Search `scripts/search.py` for a shape/roof/furniture/traffic topic; resolve useful records; use `design-context.py` and `host-probe.py` where available. Lexical retrieval is a suggestion, not proof of object quality.
- Inventory current objects first; rank improvements by visibly wrong silhouette, proportions, joins, ground contact, roof/window/door consistency, texture/material scale, lighting and camera performance. Rebuild **one representative object per iteration**, then propagate only after tests and visual review.
- Decide `reuse-kit`, `adapt-kit`, `custom mesh` or `licensed external asset` per object. Keep stable Three.js scene, IDs, object picking, current texture/material ownership and one renderer.
- Shape first, then supports/assemblies, materials, light behavior, animation, LOD/InstancedMesh reuse. Use real browser captures at street-level, overhead, close and night/day where accessible. Never report images rendered or performance measured without actual capture.
- Check third-party kit/texture license. Upstream 3Dviz's authored code is MIT but some included asset families have other licenses. Never copy restricted samples wholesale.

## Safety / release
- Before every change write a unique `city/tasks/` TODO. Do one safe, measurable modification privately; run georeference, layout, road topology, housing access, house/citizen paths and public build tests as relevant. Verify street/ground collision, door accessibility and draw-call budget. Do not touch writer's stories/memory, publisher logic, citizen schedules/routes, or external modules.
- Mirror only reviewed city assets or instruction files to their public pinned counterparts. If geometry QA or map evidence is missing, commit only the documentation/plan and report no visual or geographic reconstruction was deployed.
- Distinguish **planned**, **modeled**, **observed visually**, **tested**, and **deployed** statuses; include commit/CI evidence and two distinct city backlog ideas.

## First concrete tasks
- Inventory a licensed OSM/other open data extract around the exact coordinate, identify road-bounded area-of-interest and document datum, bounds, feature coverage, discrepancy and attribution. Do not state exact block edges until measured.
- Build a neutral ground-survey overlay/metadata contract, not unsourced final architecture.
- Pilot a sidewalk fixture or single surveyed facade using 3Dviz, then evaluate old-vs-new silhouette, contact shadow, collisions, materials and frame cost.

## Mandatory pre-reconstruction recovery gate (MAYOR-027)
- Before changing **any** map, structure, roads, materials or scenery to match the Tehran reference, confirm that the snapshot manifest `city/backups/writer-block-pre-tehran-rebuild-2026-11-09.md` and both backup branches still exist.
- Private frozen backup commit: `cfdac995b6e070d472627b484c93d8fbf5f6ed2b` (`backup/writer-block-pre-tehran-rebuild-2026-11-09`).
- Public frozen backup commit: `ececf9ffc041b1666b0425f4f1746d162b9dcf67` (same branch label).
- **Do not delete, force-push, overwrite or repoint these backup branches.** Future geometry revisions need distinct new snapshot labels as needed.
- If rollback becomes necessary, restore only the city-scoped files from the saved commit onto a new review branch; do not revert unrelated newer writer, publisher or citizen data. Apply the public pinned-overlay restore separately after passing geometry, pedestrian and city CI probes.
- The backup preserves the old procedural map as a baseline; it does not make that map a surveyed Tehran reconstruction.


## Confirmed source survey — MAYOR-028 (2026-11-09)
- Read `city/survey/README.md` and `city/survey/output/writer-block-survey.json` before designing or replacing the map. The data are an ODbL-attributed OpenStreetMap extraction, NOT Google-derived imagery and not survey-grade evidence.
- The verified source has 47 mapped roadway ways and seven building-footprint ways. **None of the seven provides a usable height/level**, so do not extrude them to a guessed real height. The query capture is a 230-m neighborhood bounding rectangle, not the actual writer block.
- The smallest closed mapped road-centerline face containing the author-home anchor is approximately **12,265 m²**, formed by OSM ways `4292858` (فلاحت پور), `481657106` (پنجم دریان نو), `36697708` (هشتم دریان نو) and `36697711` (خلیل میکائیلی). Treat this as a **candidate topological boundary**, not a cadastral plot line or curb line. It is a source-aware starting extent only; verify footage, positional accuracy, actual crossings and street widths before mesh replacement.
- To update the map: `node --test city/tests/writer-block-survey.test.mjs` then `node city/survey/acquire-writer-block.mjs --radius 230 --out city/survey/output/writer-block-survey.json`. The official OSM map JSON endpoint is preferred because public Overpass requests timed out in CI. A successful public run passed six tests and acquired real data at https://github.com/iAlirezaaa/the-writer-live/actions/runs/42592983509.
- **3Dviz research:** the available `blueprint-timber-cottage`, `blueprint-signboard`, `blueprint-lantern-post` are modular modeling examples, *not* documented modern Tehran objects. Transfer craft principles (correct contact, fastening, recesses, material responses, LOD), not rural kit silhouettes, without actual Tehran street references.
- Keep the existing procedural town and `ROAD_SEGMENTS` operational until a separate OSM-overlay Three.js preview proves spatial alignment, clear sidewalks/buildings, citizen/traffic compatibility and before/after visual QA. No live street replacement was made in MAYOR-028.

## MAYOR-029 — Source-confidence gate before any Tehran mesh (2026-11-09)
- Evidence baseline: `city/survey/output/writer-block-survey.json` captured 2026-11-09T09:22:58.743Z from the official OSM map API; ODbL-1.0, EPSG:4326. The approximately 12,265 m² road-bounded candidate is a **centerline topology polygon**, not a curb, sidewalk, parcel or surveyed building boundary. Do not offset its lines into claimed measured sidewalk widths.
- The 230 m query rectangle is **not** the writer-block work boundary. Restrict reconstruction to the source-backed candidate road-bounded face after independently checking junction topology and the anchor's containment; record unresolved corner geometry rather than expanding into adjacent blocks.
- The seven OSM building-footprint ways are a query-rectangle inventory, not seven confirmed buildings inside the block. None carries usable height/levels. Require feature-by-feature point-in-polygon coverage, license/source ID, capture date, geometry confidence and independent height evidence before extruding any footprint.
- Existing `ROAD_SEGMENTS` and `BUILDING_PARCELS` remain procedural placeholders; do not reinterpret them as measured ground truth or move protected routes. An OSM outline preview must be separately labelled, non-colliding, and disabled by default until geometric tests and actual day/night, aerial and street captures pass.
- 3Dviz asset rule: the existing signboard/lantern/timber kit examples can inform assembly, silhouette, ground contact and LOD **only**; do not transplant their historical styling into modern Tehran. Inspect the actual kit/recipe source and its license before modeling a specific object; if inaccessible, mark kit review pending and do not publish a redesigned asset.
- Release evidence must separately identify: source inspection, executable test results, screenshots actually captured, pinned-file parity and verified deployment. Documentation-only work does not certify any of the latter.

## MAYOR-030 — One sourced visual overlay (2026-11-09)
- The first **runtime-visible** OSM writer-block geography is `web/writer-block-road-preview.js`, linked from `web/town.js`. It displays only the road-centerline candidate from the ODbL survey, with a 0.46 m **graphic stroke** rather than guessed paved width. Five road-node vertices delimit the polygon; no road, collider, path, building or writer-house transform was replaced.
- The overlay projects original [longitude, latitude] WGS84 values using `geoToCityLocal`. A single `BufferGeometry` renders dashed centerlines and corner rings; triangles face upward, lighting/shadows are disabled, no raycasting/collisions are registered. Maintain `MeshBasicMaterial` single mesh and the explicit `cityMapEvidence` metadata.
- Validate via `node tests/tehran_writer_block_overlay_probe.mjs .` and existing georeference, urban-plan, road topology and town scene probes. Do not mistake local lightweight geometry-harness execution for a browser screenshot or real Three.js Node CI run. If CI runner does not start, report as an infrastructure blocker and do not claim visual verification.
- Existing OSM geometry remains a candidate **road centerline** only. Next physical rebuild must use licensed curb, sidewalk, elevation and building surveys; this visualization is a first reality-linked layer, not a 1:1 road replacement.

## MAYOR-031 — Centerline-to-curb evidence and prop gate (2026-11-09)
- Consult `city/tasks/MAYOR-031-road-centerline-evidence-audit.md` before any sidewalk fixture. The OSM candidate is road **centerline** only: curb offsets, sidewalk clear width and fixture support heights are unknown, so no physically placed prop is approved from these lines alone.
- Require a licensed, dated reference and independent scale/position evidence for a single Tehran prop; record ground contact, walkway clearance, support joints, silhouette, material response and Three.js LOD budget before replacement.
- This iteration did not verify recovery branch refs via GitHub file lookup (404); manifests exist in both repos. Recheck refs before visual modification. No screenshots, tests, kit implementation or deployment are claimed.

## MAYOR-030/031 — Public release lessons (2026-11-09)
- A public Pages build **first failed** because a public pinned Tehran weather module did not match approved private/public `web/`. The failure manifested as `35.6892` vs the WGS84 writer-home anchor. Always confirm pinned parity before running new feature probes.
- A second Pages build reached `tests/city_districts_probe.mjs`, whose old `new Function` test harness strips imports. Any new city import must be injected into this harness as a real builder dependency; the standalone real-Three preview probe alone does not prove legacy harness compatibility.
- The corrected public Pages run 42604022465 passed Three.js source geometry, roads, districts, street-level navigation, vehicle and scene wiring checks; real screenshot capture/visual accuracy remains separate and unverified. Scope stays inside the single writer-home OSM candidate face.

## MAYOR-032 — Coarse DEM terrain and safe topological clipping (2026-11-09)
- Actual sourced height grid `city/survey/output/writer-block-dem-srtm30m.json` from USGS/NASA SRTMGL1 V3 via OpenTopoData `srtm30m`; **EGM96 orthometric heights (metres)**, not WGS84 ellipsoidal ground survey heights. Captured `2026-11-09T11:22:36.987Z`, 9×7 grid plus separate home anchor, nominal raster resolution around 30m; source range 1234–1243m EGM96.
- Apply 3Dviz recipe `terrain-contour-slices` and `map-projection-frames`: clip a true relative-height triangulated mesh to sourced WGS84 OSM polygon; use consistent east-X and south-Z transforms. Result 203 triangles with surface area 12,264.69m². The mesh is **hidden by default** until physical buildings, road contact and grading can be checked. Label it inspection-only; do not add it to collision/nav surfaces.
- Default visible version is a flat 2m-spaced contour overlay (21 segments) on existing ground. It **visualizes coarse DEM elevation**, not the true shape of current traversable terrain. It must never substitute for real street slopes, surface heights or building access tests.
- Do not invent microtopography from SRTM or interpret radar surface as ground beneath buildings/trees. For future physical land replacement, require finer licensed terrain data, surveyed curb/door grades, building-contact validation and actual street/aerial day/night screenshots.
- GitHub Pages execution evidence: https://github.com/iAlirezaaa/the-writer-live/actions/runs/42609544002 passed new terrain and established road, layout, traffic and house acceptance gates. Actual browser screenshots remain pending; always distinguish this from runtime geometry proof.

## MAYOR-033 — One grounded balcony retrofit on a procedural house
- **Scope/provenance:** `home-east` is an existing procedural house at x=19,z=0 and is not associated with a mapped Tehran footprint. A visible railing retrofit is **craft-only**, never evidence of a real balcony. OSM still has no verified building footprint inside the writer block.
- **Owner:** `web/town.js` creates the pre-existing upper-left window balcony; `web/writer-block-balcony.js` attaches only one single-renderer, static railing to that slab and facade. Preserve east house width/depth/position; protect writer home, citizens, traffic routes and all other facades.
- **3Dviz Pro Max material assembly:** use `recipe.historical-diorama` to label unsupported/illustrative geometry distinctly; `recipe.accessible-clearance-study` and `TWIN-WORLD` for physical clearances and wall/slab sockets. Here the handrail has front posts and six infills, slab mounting plates, side returns to the wall, brackets intersecting the wall by 0.015m, and a continuous top rail.
- **Runtime cost:** 22 geometry members merged into one `BufferGeometry` and one `MeshStandardMaterial`: 1 draw call, 792 unindexed vertices; no extra light, clickable, collider, update loop or texture request. Render a procedural prototype only within the OSM block candidate.
- **Tests:** `node tests/tehran_writer_block_balcony_probe.mjs .` checks all vertices remain inside the block, proper slab contact, above-pedestrian ground clearance, singleton mesh, all finite coords and unchanged urban plan. `tests/city_districts_probe.mjs` must inject the standalone builder into its `new Function` legacy harness.
- Do not label the 0.86m prototype rail as an engineering safety-standard-compliant balcony without a specific applicable code, verified dimensions and professional inspection. Real city reconstruction still needs licensed building footprints, measured height and facade evidence.

## MAYOR-034 — Licensed building roofprints and protected room (2026-11-09)
- **First physical map evidence:** Overture Buildings data downloaded over only the surveyed writer-block bounding rectangle, then strictly clipped to the OSM `OSM_CENTERLINE_CANDIDATE` face. `city/survey/output/writer-block-overture-buildings.json`: 4 actual roofprint candidates, no verified heights, captured 2026-11-09T12:18:12Z, under ODbL 1.0. Source release was the latest selected by `overturemaps-py 0.20.0`; exact underlying release is NOT independently verified. Overture shapes may be AI-derived **roofprints**, not cadastral parcel lines.
- Builder `web/writer-block-buildings.js` uses the **same Three.js instance as the town**, `ExtrudeGeometry` from actual local-XZ polygons, and bundles construction in one semi-transparent mesh plus one footprint line set. Every 6.0m-height building is a **symbolic display proxy**, not a real observed height or documented façade. Metadata retains GERS feature ID, provenance, author-owned room scope, verified vs unknown heights, no collider, and source date.
- **Protected writer-room decision:** one of four source features intersects the 8m×8m protected author room reserve around (0,0). The renderer never extrudes it: keep its documented plan **outline only**. The remaining three features generate an inspection-only transparent 3D mass layer. No author room assets, clickables, paths, collisions, writer memory or publisher logic are touched.
- 3Dviz Pro Max recipes `historical-diorama` and `citygml-stable-id-scenario-diff`: treat source identifiers as authoritative, keep source-based polygons separate from interpretive height/facade rendering, and preserve source epoch/version metadata. `city/tests/test_writer_block_overture.py` tests clipping and fail-closed contract, `tests/tehran_writer_block_buildings_probe.mjs` tests real Three.js mesh, exact source parity, room exclusion and no off-block geometry. The existing scene/traffic tests still govern any publication.
- Remaining dependency: city rebuild 1:1 needs finer *verified* building height, entrances, terrain-contact and street/sidewalk surveys. Never confuse this volume preview with replacement of physical road or simulated citizen navigation. Existing procedural architecture may still appear until migrated one-by-one after more accurate source and screenshots.

## MAYOR-035 — Roofprint height evidence gate (2026-11-09)
- Read `city/tasks/MAYOR-035-overture-height-evidence-gate.md` before attempting any 3D roofprint-to-building replacement. The four Overture candidates do not establish building heights, entrances, floor counts or street-level contact. The author-room intersecting candidate remains outline-only.
- Apply 3Dviz silhouette, assembly, material and LOD checks only after licensed object-specific evidence; label symbolic 6m masses as proxies and do not promote them to colliders. Require actual screenshots and executable city regression results for runtime work. Two new evidence/visual review ideas are tracked in MAYOR-035.

## Core objective change: MAYOR-037 (2026-11-09)
The user explicitly prioritizes a faithful **building-by-building 3D digital twin of REAL
Tehran from licensed, top-down geospatial mapping**, not an imagined city. This is
the project's long-term primary goal; read `city/GOAL.md` and the per-feature
`city/buildings/manifest.json` every run. The immediate physical AOI is still
only the real writer block bounded by sourced OSM centerlines.

### First building: source footprint is the real part, height/facade are not
- `web/writer-block-building-01.js` is independent, source-ID keyed to Overture
  `3d7b8239-b1e0-48bc-8868-ae4a4d392586` (the western 965.73 m²
  ML-derived candidate roofprint; 6 nonclosing XZ vertices). Geometry copies
  the **original exact local metric polygon** with no rescaling, axis drift,
  unwarranted subdivision, rotation or invented setbacks. Its distinctive
  silhouette is the truthful part of the model, not its room/floor configuration.
- The first stand-alone Three.js `ExtrudeGeometry` intentionally uses a **6m
  illustrative height**, flat cap and neutral wall/roof appearance. Overture
  supplies NO verified height, floors, facade, entrance or roof style. Keep
  `measuredHeightMeters:null`, `roofTypeProven:false` and `T1-PLAN-EVIDENCED`
  in its runtime metadata. A source polygon may represent MULTIPLE joined
  structures; do not call it an individual legal property without stronger data.
- Avoid spatial duplicates: skip this exact source ID in the earlier combined
  translucent anonymous volume mesh, retaining other 2 proxies and the single
  writer-room protected outline. The current live writer's room, routes,
  buildings' physical collision and weather/clock are all unchanged.
- Use 3Dviz Pro Max `recipe.citygml-stable-id-scenario-diff` for stable ID,
  feature version/CRS identity and source separation; `recipe.historical-diorama`
  for visibly distinguishing evidence-grade geometry from conjecture. Use
  `TWIN-WORLD` for a physically connected single extrusion with ground contact.
  Never invent windows/balconies/entrances for this source roofprint.
- Geometry test `tests/tehran_writer_block_building_01_probe.mjs` must check
  6 source edges, source polygon area, absolute map registration, room-exclusion,
  unknown height flag, no duplicate bulk proxy, parent mesh count and finite
  vertices. Keep older scene/traffic/district/baseline probes mandatory.
- A passing static/CI Three.js model test is not a screenshot, true photograph
  match or confirmation of a Google Maps-like 1:1 reconstruction. Requires
  a documented licensed aerial view and independent roof/facade survey.

## MAYOR-038 — Clean-slate town architecture, preserve independent writer room
- The owner explicitly authorized discarding previous fictional city geometry.
  **Default** `buildTown()` delegates to `web/town-tehran-rebuild.js`, producing
  exactly 4 real-map layer groups: OSM street paving, coarse SRTM (hidden
  solid terrain), 3 Overture unverified-height masses/outline layers, and
  one standalone source footprint model. No old mountains, 12 fictional
  districts, extra houses, cars, old roads or arbitrary props in the town root.
- NEVER move/deallocate `web/world.js` `writerInteriorWorldRoot` nor
  `writerExterior`. They are **not** children of `town.group`. Public/canonical
  author stories, publisher state and citizen routes are preserved unchanged.
- Former town remains in source as an explicit *opt-in* `mapMode:"legacy"` only
  for rollback diagnostic and existing scene contracts; legacy tests must
  explicitly request that mode. Live default is source-only. Do not silently
  re-enable legacy on data errors.
- Based on 3Dviz Pro Max `TWIN-WORLD.md` and historical-diorama recipes,
  source and reconstruction remain separable. Current buildings are
  MAP FOOTPRINT CANDIDATES, no surveyed parcel, facade, entrance or height.
  SRTM is ~30m raster. Detailed ground/road/collision rebuilding needs a later
  licensed higher-resolution source and dedicated city route/access tests.
- Run `node --experimental-vm-modules tests/tehran_source_only_rebuild_probe.mjs .`
  on the real Three.js modules. It checks 4 clean map layers, no fictional
  meshes, city update API safety, no cars, footprint counts and room continuity.
  Old city geometry tests run only with `mapMode:"legacy"`, never use those
  passes to claim the new default scene looks authentic. Capture actual
  before/after aerial, street, day/night visual images and FPS if available;
  otherwise report missing visual proof.

## MAYOR-039 — Known vs unknown floor and shop evidence on polygon 02
- Built `web/writer-block-building-02.js` from **unaltered** Overture source feature `3d2290d6-c533-4c11-b2c0-079f0ee2e29e` (1035.58 sqm; 15 polygon vertices). Read 3Dviz Pro Max `citygml-stable-id-scenario-diff` and `historical-diorama`: preserve stable feature ID, ODbL/ML provenance, reproducible 2D polygon/area, and visibly separate speculative volumes/rooflines from evidenced plans.
- Mass is **one ExtrudeGeometry Mesh** with cap/wall materials and no unnecessary random details. Two horizontal polygon outlines share one LineSegments draw: illustrative 6m envelope cap and 3m metric-level ruler. The 3m line **is not proof the real property has two floors**, nor is the 6m cap roof elevation.
- Real `heightMetersSource`, `numberFloorsSource`, shop tags, shop owners/signs and door locations are `null`. Do not infer commercial use from the neighborhood or blindly label the ground level a store. Aerial ML roofprints may span multiple actual buildings: preserve polygon even if architectural segmentation seems obvious.
- The new group lives only under `web/town-tehran-rebuild.js` source-only map. `web/writer-block-buildings.js` excludes the identical map ID from its anonymous proxy, leaving exactly 1 bulk mass, 2 sourced individual mesh groups, and 1 writer-room outline. Physical colliders, legacy citizens routes, author room and publisher logic are not touched.
- Verify map-to-Three.js vertex/area exactness, closed silhouette, extents and noncolliding above-flat-ground proxy with `tests/tehran_writer_block_building_02_probe.mjs` and `tests/tehran_source_only_rebuild_probe.mjs`. Also verify actual aerial/street/day/night captures and LOD performance later, if a browser/screenshot runner is genuinely available.


## MAYOR-040 evidence-first checkpoint (2026-11-09)
Before introducing a new facade, floor, entrance, shop or mesh, correlate OSM tags and Overture feature IDs with license, capture date, geometry and uncertainty. Missing building:levels, entrance or shop data must remain null; 3m guides and 6m envelopes are explicitly non-surveyed proxies. Preserve the writer room and source-only default; do not suppress the legacy path regression at X=0,Z=8.7. Consult 3Dviz catalog/recipes/kits for the particular object before implementation, and demand actual screenshots plus source-only and legacy smoke probes before any visual release. See city/tasks/MAYOR-040-source-evidence-gate.md.
