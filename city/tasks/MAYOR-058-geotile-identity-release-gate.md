# MAYOR-058 — Cross-tile identity and provenance gate (2026-11-10)

Status: TODO REGISTERED BEFORE CHANGE. Scope: one documentation-only, city-scoped validation contract. No runtime, map geometry, building, route, or writer-room edits authorized in this iteration.

## Preconditions checked
- Both immutable backup branches `backup/writer-block-pre-tehran-rebuild-2026-11-09` found; private/public manifest exists in canonical private repository. Preserve SHA `cfdac995b6e070d472627b484c93d8fbf5f6ed2b` and `ececf9ffc041b1666b0425f4f1746d162b9dcf67`.
- Read `city/skills/tehran-writer-block/SKILL.md`, `MAYOR-026`, `cognition/skills/3dviz-pro-max/SKILL.md`, `TWIN-WORLD.md`, and `data/recipes/citygml-stable-id-scenario-diff.json`.
- Read `city/survey/tehran-geotile-index.mjs`, `TEHRAN_FULL_CITY_SOURCES.md` and `city/GOAL.md`. Existing index is metadata only; no tile loader or real-height data certified.

## Single bounded task
Specify a no-inferred-identity contract for eventual Tehran tile loader: a feature spanning two tiles is one feature, not two buildings; stable source ID must survive LOD, clipping and mesh replacement. Document acceptance checks in the persistent municipal skill. Do not implement the loader before source-only room/route/geometry and browser tests can be run.

## Acceptance criteria for later implementation
1. One source feature crossing tiles A/B has the same canonical source-qualified ID and one active render owner; a second tile reference must not instantiate another physical/colliding object.
2. Unload A while B remains: feature stays available; unload last referencing tile: dispose only loader-owned geometries/materials/textures and listeners, not shared assets or writer-room objects.
3. Reload same tiles in opposite order: identical feature IDs, counts and geometry hashes; unknown height remains `unknown/proxy` and cannot become verified.
4. Reject incompatible CRS, missing license/attribution/capture timestamp, conflicting source-version/geometry hashes, and stale tile epochs before render.
5. Capture actual overhead/street/day/night frames and compare draw calls, memory, ground contact, building/road collision and room accessibility before any visible release. Existing legacy collision test must remain enabled.

## Two new backlog ideas
- **Tile seam identity stress fixture:** generate deterministic overlapping bounding boxes and test reverse-order loading/unloading, duplicate source IDs and geometry-hash conflicts without needing network access.
- **Provenance/LOD inspector:** click a sourced building to show ID, dataset version, capture date, confidence, proxy/real status and active tile references without inferring its floor count.

## Evidence and limits
No live data acquisition, Node execution, browser capture, CI success or Pages deployment is asserted. This is a research/QA specification, not a reconstructed Tehran building.
