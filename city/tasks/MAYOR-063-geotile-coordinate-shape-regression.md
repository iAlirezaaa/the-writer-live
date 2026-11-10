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

## Result (2026-11-10)
- Private TODO: 175ec51db95fe416128e00a707bdab38707ebdec; public TODO: a88b2615b2a39c112e9f2a4923d548971bdab045.
- Private final test commit: 7c3ad7850b3c072c375714835553c4dcdbbfccb5; public test commit: 96ff82849c0ec4a41a35eef9f0eb5939d3d6d36c; matching test Git blob 072364bfcfae87248be33848346478754da5b9bf.
- Private skill: f41455f1c5abda89195a50b483e713bcc98aded2; public skill: 241a2733d6c76aa2066f1e5c9ba507d00f9afbc1; matching skill Git blob 4f80d79e60c3f63e6966bb7495d976f5fef6a04f.
- Node execution, CI, browser capture and Pages deployment: NOT VERIFIED. Test fixtures were reviewed statically only. No runtime/pinned city assets changed.
- Known limitation: Point coordinates with only one numeric ordinate are not rejected by the current index implementation; separate hardening required before describing validation as complete.
- Legacy collision regression at local X=0,Z=7.3 remains untouched; no claim of passing it.
Status: COMMITTED DOCUMENTATION + TEST; EXECUTION UNVERIFIED.
