# MAYOR-047 — actual OSM connecting alleys to Sattarkhan main street
Date: 2026-11-09
Status: PRIVATE LICENSED OSM GEOMETRY AND DIRECT THREE.JS CHECK PASSED; PUBLIC CI/DEPLOYMENT UNVERIFIED

## Single safe geospatial addition
Use ONLY the 2026-11-09 existing official OSM source capture at city/survey/output/writer-block-survey.json. Render a small separate non-colliding road/sidewalk **illustrative strip** outside the original block, along exact sourced OSM way vertices and correct topology. The user explicitly authorized gradual home-to-main-street-and-Park-Sattarkhan expansion. This iteration reaches the existing mapped **main Sattarkhan road**, NOT yet the park polygon.

Verified ways from private source capture:
- 36697706 پنجم دریان‌ نو, residential, 30, oneway=yes; branch from Falahat Pour
- 92200441 ششم دریان نو, residential, 30; branch from Falahat Pour
- 481439240 نهم دریان نو, residential, 30, oneway=no; branch from Falahat Pour
- 471546873 علی نبی پور, residential, 30, oneway=yes; connecting fifth/sixth alleys to main
- 207742970 ستارخان, primary, 50, oneway=yes; connecting branches/main street
- 36697711 خلیل میکائیلی, residential, 30, oneway=yes; mapped western approach to main
All sources use ODbL-1.0 © OpenStreetMap contributors, captured 2026-11-09T09:22:58.743Z. Selected way subranges must be exact contiguous source vertices. Map source status candidate, no surveyed widths, sidewalk width, elevation, storefronts, road surfaces or park geometry.

## Gate
- [x] Rechecked both immutable backup SHAs and recovery docs; mandatory city/3Dviz SKILL + TWIN-WORLD read.
- [x] Found connected actual way endpoints and names in the licensed OSM snapshot; clip to near east/writer corridor, not all 230m source way extents.
- [x] Create separate source-only non-physical Three.js roads group, 3 side alleys + linked main-way segment, with illustrative width metadata.
- [x] Add source-tag exact-coordinate verification and junction-connection test. No old road/citizen/writer movement changes and no regression test deletion.
- [ ] Run direct Three.js geometric audit and full CI, mirror private→public city + pinned Pages assets, report actual SHAs, deployment and screenshot limits.
- [ ] Park Sattarkhan OSM way 448551081 full boundary and a linked street route to it still NOT acquired; leave as separate later task.

## Two NEW backlog items
1. Connect Sattarkhan Main to park OSM way 448551081 via officially sourced walkable/driveable network and fully mapped park boundary; do not draw straight-line invented roads.
2. License-safe adjacent-parcel OSM/Overture footprint acquisition at the newly rendered side streets, then add ONE polygon building per hour with independently verified height/storey evidence and renderer collision checks.

## 3Dviz safety
Use low draw-call joined strip meshes and separate sidewalk/road materials. No visual road width as an actual measured roadway or navigation graph. Original writer room remains in owner-defined third floor, and existing citizen behavior/traffic code remains unchanged.

## Verified private runtime
- Source authored in web/writer-satarkhan-osm-corridor.js, 6 way subsets with 5 topology junctions, full authoritative scene assembled with actual vendored Three.js.
- Geometry includes 68 triangles of illustrative asphalt/apron and three map-name plates, bounds x 16.928..227.434 and z -142.439..56.075 with finite Y -2.925..-2.770; 9 total city groups and 40 render objects.
- The room remains at user-authored Y=6.6 (third floor), old source-only buildings and traffic/citizen path algorithms unchanged.
- No park polygon acquired yet and no building floor heights/units measured. Node CI, browser captures, FPS and Pages deployment must be confirmed separately.
