# MAYOR-030 — Visible real-map centerline preview in the writer block
Date: 2026-11-09
Status: VERIFIED BY PUBLIC NODE/THREE.JS CI AND GITHUB PAGES DEPLOYMENT; browser screenshot QA pending.

## Single safe change
Render the **licensed OSM road-centerline candidate polygon containing the WGS84 writer-home anchor** as a clearly schematic, non-colliding, single-draw-call ground overlay in the existing Three.js town. This changes the visible scene and exposes the mismatch with the procedural road network. It does **not** substitute for actual roadway surfaces, surveyed curbs, sidewalk widths, cadastral parcels or building heights.

Source: `city/survey/output/writer-block-survey.json`, captured 2026-11-09T09:22:58.743Z, OSM map API (ODbL-1.0), © OpenStreetMap contributors. Candidate face 12,265 m²; way IDs 4292858 / 481657106 / 36697708 / 36697711. Do not enlarge the writer-block boundary.

## Before edit gates
- [x] Both frozen backup refs verified against exact SHA: private `cfdac995b6e070d472627b484c93d8fbf5f6ed2b`; public `ececf9ffc041b1666b0425f4f1746d162b9dcf67`. The identical backup manifest blob is `4821f550f9228adb7ba68e188ca8ee8a10b2dd04`.
- [x] Read writer-block skill, MAYOR-026, 3Dviz SKILL/TWIN-WORLD, relevant physical-interaction and geospatial catalog, survey data and town source.
- [x] Add dedicated lightweight preview renderer with fixed and explicitly non-geodetic stroke widths, no collision or route registration.
- [x] Verify geo origin, topology, ground placement, one draw call, scene safety and module import using existing tests.
- [x] Mirror only validated files into public web and the pinned source; verify build/deployment separately.
- [ ] Record before/after screenshots *only if browser capture actually runs*.

## Two new city backlog ideas
1. **OSM evidence layers switcher:** isolated interactive map-mode toggles for real surveyed centerlines vs legacy procedural asphalt, with always-visible provenance and no physical collision.
2. **Road mismatch heatmap:** per-road perpendicular distance from legacy mesh to OSM sourced centerlines, clipped to the writer block and reported as *discrepancy*, not a claimed reconstruction.

## Safety exclusions
No author/publisher data, citizen paths or IDs, car routes, procedural street widths, footprint positions, or outside-block geography may be changed. This overlay may be deployed only if build/geometry validation succeeds; do not claim the roads were physically rebuilt.

## Actual release evidence
- Private source commits: `e85debd8641310efb3e60b0c466aae502992d171`, `3f7656dc50e25efb2259367f88a389f249ebb60b`; geometry winding correction `7de2cc1691a33e5817301b6dc50933919387872d`.
- Public source, `.github/city-assets/writer-block-road-preview.js` and pinned `.github/citizens-assets/town.js` verified to match private source blobs; public CI now includes the new Node probe.
- Public GitHub Pages run: https://github.com/iAlirezaaa/the-writer-live/actions/runs/42604022465 (success; deploy-pages success). `TEHRAN-WRITER-BLOCK-OVERLAY-OK`: area 12264.693789530385 m², 1128 vertices, one mesh. `URBAN-PLAN-OK`, `ROAD-TOPOLOGY-OK`, `CITY-DISTRICTS-OK`, `TOWN-SCENE-OK layout/paths/wiring`, `CITY-TRAFFIC-OK` also passed.
- The real-world road geometry is still a **visual centerline guide**, not a transformed roadway, sidewalk, curb or architectural reconstruction. Real browser screenshot, map-baseline visual comparison and FPS measurements were not obtained.
