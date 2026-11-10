# MAYOR-069 — deterministic OSM snapshot release gate
Status: TODO / documentation-only safety gate (2026-11-10)
Scope: Civita di Bagnoregio only. No geometry or runtime changes in this iteration.

## One measurable change
Document the acceptance contract for a future licensed, reproducible OSM snapshot, rather than silently treating live Overpass results as permanent survey data.

## Acceptance checklist
- [ ] Record bounded query, retrieval UTC timestamp, OSM element IDs and versions, changeset/timestamp when supplied, license ODbL-1.0, attribution, source URL, raw payload digest and source bounds.
- [ ] Reject duplicate IDs, invalid closed rings, non-finite coordinates, out-of-bounds points and unreasonably large payloads; preserve null height/levels/roof/entrance/elevation.
- [ ] Keep OSM footprint polygons and pedestrian centerlines separate from DEM, cliff and bridge meshes. No invented topology or heights.
- [ ] Compare fixture geometry, provenance, room collision, gate-to-piazza connectivity, render budget and camera boundary at every zoom/corner.
- [ ] Test offline fallback and Overpass errors; publish only after browser WebGL screenshot, console and mobile inspection.
- [ ] Confirm private/public pinned Pages asset parity and CI run URL/SHA before marking deployed.

## Protection
Do not alter protected writer room, author/publisher data, citizen identity/routes, non-city modules, Tehran rollback branches or backup manifests. Existing preview remains a provisional OSM-derived representation, not surveyed 3D terrain.

## Execution evidence
This iteration adds only this gate and two skill backlog items. No browser capture, geometry test or CI run is claimed.
