# MAYOR-030 — Visible real-map centerline preview in the writer block
Date: 2026-11-09
Status: IN PROGRESS — source inspection done; runtime/code checks and visual proof pending.

## Single safe change
Render the **licensed OSM road-centerline candidate polygon containing the WGS84 writer-home anchor** as a clearly schematic, non-colliding, single-draw-call ground overlay in the existing Three.js town. This changes the visible scene and exposes the mismatch with the procedural road network. It does **not** substitute for actual roadway surfaces, surveyed curbs, sidewalk widths, cadastral parcels or building heights.

Source: `city/survey/output/writer-block-survey.json`, captured 2026-11-09T09:22:58.743Z, OSM map API (ODbL-1.0), © OpenStreetMap contributors. Candidate face 12,265 m²; way IDs 4292858 / 481657106 / 36697708 / 36697711. Do not enlarge the writer-block boundary.

## Before edit gates
- [x] Both frozen backup refs verified against exact SHA: private `cfdac995b6e070d472627b484c93d8fbf5f6ed2b`; public `ececf9ffc041b1666b0425f4f1746d162b9dcf67`. The identical backup manifest blob is `4821f550f9228adb7ba68e188ca8ee8a10b2dd04`.
- [x] Read writer-block skill, MAYOR-026, 3Dviz SKILL/TWIN-WORLD, relevant physical-interaction and geospatial catalog, survey data and town source.
- [ ] Add dedicated lightweight preview renderer with fixed and explicitly non-geodetic stroke widths, no collision or route registration.
- [ ] Verify geo origin, topology, ground placement, one draw call, scene safety and module import using existing tests.
- [ ] Mirror only validated files into public web and the pinned source; verify build/deployment separately.
- [ ] Record before/after screenshots *only if browser capture actually runs*.

## Two new city backlog ideas
1. **OSM evidence layers switcher:** isolated interactive map-mode toggles for real surveyed centerlines vs legacy procedural asphalt, with always-visible provenance and no physical collision.
2. **Road mismatch heatmap:** per-road perpendicular distance from legacy mesh to OSM sourced centerlines, clipped to the writer block and reported as *discrepancy*, not a claimed reconstruction.

## Safety exclusions
No author/publisher data, citizen paths or IDs, car routes, procedural street widths, footprint positions, or outside-block geography may be changed. This overlay may be deployed only if build/geometry validation succeeds; do not claim the roads were physically rebuilt.
