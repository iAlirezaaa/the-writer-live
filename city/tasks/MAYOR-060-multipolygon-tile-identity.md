# MAYOR-060 — MultiPolygon source identity at tile boundaries (2026-11-10)

Status: TODO REGISTERED BEFORE CHANGE. Scope: one metadata-only regression for a licensed-source-shaped MultiPolygon spanning adjacent tiles; verify one canonical source ID and no duplicate references within each tile. Do not change runtime geometry, citizens, writer room, routes, weather, or Pages assets.

Prerequisites: backup manifests in private/public checked; immutable backup SHA references cfdac995b6e070d472627b484c93d8fbf5f6ed2b and ececf9ffc041b1666b0425f4f1746d162b9dcf67 preserved. Read city/skills/tehran-writer-block/SKILL.md, MAYOR-026, 3dviz-pro-max/SKILL.md and TWIN-WORLD.md; object ID and shared resource ownership apply to future meshes. This is a synthetic fixture, NOT evidence of surveyed buildings.

Acceptance: test asserts exactly one feature manifest entry, geometryType MultiPolygon, stable bbox, and each tile holds ID at most once. Run Node test locally if executable; no visual or deployment claims without actual evidence.

Backlog:
1. Add source-feature ownership counters for tile unload with shared GPU geometry disposal checks.
2. Add a surveyed-feature confidence/provenance inspector that distinguishes unknown facade and height from verified attributes.

Execution results: TEST ADDED; EXECUTION NOT VERIFIED.
## Execution report
- One synthetic MultiPolygon cross-tile identity regression appended to city/tests/tehran-geotile-index.test.mjs. No runtime mesh/index implementation changed.
- Private test commit: fec76188e11b5d5b6088da1770602c03ee917dac; public mirror: 6bbf372a63a919fc52c03be708427830c446ff61. Test blob parity verified (7c42ae33d6046e9bcb0509eef48369d98a0821a2).
- 3Dviz/TWIN-WORLD identity guidance documented in city/skills/tehran-writer-block/SKILL.md. Private commit a55da40a82d555cc081940b8b04f58f60a48b306; public 2274839c705fdcaa5bf16e263ade2b8a1327ff80. Skill blob parity verified.
- Node execution, source-only and legacy collision regressions, browser screenshots, CI and Pages deployment: NOT VERIFIED. This is a non-runtime test/documentation change only; no performance or collision claims.
- No new geographic survey, buildings, street geometry, Tehran live weather or clock changes. No protected writer/citizen/publisher files or backup refs modified.
- Follow-up gate: execute node --test city/tests/tehran-geotile-index.test.mjs in a checkout and review CI before any tile runtime change.
