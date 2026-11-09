# MAYOR-057 — Scalable Tehran geographic tile index (one safe increment)
Date: 2026-11-10
Status: TODO REGISTERED; implementation and validation pending.

## Updated owner scope
Owner explicitly requests a future full-city, building-by-building Tehran digital twin using Tehran-gdbs, OSM 3D Model, OSM2World and licensed OSM/Overture inputs. This authorizes **future geographic coverage**, not unsourced geometry, speculative floors/facades or unreviewed batch deployment. Retain one verified slice per mayor iteration. The immutable backup branches are verified at private cfdac995b6e070d472627b484c93d8fbf5f6ed2b and public ececf9ffc041b1666b0425f4f1746d162b9dcf67, with backup manifest present; NEVER rewrite backups.

## One controlled task
Create a deterministic, read-only, projection-aware tile **metadata** indexer for the existing legally sourced OSM survey snapshot, future compatible with citywide per-zone feature inventories. Preserve feature IDs, source attribution, timestamps and coordinate order. Reject invalid coordinates, repeated IDs, missing provenance and overlarge unsplit geometry. Do not alter runtime town, writer room, citizen routes, publisher or collision model; do not claim imported GLB or real building heights. 
Acceptance: automated Node tests of deterministic tile identities, duplicate prevention, missing attribution, invalid geographic coordinates and refusal of oversized uncut features. Run against current OSM snapshot if feasible. Add documented usage, source-license warnings, and lessons from 3Dviz Pro Max recipe citygml-stable-id-scenario-diff (stable IDs, CRS, epoch, external model map).

## Source review
- https://github.com/YusufEminoglu/osm_3d_model — MIT code, outputs static OSM GLB; DOES NOT export moving traffic or detailed real facades by default.
- https://github.com/tordanik/OSM2World — glTF/OBJ converter; confirm per-asset code/data licensing separately.
- https://github.com/mttaherpoor/Tehran-gdbs — actual Tehran geodatabase collection; repository GitHub license is unspecified; do not redistribute GIS layers until source-by-source license reviewed.
- https://docs.overturemaps.org/guides/buildings/ — building footprints ODbL, roofprint != as-built footprint or real height.
- https://github.com/vvoovv/blosm — optional Blender authoring, not a right to scrape Google 3D tiles.

## Two new, independent backlog ideas
1. Implement streamed Three.js per-tile GLB/feature-layer loader with LOD budgets, cross-tile feature ID deduplication and released material/geometry disposal on unload.
2. Build OSM/Overture/Tehran-gdbs coverage-difference dashboard that flags unresolved IDs, source dates, legal-usage status and contradictory floor/height fields before rendering any block as verified.

## Result and safety report
Pending. Record actual unit tests, snapshot audit, private/public commits and any CI/Pages results after execution; no screenshot/deployment claims without evidence.

## Verified execution — 2026-11-10
- Implemented `city/survey/tehran-geotile-index.mjs` with deterministic z/x/y WebMercator metadata indexes over preserved WGS84 licensed feature geometry. Neither geometry, collisions nor runtime Three.js modules changed.
- Created `city/tests/tehran-geotile-index.test.mjs` (5 tests covering stable tiles, duplicate IDs, provenance, invalid coordinates/CRS, oversize uncut features), and new dedicated GitHub Actions workflow.
- Actual public Actions run: https://github.com/iAlirezaaa/the-writer-live/actions/runs/42719740430 — **SUCCESS**; 5 unit tests PASS, zero fail, actual previously acquired snapshot indexes **54 sourced features (47 lines, 7 footprint polygons) into 28 z17 tile keys**. This is source coverage only, not 28 rendered tiles.
- Private counterpart workflow https://github.com/iAlirezaaa/the-writer/actions/runs/42719308742 concluded FAILURE, with job log retrieval returning BlobNotFound; no private test success claimed.
- Public Pages https://github.com/iAlirezaaa/the-writer-live/actions/runs/42719740286 FAILED on pre-existing legacy town paths safety regression at local X=0, Z=7.3. Source-only and writer apartment/road checks in log PASS, but deploy stages skipped; no new live deployment claimed.
- The backup branches were confirmed unchanged at the requested SHA values and backup manifest read. No screenshots, browser captures, GPU/FPS tests or new real facades performed.
- Public repo mirrors the new source, test, workflow, documentation, GOAL and city skill; public pinned runtime assets were not modified, because this is a nonvisual offline indexing tool.
- 3Dviz: SKILL, TWIN-WORLD and `recipe.citygml-stable-id-scenario-diff` inspected; stable ID / CRS / epoch guidance recorded. No existing kit, mesh or material was copied or modified.
- Two backlog proposals remain open above. NEXT: license-check/import one additional real feature area, then single sourced 3D tile with deduplicated IDs and real visual/legacy gates. The user authorized citywide goal, not invented detail or unrestricted one-shot city deploy.
