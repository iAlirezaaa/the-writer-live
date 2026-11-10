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
