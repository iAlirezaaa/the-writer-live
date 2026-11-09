# MAYOR-058 — Tile index feature provenance for future Tehran geometry streaming
Date: 2026-11-10
Status: TODO (recorded before source change)
Scope: metadata only, one small change in `city/survey/tehran-geotile-index.mjs`; no Three.js mesh or runtime deployment.
Goal: expose stable source feature type and WGS84 bounding box in the index so a future loader can select and deduplicate real road/building features by ID across tile borders, without fabricating geometry.
Evidence: current OSM survey 2026-11-09, ODbL, writer-block source; no new survey data. Current index holds tile -> IDs but no per-feature lookup.
Safety: preserve original IDs, original CRS, original geometry in source; never change `web/`, `world.js`, citizen routes, writer room, publisher, snapshots, backup branches or private data.
3Dviz review: `cognition/skills/3dviz-pro-max/SKILL.md`, `TWIN-WORLD.md`, `references/object-craft.md` and `data/recipes/courtyard-house-cutaway.json` reviewed. A courtyard recipe is a conceptual modeling reference only, not evidence of Tehran facades. Metadata-first prevents speculative roofs, openings, contact, or LOD.
Acceptance: add deterministic feature metadata map keyed by ID with `geometryType` and WGS84 bbox; test one building point and multi-tile road; run `node --test city/tests/tehran-geotile-index.test.mjs` and city probes before claiming tested; mirror private->public after source review. No screenshots possible for metadata-only change.
Backlog A: integrate a source-ID keyed tile-loader cache with reference counting and GPU disposal, no duplicate meshes at tile seams.
Backlog B: acquire licensed ground-truth roof heights/entrances for one source ID and compare street/roof/overhead captures before any extrusions.

## Result / release evidence (2026-11-10)
- Status: SOURCE + TEST COMMITTED IN PRIVATE AND PUBLIC; **runtime visual validation not claimed**.
- Private source commit: `ddf40679ee7bbc5a6471beb0ed4149b2598a7361`; private test: `474fbf4afaf1342a53d3ab08974689855a9af15b`; private skill: `9e03a328f350ed228b1d05cd8b91fc565b86ca27`.
- Public source commit: `46d23b8e1ad326160e77dd37330953d51176fdb0`; public test: `b82629160ba8189c0ec6be106203075862faab0f`; public skill: `a709172973bd3897a54ebe339eeab38c17ce9a38`.
- Verified by GitHub reads: frozen backup branch exists in both repos; private backup manifest records the two original snapshot SHAs. **No backup refs modified.**
- New deterministic map: `features[sourceId]` carries original WGS84 bbox and geometry type; it is not a render mesh and does not alter any browser entrypoint, street, roof, citizen, room, route, lighting, or private narrative.
- Tests were added to `city/tests/tehran-geotile-index.test.mjs` for the point and multi-tile road. No local Node process or browser screenshot was run in this execution; CI results and Pages deployment for these commits are **unverified**. Existing legacy X=0/Z=7.3 safety failure must not be waived.
- Before promoting any runtime geometry: execute `node --test city/tests/tehran-geotile-index.test.mjs` and source-only, legacy, collision, road topology and writer-room probes; capture street/top/day/night and check Pages logs.
