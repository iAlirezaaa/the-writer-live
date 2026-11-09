# MAYOR-051 — Unknown building attributes audit (documentation-only)
Date: 2026-11-09
Status: TODO RECORDED; evidence audit complete; geometry not changed.

## Scope and recovery
Writer-block WGS84 home anchor 35.715361987616696, 51.3642455031707; +X east, -Z north. Both frozen backup branches were found; backup manifest read. Backup SHA values remain cfdac995b6e070d472627b484c93d8fbf5f6ed2b (private) and ececf9ffc041b1666b0425f4f1746d162b9dcf67 (public). Branch head equality to these SHAs was NOT reverified in this run. Do not alter either branch.

## One small task and result
Audit the current manifest for the four licensed Overture ML roofprint candidates before authoring a fourth independent building or real shops. Existing IDs: 3d2290d6-c533-4c11-b2c0-079f0ee2e29e (1035.58 m²), 3d7b8239-b1e0-48bc-8868-ae4a4d392586 (965.73 m²), 75edb751-8810-4f84-97b5-a53b58dbbf03 (1954.26 m², intersects protected room), 76931a07-c621-4e37-9241-c41ee59d4248 (2505.89 m²). All four lack verified building height, floor count and entrance; do not infer storefronts or apartments from ML polygons. The 6m volumes and 3m lines are labeled illustration only. The room-intersecting footprint stays outline-only. No new source measurements were obtained.

## 3Dviz Pro Max craft check
Read SKILL.md, TWIN-WORLD.md and references/object-craft.md. Apply silhouette → joints → material → ground contact → LOD sequence only after source-level evidence and exact footprint intersection are checked. Current choice: defer kit/recipe and any geometry change; unknown façades and doors cannot be represented as real. Do not change source-only default, protected room, citizen routes, writer or publisher.

## Evidence required for next modeling step
For each new entrance, shop or floor: dataset/release, feature ID, OSM tag or Overture attribute, original geometry, WGS84 location, acquisition timestamp, license/attribution, spatial correspondence, and uncertainty. Unknown stays null. OSM centerlines do not establish curbs or parking rules. Review current MAYOR-050 offset sampling as preliminary only, not a clearance proof.

## Tests and release gate
Documentation-only. Node/Three.js probes, legacy collision tests, screenshot comparisons and live Pages checks NOT RUN. No runtime files changed, no scene deployment claimed. Legacy citizen route collision at X=0 Z=8.7 remains a known release gate until separately validated.

## Two new backlog ideas
1. Create a reproducible per-building evidence completeness score (source ID, dated level/height/entrance/usage tags) that rejects unverified claims before any mesh builder runs.
2. Add an exact geometry polygon-versus-sidewalk swept-envelope regression with a saved GeoJSON fixture and separate labels for observed widths versus design hypotheses.
