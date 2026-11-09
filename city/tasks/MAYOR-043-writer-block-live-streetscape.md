# MAYOR-043 — Populate the real writer block with clearly labeled, reversible city-life proxies
Date: 2026-11-09
Status: PRIVATE SOURCE AND DIRECT THREE.JS ASSEMBLY CHECK PASSED — public release and browser captures pending

## Scope and safeguards
Source-only remains the default, WGS84 home anchor is unchanged, OSM road-bound single-block boundary unchanged, and all four Overture polygons remain unchanged. The user requests a visibly populated, less-empty block. Add a single bounded **illustrative context layer** inside the established block, without pretending these details are surveyed Tehran or modifying citizens, writer, publisher, outside-block geometry, underlying traffic or physics.

## Worklist
- [x] Verify private/public backup branches and recovery manifest, and read city/GOAL.md, city/skills/tehran-writer-block/SKILL.md, MAYOR-026 and vendored 3Dviz Pro Max SKILL/TWIN-WORLD and relevant environment recipe.
- [x] Add one deterministic lightweight Three.js streetscape group: planted trees, shrubs, street lamps with Tehran-clock-responsive glow and **stationary illustrative vehicle meshes** (not actual traffic/parked car observations). Source geometry guides placement; widths remain proxy.
- [x] Keep props in the approved road-bounded block; exclude writer-room reserve and source roofprints. Limit InstancedMesh draw calls and mark objects `sourceTruth:false` / `physicalCollider:false` / `routesUnchanged:true`.
- [x] Integrate into private source-only group; preserve empty-retired bulk mesh and 3 independently modeled roofprints.
- [x] Add Node/Three.js probe and amend source-only geometry regression without weakening writer-room, legacy, road or collision safeguards.
- [ ] Verify geometry, site and protected tests. Mirror only city assets to public `web/` and `.github/city-assets/`, update Pages pin and tests if verified; do not modify unrelated files.
- [ ] Log actual test and CI status, commits and observed captures; no deployment claims without success.

## Two future backlog ideas
1. **Observed facade capture pipeline:** ethically licensed street-level photography / municipal levels and entrances per Overture ID with photo-to-mesh camera evidence and uncertainty.
2. **Bounded scene-detail density inspector:** toggle source truth vs artistic context; count instances, draw calls and FPS against actual mobile screenshots before increasing proxy density.

## Evidence and rights
- Roads: dated OpenStreetMap ODbL centerline candidates, **not surveyed widths**.
- Footprints: dated Overture / Microsoft ML Buildings ODbL polygons, **not authoritative building segmentation**.
- Props: authored illustrative geometry based on generic urban object types, **not copies of Google 3D or claimed existing physical objects**.
- 3Dviz recipe: historical diorama evidence layers / environment craft. Separate measured/located evidence from interpretive props. Avoid proprietary source copying.

## Direct runtime evidence (not CI or browser observation)
- Vendored Three.js actual classes were evaluated in an isolated JS runtime and all private scene builder dependencies assembled: seven top-level town groups; 25 renderable objects; one interpretive context group; 11 InstancedMesh objects; no NaN/Infinite bounds, no resident motion changes, zero physical colliders; protected room/exterior retained.
- Context sampled counts: trees=19 shrubs=27 lamps=16 stationary car proxies=9; night bulb emissive 2.4 vs daylight 0.3. None are claimed to be real-world surveyed locations.
- The full Actions/Pages legacy gate and actual visual screenshots remain distinct requirements and NOT PASSED in this record.
