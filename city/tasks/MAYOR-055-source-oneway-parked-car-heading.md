# MAYOR-055 — Correct illustrative parked-car facing on sourced one-way streets

Date: 2026-11-10
Status: IMPLEMENTED PRIVATE; source-only parking display headings amended; public test/deploy pending.

## One bounded visual fix
In the writer-block `source-only` illustrative parked-car context, derive parked-car orientation from the **actual OSM way direction** for `oneway=yes` roads. The block's centerline ring traversal points opposite OSM one-way travel for edge 2 / `osm:way:481657106` (پنجم دریان نو) and edge 4 / `osm:way:36697711` (خلیل میکائیلی); current illustrative vehicle headings use only the polygon ring, so currently face against mapped oneway directions on those edges.

Only rotate existing display-only instanced parked-car proxies for these two sourced edges; do NOT change their positions, counts, wheel scale, topology, legal parking status, routes, ground, sidewalks, physical collision objects, writer room or other protected state. For `oneway=no` and unspecified tags, preserve existing heading. The OSM tags are mapping evidence, not a survey of traffic signage or parking legality. A parked-car facing aligned with OSM is not proof the space meets clearance or local restrictions.

## Source and backup gate
- Home anchor WGS84 `35.715361987616696, 51.3642455031707`, local +X east, +Z south.
- OSM source: `city/survey/output/writer-block-survey.json`, ODbL-1.0, captured `2026-11-09T09:22:58.743Z`. Road provenance already encoded in `web/writer-block-road-regulations.js`, and one-way metadata should be reused instead of invented.
- Backup private Git ref `cfdac995b6e070d472627b484c93d8fbf5f6ed2b` and public `ececf9ffc041b1666b0425f4f1746d162b9dcf67` verified by direct GitHub API. Backup manifests exist in both current main branches and agree.
- Confirmed `web/town.js` defaults to source-only and writer room owned by `web/world.js`; untouched.
- 3Dviz Pro Max SKILL.md, TWIN-WORLD.md and `data/recipes/accessible-clearance-study.json` reviewed. Reuse existing Three.js instancing and silhouette; rotate the body/glass/wheels as one transform. Preserve source/proxy distinction and world ground contact.

## Acceptance gates
1. `planWriterBlockContext` retains current deterministic 9 illustrative car centers and 0 new colliders; cardinal count is only for the *display*, not real parking supply.
2. For oneway=yes edge 2 and edge 4, each car axis agrees with the stored OSM source way direction; non-one-way edges unchanged.
3. New probe validates tag association, heading, source evidence and no route/citizen/writer-world modifications.
4. Run `tests/tehran_source_only_rebuild_probe.mjs`, legacy and public CI before claiming release. Actual screenshots (aerial, street, day/night) must be inspected before claiming visual quality/production fidelity. If these fail, stop and do not claim deployment.

## New backlog ideas
1. **Parking-law evidence layer**: query licensed mapped parking-side restrictions and actual curb setbacks per OSM street segment, with null for every missing value; optionally conduct licensed street survey before placing parked cars as real features.
2. **Swept clearance and intersection envelope**: compare moving-car body/door sweep, curb ramps, pedestrian clear sidewalk and no-standing corner zones on per-segment surveyed street widths; distinguish collision visualization from compliance certification.

## Actual implementation and private validation
- `web/writer-block-illustrative-context.js`: imports already-verified `WRITER_BLOCK_OSM_REGULATIONS`; `sourceAlignedParkedCarHeading` rotates only display proxies for `oneway=yes`; adds sourceWayId/map tag metadata and reports actual parking legality UNKNOWN.
- `tests/tehran_source_only_rebuild_probe.mjs`: added assert for nine existing cars and oneway alignment against the two recorded OSM way vectors.
- `web/town-tehran-rebuild.js` and `web/town.js`: import cache-token updates only; default `source-only` unchanged.
- `city/skills/roofprint-direction-audit/SKILL.md`: reusable mapping/3Dviz and legal-uncertainty guidance.

Actually executed: direct in-isolate execution of **the current GitHub JavaScript source**, using the real `geoToCityLocal`, `writerBlockLocalRing`, `buildStreetFramePlan`, OSM road regulation array and `planWriterBlockContext`, compared with pre-edit private commit `632795443e2060adf7a8602eed61d374232e472d`. Result: PASS; 9 illustrative cars before/after, 6 on two documented OSM one-way ways rotated exactly 180 degrees, 3 unchanged, 0 parking center displacements. These are proxy instances, **not nine verified parking spaces**.

This direct geometry-planner check is NOT a full Three.js render, collision sweep, legal parking certification, browser capture or CI. No photo/screenshot captured. No citizen route, room, actual street width, height, parking location, collision shape or published geometry outside this display-only orientation changed. Public Actions and pinned sync to be recorded separately.


## Public synchronization and CI result (verified)
- All six distinct private sources were mirrored to public in one atomic public commit, including three **paired pinned deploy files**; total nine public paths. Private/public Git blob SHA parity was verified for `web/writer-block-illustrative-context.js`, `web/town-tehran-rebuild.js`, `web/town.js`, city TODO, city skill and the source-only test. Pinned town.js, town-tehran-rebuild.js and illustrative-context.js use the same blobs as their respective web sources.
- Public release commit: `1334602ab45afc367ddcebaa67b75916b0ef2691` at https://github.com/iAlirezaaa/the-writer-live/commit/1334602ab45afc367ddcebaa67b75916b0ef2691
- **REAL GitHub Actions deploy PASS:** https://github.com/iAlirezaaa/the-writer-live/actions/runs/42700735582, head SHA above; `actions/deploy-pages@v4` completed successfully.
- Verified CI log output on that SHA: `TEHRAN-SOURCE-ONLY-REBUILD-OK`, `ROAD-TOPOLOGY-OK`, `CITY-DISTRICTS-OK`, `TOWN-SCENE-OK layout`, `TOWN-SCENE-OK paths`, `TOWN-SCENE-OK wiring` and `CITY-TRAFFIC-OK` (crossing minimum clearance 22.835 in the legacy scenario). Source-only mode remains the public default. This proves automated builds and specified regressions, NOT measured curb widths or true urban traffic certification.
- Screenshots, visual day/night review, licensed measured local curb/parking/sidewalk data, true house count and real-world building heights: **NOT VERIFIED**. Do not treat nine illustrated parked-car meshes as actual parking capacity.
