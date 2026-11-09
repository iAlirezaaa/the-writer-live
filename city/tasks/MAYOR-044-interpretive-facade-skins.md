# MAYOR-044 — Reversible architectural texture/relief on the THREE source-backed block envelopes
Date: 2026-11-09
Status: PRIVATE MODEL AND DIRECT THREE.JS CHECK PASSED — NOT A SURVEY OR BROWSER SCREENSHOT

## Goal
The user wants a complete, visibly built block rather than bare 6m masses. Add ONE reversible, non-authoritative façade-detail LOD layer to three existing source-backed illustrative envelopes, without altering source footprints, roof height, room, access, citizen paths or 3D physics.

## Work
- [x] Read MAYOR-026, Tehran skill, 3Dviz Pro Max SKILL + TWIN-WORLD + architecture/object-craft; verify immutable backup branches and manifest.
- [x] Author a separate Three.js module for instanced panels/window-like shapes on the exposed exterior edges of 3 existing Overture polygons; per-building palette and style **artistic placeholders**, not surveyed Tehran windows, storeys, units or real uses.
- [x] Keep all source ring vertices and extruded 6m mass unchanged; never split multi-building ML roofprints. No true entrances or storefront labels.
- [x] Attach new family to existing building groups *only*, preserve source-only town root shape, save full uncertainty metadata and preserve physicalCollider=false, paths unchanged.
- [x] Add bounded geometry/instance/daylight tests and confirm render occupancy, group AABBs, source-only, preserved author and legacy tests.
- [ ] Commit private first; mirror reviewed city files and Pages pin only after source-only geometry validation; report CI and visual limitations.

## Two backlog ideas
1. Licensed façade photo registration by stable Overture ID and exact camera pose, with a consent/license/accuracy checklist and per-wall confidence.
2. Per-building information hierarchy for known/unknown roof height, floors, unit count, shop use, entrance and street adjacency in the public inspect panel.

## 3Dviz recipe
Use architecture/interiors workflow as appearance-only; batch repeated small elements with InstancedMesh and cap draw calls. Side-specific orientation and contact to the existing shell must be checked in Three.js, not inferred from source rooftop polygons.

## Evidence
OSM/Overture roofprints ODbL 1.0 (2026-11-09). All façade detail is unsurveyed, replaceable illustration. Google Maps/Google 3D images or geometry not copied.

## Direct results
Source-only Three.js assembled 7 groups with all three source shells and reversible facade detail: building 01=40; building 02=47; building 03=70 illustrative repeated facade bays; 9 InstancedMesh drawables; 34 scene render objects, all finite bounds; unchanged writer room and zero traffic/colliders. Full CI, screenshot, deployed build status must be verified independently. No real storey/entrance/window/unit claims.
