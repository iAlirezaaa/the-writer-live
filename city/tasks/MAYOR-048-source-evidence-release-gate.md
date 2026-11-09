# MAYOR-048 — Roofprint evidence and backup verification gate
Date: 2026-11-09
Status: TODO registered; documentation-only safety change, no runtime edits.

## TODO before any change
- [x] Read GOAL, manifest, Tehran skill, MAYOR-026, 3Dviz SKILL and TWIN-WORLD.
- [x] Inspect existing source-evidence gaps and choose one bounded safety improvement: define a roofprint evidence gate.
- [ ] Independently confirm backup branch HEADs against the recorded immutable snapshot SHAs (branch-path lookup alone was inconclusive).
- [ ] Acquire licensed building:levels, entrance and shop POI evidence for one selected roofprint; record source ID, capture date, terms and confidence.
- [ ] Only after evidence and tests, alter one Three.js building; preserve room and citizens.

## Narrow implemented change: evidence gate specification
Target candidate: Overture 3d2290d6-c533-4c11-b2c0-079f0ee2e29e (1035.58 sqm). Existing manifest has null source height, floors, entrances and shop use. **No real floors, doors, commercial units or facades may be inferred.** Before any corresponding 3D geometry change, require: (1) licensed source and original feature identifier; (2) WGS84 polygon and area reconciliation; (3) explicit measured/unknown height, floor and entrance fields; (4) 3Dviz silhouette/contact/LOD recipe decision; (5) source-only, room, road, legacy and performance probes; (6) real captures if possible. A 6m mesh is a visual proxy, not a measured structure.

## Source/3Dviz lesson
TWIN-WORLD favors deterministic mesh ownership and physical support. For ML-derived merged roofprints, keep a single source envelope until independent segmentation evidence exists; adding believable window rows or ground-floor shops would misrepresent uncertain geometry. Catalog kit selection is deferred until a specific measured object is ready.

## Backlog — two new ideas
1. **OSM–Overture feature reconciliation report:** detect polygon mismatch, shared edges and merged-building uncertainty without splitting or moving meshes.
2. **Evidence completeness meter per facade:** track whether each visible entrance, shopfront, level and roofline is surveyed, owner-authored proxy or unknown.

## Verification and blockers
Private backup record exists on default branch. Fetching that record *at the backup branch* returned NOT_FOUND in both repositories; this does not prove the branches are absent, because the record may postdate the snapshots. Branch HEAD SHA not independently verified. No local runtime, Three.js probe, screenshot, weather request, CI or Pages deployment performed. No changes to town/world, room, citizen routes or public pinned assets. Public mirror of this document only is safe.
