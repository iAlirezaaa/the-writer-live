# MAYOR-061 — Bounded multi-tile index regression (2026-11-10)

Status: TODO BEFORE CHANGE. Scope: one synthetic metadata-only test verifying a wide MultiPolygon is rejected when maxTilesPerFeature is exceeded, and accepted with a sufficient budget. No meshes, real-world building claims, road geometry, citizen paths, writer/publisher logic or Pages changes.

## Prerequisites and safety
- Reviewed city/skills/tehran-writer-block/SKILL.md and MAYOR-026; 3Dviz Pro Max SKILL.md and TWIN-WORLD.md; city/survey/tehran-geotile-index.mjs and existing tests.
- Existing backup manifest read on private main. Attempts to fetch the manifest directly on both backup refs returned 404 via connector, so **backup branch existence is not independently confirmed in this run**. Do not change runtime geometry.
- Prior MAYOR-060 test blob parity verified between private and public (7c42ae33d6046e9bcb0509eef48369d98a0821a2).

## Acceptance
- Synthetic MultiPolygon spanning adjacent tiles fails under maxTilesPerFeature:1 and succeeds with default limit; feature identity remains single. Does not imply actual Tehran geometry.
- Node execution, source-only/legacy probes, CI, browser captures and Pages deployment must be reported as unverified unless run.

## Backlog
1. Add tile unload ownership tests for shared GPU geometry and material disposal, without affecting writer-room assets.
2. Add a licensed-survey provenance completeness report for height, levels, entrances and facade unknowns before geometry import.

## Results
Pending implementation and mirror. No deployment authorized.
