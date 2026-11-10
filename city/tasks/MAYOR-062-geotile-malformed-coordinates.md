# MAYOR-062 — GeoTile invalid geometry regression (2026-11-10)

Status: TODO recorded; documentation-only preflight pending safety checks.

## Scope
Add a narrowly scoped negative regression for malformed WGS84 GeoJSON coordinates to `city/tests/tehran-geotile-index.test.mjs` without modifying scene geometry, writer room, citizen routes or the tile-index implementation. The index is metadata only.

## Preflight findings
- Read mandatory Tehran writer-block skill, MAYOR-026, 3Dviz Pro Max SKILL.md and TWIN-WORLD.md, geotile implementation/tests and mayor release gate.
- The existing `featureBounds` walks coordinate arrays recursively and validates longitude/latitude through `lonLatTile`. A non-numeric first ordinate may recurse into scalars and produce a generic error; a malformed coordinate fixture should fail closed, with no generated tile metadata.
- Backup manifest exists on private main, but direct branch-ref fetch of both historical backup branches returned 404. Branch presence is **unverified**; do not change map, buildings, props, runtime or deploy assets.
- 3Dviz modeling decision: no object modeled in this iteration; silhouette, material, LOD and kit selection deferred pending licensed geometry and verified backups.

## Acceptance / validation
- A single negative test rejects malformed coordinate input and leaves runtime code unchanged.
- Run `node --test city/tests/tehran-geotile-index.test.mjs` if executable checkout available; do not claim pass otherwise.
- Keep source-only as default, preserve legacy collision probe, and leave pinned Pages assets unchanged.
- Private first; mirror test and this city-only task to public; compare blobs and report SHA.

## Two backlog ideas
1. Add a schema validator for finite numeric lon/lat pairs, ring closure, and minimum LineString/Polygon vertex counts before tile assignment.
2. Add a bounded tile-cache ownership test with reference-counted GPU disposal, including features crossing tile boundaries.
