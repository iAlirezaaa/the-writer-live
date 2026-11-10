# MAYOR-063 — GeoJSON malformed coordinate shape regression
Date: 2026-11-10
Status: TODO — test-only, no runtime geometry change.

## Preflight
- Read city/skills/tehran-writer-block/SKILL.md, MAYOR-026, 3Dviz Pro Max SKILL.md and TWIN-WORLD.md.
- Verified frozen snapshot refs in both repositories by fetching web/urban-plan.js from each SHA and backup branch; all returned expected blob 64480b048da29fa8b140e99df09dc83e1d83a496. Do not mutate backups.
- Current index recursively handles GeoJSON coordinate nesting. Test missing/empty coordinate shapes before accepting future source extracts.

## One safe change
Add a focused regression in city/tests/tehran-geotile-index.test.mjs rejecting empty geometry and malformed coordinate arrays. Synthetic fixtures only. Do not alter runtime renderer, writer room, citizen routes, town geometry, or pinned assets.

## Verification
- Run Node test if a runnable checkout is available; otherwise report unexecuted.
- No visual capture needed for test-only change; do not claim deployment.
- Preserve known legacy collision probe without modifying it.

## Backlog
1. Validate GeoJSON polygon ring closure and minimum vertex count before index generation.
2. Audit GPU resource ownership for shared source IDs across neighboring tiles.

## Evidence
Pending commit SHAs and CI checks; update after writes.
