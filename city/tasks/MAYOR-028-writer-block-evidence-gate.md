# MAYOR-028 — Writer-block evidence gate (2026-11-09)

Status: DOCUMENTATION ONLY; no runtime geometry changed or deployed.

## Pre-change TODO
- [x] Verify both frozen backup refs resolve to the specified commits; GitHub compare returned identical (ahead=0, behind=0).
- [x] Read city Tehran skill, MAYOR-026, 3Dviz SKILL.md and TWIN-WORLD.md before any object work.
- [x] Inspect current georeference and procedural road/parcel declaration.
- [ ] Obtain a legally reusable, dated OSM/municipal extract for the roads surrounding WGS84 35.715361987616696, 51.3642455031707.
- [ ] Determine the road-bounded writer block from actual sourced geometry, not an invented rectangle.
- [ ] Verify feature IDs, source license/attribution, capture date, coordinate accuracy, elevation and ground-control correspondences before modeling.
- [ ] Capture actual baseline overhead, street, daylight and night screenshots before visual edits.
- [ ] Run Tehran georeference, urban layout, topology, scene, house, traffic and public build probes before runtime publication.

## Findings
The WGS84 anchor and Asia/Tehran timezone are present in web/urban-plan.js; ROAD_SEGMENTS and BUILDING_PARCELS are procedural placeholders. The existing 3Dviz TWIN-WORLD guidance requires a single Three.js scene, stable IDs, grounded contacts, and real browser screenshot review. Neither a licensed block polygon nor measured building footprints were established in this run. Do not alter map geometry or claim a surveyed digital twin yet.

## Proposed small next object (not implemented)
A single sidewalk fixture inside the sourced block: use 3Dviz catalog search for street furniture; inspect silhouette, supports, grounding, UV/material scale and LOD, then measure clearance and screenshot-diff before replacing its current builder. No unlicensed geometry or new fictional object is authorized.

## Two distinct backlog ideas
1. Source-coverage matrix: every road edge and parcel gets OSM/municipal source ID, license, observation date and positional confidence; reject unsourced polygons.
2. Street-furniture grounding probe: deterministic checks for base-to-terrain contact, sidewalk clearance and LOD draw-call delta for one fixture at a time.

## Evidence / release
Backup refs verified through GitHub compare against exact private cfdac995b6e070d472627b484c93d8fbf5f6ed2b and public ececf9ffc041b1666b0425f4f1746d162b9dcf67. Both repository backup manifests are present on current default branches. Runtime tests: NOT RUN. Browser captures: NOT TAKEN. Live weather/network and Pages deployment: NOT VERIFIED. This document is safe to mirror; do not mirror private 3Dviz vendor content or other unrelated files.
