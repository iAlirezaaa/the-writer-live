# MAYOR-060 — MultiPolygon source identity at tile boundaries (2026-11-10)

Status: TODO REGISTERED BEFORE CHANGE. Scope: one metadata-only regression for a licensed-source-shaped MultiPolygon spanning adjacent tiles; verify one canonical source ID and no duplicate references within each tile. Do not change runtime geometry, citizens, writer room, routes, weather, or Pages assets.

Prerequisites: backup manifests in private/public checked; immutable backup SHA references cfdac995b6e070d472627b484c93d8fbf5f6ed2b and ececf9ffc041b1666b0425f4f1746d162b9dcf67 preserved. Read city/skills/tehran-writer-block/SKILL.md, MAYOR-026, 3dviz-pro-max/SKILL.md and TWIN-WORLD.md; object ID and shared resource ownership apply to future meshes. This is a synthetic fixture, NOT evidence of surveyed buildings.

Acceptance: test asserts exactly one feature manifest entry, geometryType MultiPolygon, stable bbox, and each tile holds ID at most once. Run Node test locally if executable; no visual or deployment claims without actual evidence.

Backlog:
1. Add source-feature ownership counters for tile unload with shared GPU geometry disposal checks.
2. Add a surveyed-feature confidence/provenance inspector that distinguishes unknown facade and height from verified attributes.

Execution results: PENDING.