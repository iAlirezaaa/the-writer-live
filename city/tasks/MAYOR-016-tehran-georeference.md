# MAYOR-016 — Tehran georeference foundation (2026-11-09)
Status: PLANNED. Small safe slice: coordinate metadata only, no mesh or citizen movement changes.

## User requirement
Georeference the writer's home to latitude 35.715361987616696, longitude 51.3642455031707, and gradually reconstruct the surrounding Tehran neighborhood as a simulation.

## Scope and safeguards
- Add immutable WGS84 geographic origin and local-meter mapping metadata to city urban plan only.
- Local city X means east and local Z means south, so north is -Z. Preserve existing writer home at local (0,0).
- No invented claim that current buildings or roads match actual Tehran geography. No unverified OSM/municipal map import.
- Do not edit private writer/publisher state, citizen routes, building geometry or road topology.
- Verify coordinate conversion at origin and 100m offsets before promoting public pinned asset. If execution unavailable, document limitation.

## Acceptance
Coordinate origin is exact; local-to-WGS84 and inverse return approximate meter offsets, valid for neighborhood-scale visualization; existing layout remains unchanged.

## Backlog (two new ideas)
1. Curated, license-checked OpenStreetMap street centerlines and intersections for a 500m radius, with source attribution and explicit alignment QA.
2. Neighborhood facade/vegetation palette survey and terrain-elevation sampling with visual references and provenance per block.
