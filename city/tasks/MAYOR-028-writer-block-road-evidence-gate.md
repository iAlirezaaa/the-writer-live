# MAYOR-028 — writer-block road evidence gate (2026-11-09)
Status: DOCUMENTATION COMPLETE; geometry and deployment intentionally unchanged.

## Single safe change
Audit the existing road surface builder against the exact-Tehran evidence contract, and document a non-destructive acceptance gate for replacing ONE road segment in a future iteration. Do not alter street meshes, parcels, resident routes, or deployed modules without licensed street boundaries and browser visual QA.

## Mandatory recovery gate
Both backup branches `backup/writer-block-pre-tehran-rebuild-2026-11-09` found by GitHub branch search; backup manifest present in both repositories, identical blob `4821f550f9228adb7ba68e188ca8ee8a10b2dd04`. Frozen private SHA `cfdac995b6e070d472627b484c93d8fbf5f6ed2b`; public SHA `ececf9ffc041b1666b0425f4f1746d162b9dcf67`. Never mutate these refs.

## Evidence required for future one-segment replacement
- Licensed road-edge or curb geometry for the road-bounded block containing WGS84 (35.715361987616696, 51.3642455031707), including source URL, license, capture date, data vintage and positional uncertainty.
- Road connectivity, crossing clearance, ground height, entrance access, and the baseline screenshot set before/after at matched camera positions.
- Inspect 3Dviz Pro Max catalog/recipe/kit relevant to road furniture; preserve existing Three.js ownership, materials, LOD and picking.
- Run urban, road, georeference, house and scene probes before publication. Do not claim success without actual execution.

## Initial code observation
`web/urban-plan.js` labels its 12 road segments as procedural, not surveyed. `web/road-surface.js` computes a non-overlapping union of axis-aligned rectangles; it has no licensed road-edge geometry, provenance or positional uncertainty. Its `streetY=-3` default is a render-plane parameter, not measured Tehran elevation. Therefore no physical road segment should be relabeled as a Tehran survey or replaced yet.

## Verification pending
No runtime Node/browser, screenshot, live mapping extract, road/parcel survey or Pages deployment was performed during task registration. No private writer/citizen data modified.

## Two new backlog ideas
1. **Licensed curb-control-point ledger:** store each surveyed curb vertex's original source ID, acquisition date, datum, license and measured error; flag any unverified curb before importing into Three.js.
2. **Road-proxy discrepancy heatmap:** calculate distances from current procedural road centerlines to independently licensed measured road geometry within the verified writer-block polygon; render only a diagnostic overlay until reviewed.

## Execution result
Private documentation task and road evidence skill added. The two backup branch names and identical manifest blobs were checked through GitHub. Read the vendored 3Dviz SKILL and TWIN-WORLD; catalog/recipe/kit selection remains blocked by lack of a surveyed target asset and matching record. The road builder was inspected. No road geometry, runtime code, writer/publisher/citizen data, or public pinned runtime files were changed. Tests and screenshots NOT RUN; no deploy claimed.
