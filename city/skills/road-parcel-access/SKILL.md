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
