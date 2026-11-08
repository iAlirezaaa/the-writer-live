---
name: city-road-parcel-access
description: Plan connected roads, legible parcels, real entrances, parking and green spaces for The Writer.
---
# Road-first planning skill

1. Inspect `web/urban-plan.js` and `ROAD_SEGMENTS` before positioning any structure. All street spans must be geometrically joined.
2. Reserve parcels with setback margins around actual building footprints, not around labels. Support both north/south district blocks and old town anchors.
3. Connect each front door to a paved pedestrian route; verify the *rendered 3D geometry*, not only metadata.
4. Keep vehicle approach independent of sidewalks. Public parking is shared where frontage cannot accommodate it; the initial writer home has no private parking.
5. Design green space as landscaped buffers, never as random obstacles on routes. Avoid planters obstructing portals and signs.
6. Validate the plan and the real street geometry with `urban_plan_probe.mjs` and `city_districts_probe.mjs`.

**Stop** on any disconnected road, impossible entry, occupied crosswalk, or unsafe parking access.

## Seamless asphalt contract

Keep `web/road-surface.js` and its pinned live counterpart as the single geometry source for asphalt. `calculateRoadUnion(ROAD_SEGMENTS)` cuts street rectangles into non-overlapping tiles in ONE buffer geometry with ONE material and ONE world elevation. Do not render intersecting road plates on top of each other as the final surface. Old road strips remain below only for compatibility with citizen route probes. Test triangle winding (upward normal), consistent height, eight segment coverage, non-duplicated geometry and marking elevation in `tests/city_districts_probe.mjs` and the connected region with `tests/road_topology_probe.mjs`. Never restore the old newStreet asphalt rectangles. The only street marking elevation is `ROAD_PAINT_CENTER_OFFSET` exported by `road-surface.js`.

## Housing apron continuity — MAYOR-009
- Do not accept nearest-road distance as proof of walkability: verify the **rendered path Box3** spans from the house door face to the actual connected asphalt edge.
- For the east housing rows, the shared arterial is `east-housing-link` at Z=-24.5, width 4; walk bounds must overlap the relevant edge by at least a small tolerance.
- Ensure at least 1.5 scene units of clear path width and a street-level Y within [-3.05, -2.7] at streetY=-3.
- Keep the existing 12 path meshes; derive their lengths from home footprint and road width; do not move house IDs, traffic splines or any citizen.
- Execute `node tests/city_housing_access_probe.mjs .` as well as `urban_plan_probe`, `road_topology_probe`, and `city_districts_probe` before publishing.
