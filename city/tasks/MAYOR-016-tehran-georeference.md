# MAYOR-016 — Tehran georeference foundation (2026-11-09)
Status: IMPLEMENTED (metadata only); deployment unverified. Small safe slice: coordinate metadata only, no mesh or citizen movement changes.

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

## Actual verification and release notes
- Inspected and executed the private urban-plan module's exported coordinate functions in JavaScript (without changing its constants): 100m east / 100m north round-trip error below 0.000001m.
- Executed `auditUrbanPlan()` in the same JS evaluation: ok=true; 0 collisions, 0 setbacks, 0 road disconnections, 0 unreachable parcels; 17 parcels and 12 roads.
- A standalone Node probe was committed but **not run**: this environment cannot resolve raw.githubusercontent.com for container download. Browser rendering and Pages deployment were not confirmed.
- Private and public source + pinned urban-plan Git blob SHA: `64480b048da29fa8b140e99df09dc83e1d83a496`.
- Geographic anchor is a metadata foundation only; Tehran street/building fidelity is not yet implemented.
