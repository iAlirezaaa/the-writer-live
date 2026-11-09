# MAYOR-039 — Second Tehran source roofprint, illustrative storey scale, commercial-data audit
Date: 2026-11-09
Status: IN PROGRESS (source/geometry validation and public deployment pending)

## User priority
Start reconstructing actual mapped buildings, floors, streets/alleys and shops from overhead licensed geographic evidence. Rebuild only the originally authorized single writer-home road-bounded block, preserving the author's room, states, identities and citizen route data. No fake verified floor/shop claims.

## Must-read and frozen backups, checked before geometry
- [x] Private `backup/writer-block-pre-tehran-rebuild-2026-11-09`: `cfdac995b6e070d472627b484c93d8fbf5f6ed2b`.
- [x] Public: `ececf9ffc041b1666b0425f4f1746d162b9dcf67`.
- [x] Manifest `city/backups/writer-block-pre-tehran-rebuild-2026-11-09.md` Git blob `4821f550f9228adb7ba68e188ca8ee8a10b2dd04` matched both.
- [x] Read `city/skills/tehran-writer-block/SKILL.md`, MAYOR-026, 3Dviz Pro Max `SKILL.md` and `TWIN-WORLD.md`, plus `citygml-stable-id-scenario-diff` and `historical-diorama` recipes; current OSM and Overture sources, current source-only Three.js builder and tests.

## Actual evidence; never infer missing fields
- Existing licensed Overture/Microsoft-ML `city/survey/output/writer-block-overture-buildings.json`, ODbL 1.0, 2026-11-09 12:18Z. Exactly four **possibly compound** roofprint candidates, ALL `heightMetersSource:null` and `numberFloorsSource:null`. One overlaps writer-room reserve and must remain outline-only.
- Current licensed OSM `city/survey/output/writer-block-survey.json`: 7 OSM buildings in the wider context, none inside the road-bounded writer block, **no mapped shop, address, commercial frontage or building:levels tags anywhere in this snapshot**. The several `service=alley` roads are outside this specific block. Existing four block-boundary roads are documented, but real pavement/curb dimensions are unavailable.
- Selected SECOND independent shape for this iteration: `3d2290d6-c533-4c11-b2c0-079f0ee2e29e` (source footprint 1,035.58 sqm; 15 planar vertices). Real-world number of separately attached buildings, floors, facades, shop units, entrances, roof details and storeys **UNKNOWN**.
- `web/writer-block-building-02.js` visual silhouette will use exact source polygon, ONE 6m transparent/neutral illustrative envelope with at most ONE horizontal 3m scale line (NOT evidence of 2 storeys), no fabricated windows/shopfronts/signs and no physics. Separate from the remaining anonymous volume and author room. This is a floor-height measuring guide, **not a count of actual levels**.

## Single safe incremental change
- [ ] Implement independent mapped building 02 and its scale guide with source-ID metadata, license/date, exact vertex and area checks and room protection; 3Dviz clean silhouette and low draw calls.
- [ ] Remove only this ID from prior anonymized Overture ghost batch; keep other true source IDs, protect author-room overlap and no duplicates.
- [ ] Integrate in `web/town-tehran-rebuild.js` (source-only, not `mapMode:legacy`), keep map layer count gated and writer room externally owned.
- [ ] Source integrity/Three.js tests: actual WGS84/projected polygon, bounds, height-label uncertainty, all points in single block, no crossings/colliders, no new road or citizen changes, no fabricated shop/storey metadata.
- [ ] Mirror private-authoritative changes to public pins, run Pages deployment and city acceptance suite; actual screenshot review marked unverified unless captured.

## Exactly two new backlog ideas
1. Acquire a **licensed ground-floor commercial address/POI inventory** for just this polygon and its boundary frontages; add storefronts only with exact OSM node/way/verified licensed source and uncertainty, without inventing signs/names/tenants.
2. Acquire or survey **building:levels / roof height / entry floor / internal narrow passages** for the 4 Overture roofprints; map true sub-building footprints and alleys only if independent source geometries support them, before physical street/citizen migrations.

## Risks and release contract
Overture is ML-derived and may merge several Tehran buildings into one source polygon. An illustrative horizontal guide at 3m is *not two actual floors*. No real business names can be asserted from the current source. Do not enlarge beyond the block or overwrite backup. Publication contingent on current Node/Three.js scene/room/traffic gates, and no screenshot claims without real capture.
