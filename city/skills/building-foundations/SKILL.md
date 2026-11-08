---
name: city-building-foundations
description: Detect and fix floating building volumes, duplicate shells, clipping and inadequate clearances.
---
# Street-elevation and clearance skill

1. Treat `STREET_Y=-3` as the town foundation plane. A multistorey building must have a genuine mesh supporting its ground floor from `STREET_Y` to its upper floors.
2. For `publisher-tower` and `bookstore-lofts`, test `THREE.Box3` minimum Y, ground-storey height and continuous floor slabs; upper apartment/office alone is NOT an acceptable building.
3. Never replace a removed legacy ground storey with an empty gap. Old duplicated shopfronts remain disabled for backward-compatible route data.
4. Keep actual neighboring building footprints apart by explicit minimum clearances, including protruding porches, roofs, planter edges and clickable overlays.
5. Make entry positions physically visible and reachable. Keep ground-level doors, short paved forecourts and readable signage.
6. Validate layout and test each street-facing building from ground camera angle with both day and night lighting.

Reject unsupported facades, overlapping foundations, missing ground-floor doors and collider ghosts.
