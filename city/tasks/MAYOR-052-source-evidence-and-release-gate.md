# MAYOR-052 — Verify building counts and street cross-sections before geometry edits
Date: 2026-11-10
Status: TODO / evidence gate; no geometry changed

## Scope
Only the WGS84 writer block around 35.715361987616696, 51.3642455031707. Preserve the writer room, citizens' routes, author and publisher state. Default town mode remains source-only.

## Evidence baseline
The current manifest contains four Overture ML roofprint candidates, **not** four proven houses. The polygons may merge multiple properties. Actual floors, units, heights, doors, facade directions, and shops remain unknown. OSM road centerlines do not establish actual curb-to-curb width, sidewalk widths, or legal parking spaces. Previous illustrative 10.7m cross-section and 6m building proxy must not be presented as measured Tehran conditions.

## Single small deliverable
Add an evidence checklist for **one** OSM street segment, to be implemented only after verified permitted measurements: source way ID and node coordinates, legal data provenance/license and capture time, centerline topology, surveyed cross-section and uncertainty, sidewalk and curb widths on each side, parking restrictions and bay length, clear vehicle/pedestrian widths, corner radii and junction visibility, driveways, grades and building setbacks. Record unknown values as null, never inferred geometry.

## 3Dviz review
Consulted vendored SKILL.md and TWIN-WORLD.md; model only after checking relevant catalog/recipe/kit. Keep Three.js single scene; inspect silhouette, ground contact, LOD and materials. No new asset is authorized until evidence and runtime checks.

## Acceptance / release
Before a visual edit: confirm both immutable backup refs and backup manifest; run tehran_source_only_rebuild_probe.mjs, road topology, writer-house consistency, legacy smoke/route safety, collisions, clearances, terrain contact and performance; capture real aerial/street/day/night before-after images. If tests/captures cannot run, no risky visual release. Synchronize private to public only after validation and pinned-file parity.

## Backlog (new)
1. Licensed per-segment curb/sidewalk/parking-width evidence ledger with uncertainty and legal parking metadata.
2. Continuous swept-envelope clearance test for moving vehicles, parked-car door opening, accessible footpaths and junction turning radius.

## Execution report
Documentation-only safety task. No runtime tests, browser captures, measured street widths, source-derived house count or deployment verification performed in this execution. No city geometry, citizen routes, or writer room changed.
