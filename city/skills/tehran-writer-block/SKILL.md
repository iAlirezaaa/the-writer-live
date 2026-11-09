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
