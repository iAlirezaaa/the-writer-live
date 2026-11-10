---
name: civita-digital-twin
summary: Incrementally reconstruct sourced Civita di Bagnoregio geometry; preserve original writer room.
---
# Civita di Bagnoregio — city construction contract (active since 2026-11-10)
1. Read `city/GOAL.md`, backup manifest, 3Dviz Pro Max `SKILL.md` and `TWIN-WORLD.md` in the private repository; then the relevant kit/recipe for an actual mesh. Previous Tehran instructions remain **historical**; do not bring Tehran geometry into the new target.
2. Register an independent `city/tasks/` TODO **before every change**. One safe, measurable object per iteration. Keep publisher, writer stories and memory, citizens' identities/routes, and frozen backups untouched.
3. Georeference: EPSG:4326 village OSM place node `1778014513` at 42.6277,12.1137; Porta di Santa Maria OSM node `1079071522` at 42.62741,12.11272. `web/civita-geo.mjs` uses a local tangent approximation, +X east and +Z south; this is not survey accuracy.
4. A photo, OSM raster tile, PDF, or CyArk tour is **not** a licensed 3D mesh. Every physical feature requires stable source ID, shape, time, license, height/floor/roof/entry provenance and separate known/unknown quality flags; don't invent missing geometry.
5. First small map preview: `web/civita-map-preview.html` embeds two on-view z16 OSM raster tiles as a Three.js underlay, with attribution and camera target clamp. This is not terrain or modeled houses. Respect OSM tile policy: no bulk prefetch, bypassed cache or offline downloads. Failed tile loads must show a fallback status, not invented road imagery.
6. The safe camera bounds are **viewer safety margins**, NOT the geographic town boundary. To claim visually seamless travel, test real browser overhead/street views, every pan corner, min/max zoom, resize and mobile. Do not assert these are verified from Node tests alone.
7. Progress: licensed footprints and street IDs -> source DEM/LiDAR cliff and bridge -> one building's silhouette, joins, ground contact, roof, entrance, then materials and shared geometry/LOD with 3Dviz Pro Max. Select house `Lo Studio` only when its exact location and 3D asset/plan use rights are established. Keep existing writer room intact.
8. Commit privately first, run actual Node/regression/legacy collision probes, capture real before/after if possible, mirror only reviewed city files to public pinned deployment assets, and verify GitHub Pages/CI independently. Report unverified work accurately.

## Two new backlog items — MAYOR-065
- Acquire source-licensed OSM vector street/roofprints with stable way IDs and gate→piazza connections; compare the map and Civita Institute plan without tracing rights-restricted drawings.
- Confirm licensed high-resolution DEM/LiDAR for the Civita plateau, cliff and pedestrian bridge before constructing their 3D meshes; audit LOD and safe camera view boundaries.

## MAYOR-066 — licensed vector-feature intake gate (2026-11-10)
Before constructing any OSM building or alley geometry, retain a feature record with `source_type` (`node`/`way`/`relation`), `source_id`, `source_url`, `license`, `attribution`, `observed_at`, `coordinates_crs` (`EPSG:4326`), `geometry`, `geometry_kind`, and `quality_tier`. Record `height_m`, `levels`, `roof_shape`, `entrance`, `ground_elevation_m` as **null** unless separately supported by a cited licensed source; attach per-field provenance and measurement uncertainty when known. Do not equate OSM ODbL data rights with third-party imagery or DEM rights. Validate polygon closure, non-self-intersection, coordinate bounds and stable IDs before any extrusion. Current raster tiles are **not** vector building data.

### Two fresh backlog ideas — MAYOR-066
- Build a read-only OSM vector provenance manifest for the Porta di Santa Maria → piazza pedestrian corridor, with duplicate-ID detection and per-feature license/attribution checks, without assuming building heights.
- Add a fixture-based gate-to-piazza topological connectivity test that reports gaps and uncertainty before rendering any navigable path; keep historical Tehran and writer/citizen routing untouched.

Technical learning: A renderable raster tile provides neither licensed vector footprints nor a validated walkable graph. Source-level rights, topology, field-level uncertainty and terrain datum must be separate gates before 3D extrusion.

## MAYOR-067 — source-identified 3D building footprints (2026-11-10)
- For the initial small-area bounded OSM source query, `web/civita-osm-vectors.mjs` validates and deduplicates `way/<id>` records, checks closed non-self-crossing building rings, bounded WGS84 input, per-tag metadata and raw ODbL attribution. Request only the needed village bounding rectangle, once per independent preview load. Fetch failures must be visible and must **not** trigger fabrication of substitute buildings.
- `web/civita-osm-render.js` extrudes source XY footprint polygons in world coordinates (X east, Z south). An unspecified height displays as a translucent **6 m proxy**; never claim this is the building's real height, roof, level count or entrance. Where OSM `height` exists, record it as an OSM-source tag, not survey certification. Pedestrian ways are source centerlines, not verified walkable pavements or physical road bodies.
- Do not assign the writer's actual room or `Lo Studio` to an unmatched OSM footprint. A preservation-first exterior refit must wait for parcel identification, access/door/ground contact tests and an interior shell compatibility check. For Lo Studio, documented only: **two storeys**, golden tufa, gray peperino lintels, chestnut roof structure, clay roof tiles, terrace with vine arbor. Reference https://www.civitainstitute.org/496/lo-studio.html. Exact plan/survey dimensions are not verified and must remain null.
- Engine decision: reuse existing Three.js, not switch to another renderer merely to compensate for absent data. For future continuous cliffs/architecture, compare actual performance and LOD first; 3Dviz Pro Max silhouettes/ground contact/joins/facade studies apply when modeling real verified geometry.
- Source payload limits and ring validation are local-unit tested; these do NOT replace live browser request, visual screenshots or QA of terrain/collision. Keep large 3D geometry outside the protected town scene until those pass.

### Two fresh backlog ideas (MAYOR-067)
1. Match each OSM roofprint centroid and gate-footway segment to Lazio Geoportale licensed DEM coverage; record vertical datum, 2 m LiDAR availability and uncertainty, then test mesh ground contact without inventing foundations.
2. Make a separate Lo Studio exterior reference study and use georeferenced photographs/architectural permissions to identify the exact source polygon and front door orientation; only then plan writer-room relocation with an interior regression fixture.


## MAYOR-068 — Active main-world Civita release gate (2026-11-10)
- Previous failures were not a missing renderer: `buildTown()` still defaulted to Tehran's source-only builder, and Pages overlays pinned `.github/citizens-assets/town.js` into `_site/web/town.js`. The public build scripts for vehicles, citizens, observatory and city also hard-coded the older `world.js`/town cache keys. Fix the **actual deployed import chain**, not only the standalone Civita preview.
- The active default is now `mapMode="civita"` via `web/town-civita.js`. It renders two licensed OSM underlay tiles and the source-backed OSM 3D footprint layer; remote Overpass building loads are asynchronous and remain provisional. Heights/roof/floors/terrain/Lo Studio placement cannot be called surveyed. A temporary writer-home mask suppresses an overlapping OSM volume only inside the old independently-owned room footprint; the feature still exists in source metadata.
- Retain `mapMode:"source-only"` solely to run all historic Tehran geometry smoke probes, and `legacy` solely to run old collision/navigation tests. Historical tests must select these modes explicitly; don't disable, delete or soften their physical guards. New `tests/civita_main_town_probe.mjs` asserts the real default, OSM underlay, absence of Tehran source geometry, author room continuity and public pinned town parity.
- The main `web/world.js` outdoor views now frame Civita and use `clampCivitaTarget` after OrbitControls update; original writer room/third-floor scaffolding logic and citizen routes remain untouched. Don't move the writer into the Lo Studio exterior until the licensed parcel/door/terrain is identified and access tested.
- A build-only check is not deployment proof. Real GitHub Actions Pages run `42782461956`, commit `043a29993eee4739473cc259537c18f4badb6a73` passed prepare, historic facade/route/room and Civita default probes, then successfully deployed. Real browser WebGL/CORS/Overpass screenshots have NOT been inspected. Continue to verify it in a browser.
- Architectural rendering: continue with the vendored 3Dviz Pro Max / Twin World craft process. Keep Three.js for now (no measured renderer limitation); later use licensed glTF/photogrammetry/LOD where justified.

### Two new backlog items — MAYOR-068
1. Fetch and commit a dated, ODbL-attributed **deterministic Civita OSM building/footway snapshot** as the primary source for the active world, with controlled online update checks, so network outages don't return an empty footprint layer.
2. Georeference the actual Lo Studio parcel and entrance from licensed plans/OSM, build a reversible tufa/peperino/chestnut/clay-tile external shell, then prove door/room/terrain clearance with real camera captures before replacing the temporary modern shell.
