# MAYOR-040 — Licensed evidence gate for next Tehran writer-block building
Date: 2026-11-09
Status: TODO recorded; documentation-only; no scene geometry or deployment changes.

## Preconditions checked
- Both repositories expose backup/writer-block-pre-tehran-rebuild-2026-11-09; baseline record exists in both.
- Private snapshot cfdac995b6e070d472627b484c93d8fbf5f6ed2b; public snapshot ececf9ffc041b1666b0425f4f1746d162b9dcf67 (recorded baseline; branch file access checked, exact commit ref not independently resolved).
- Read city/skills/tehran-writer-block/SKILL.md, MAYOR-026, cognition/skills/3dviz-pro-max/SKILL.md and TWIN-WORLD.md.
- Current manifest: four Overture ML roofprints; unknown floors, height, facade, entrances and commercial POIs; one footprint intersects protected writer room. Do not split ML aggregates.

## Single safe task
Create a per-feature evidence checklist before any additional building mesh or shop is introduced. Candidate source OSM building:levels, entrance=*, shop=* and addr:* tags, and Overture building attributes, only if feature IDs, license, capture date and geometry are verifiable. Unobserved tags remain null; never translate a 6m proxy into two factual storeys. Keep source-only as public default. No citizen route or room changes.

## 3Dviz quality contract
Use the existing Three.js scene, stable feature ID, source-accurate planar silhouette, deterministic orientation, ground contact, shared geometry/materials, modest draw calls and LOD. Only add doors, windows, roofs or shops after evidence; maintain temporary-proxy labels otherwise. Consult matching catalog/recipes/kits before implementing an object.

## Acceptance / status
- TODO before edits: YES (this file is the first write).
- Geometry changed: NO. Citizen route changed: NO. Writer room touched: NO.
- Runtime probes / screenshots / live deployment: NOT RUN; no approval claimed.
- Next gate: source-only probe, legacy smoke test, room preservation, collisions, access, elevation and performance before any visual release. Existing legacy path blocker X=0,Z=8.7 must not be bypassed.

## Two new backlog ideas
1. Add an OSM/Overture evidence-diff report for each roofprint, preserving provenance and null values, with no automatic mesh changes.
2. Add a source-only top-down screenshot fixture overlaying per-feature IDs and uncertain-height labels, with baseline day/night comparisons.
