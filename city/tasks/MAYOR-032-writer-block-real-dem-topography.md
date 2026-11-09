# MAYOR-032 — Real DEM topology for the writer's block (2026-11-09)

Status: **IMPLEMENTED, TESTED WITH REAL THREE.JS AND DEPLOYED ON PUBLIC PAGES; visual browser capture pending**.

## Scope
Only the mapped road-centerline candidate face containing the writer's home at WGS84
`35.715361987616696, 51.3642455031707`. Preserve scene X-east, Z-south.
Existing physical buildings/roads, paths, terrain collisions and world clocks are unchanged
until a separate registered clearance/survey/reconstruction task proves a replacement safe.

## Gates checked before any map or terrain edit
- [x] Private frozen backup ref `cfdac995b6e070d472627b484c93d8fbf5f6ed2b`.
- [x] Public frozen backup ref `ececf9ffc041b1666b0425f4f1746d162b9dcf67`.
- [x] Both repos share backup manifest blob `4821f550f9228adb7ba68e188ca8ee8a10b2dd04`.
- [x] Read `city/skills/tehran-writer-block/SKILL.md`, MAYOR-026, 3Dviz Pro Max `SKILL.md` and `TWIN-WORLD.md`, `recipe.map-projection-frames` and `recipe.terrain-contour-slices`.
- [x] Licensed OSM ring exists; no building heights or curb widths have been surveyed.

## Single targeted improvement
Introduce **sourced coarse ground topography** from NASA/USGS SRTMGL1 V3 (~30 m grid)
through OpenTopoData's `srtm30m` read-only point API. Capture a dated fixed sampling grid over
the ring bounding rectangle, keep height uncertainty and attribution, and render **visible
clipped contour lines** on the existing procedural scene without altering collision surfaces.
Construct a true triangulated height mesh for inspection, kept out of collision/navigation
and hidden by default until roads/buildings are aligned to surveyed grades.
The sampled rectangle is for interpolation only: clip every rendered triangle/contour to the
already-established candidate block; never extend visible reconstruction to adjoining blocks.
Never invent elevations if the provider fails.

## Acceptance
- [x] Remote elevation acquisition returned all numeric samples, expected dataset,
  source, capture time, geo coverage, and no private address.
- [x] Real Three.js geometry checks: clipped area, home containment, finite heights,
  noncolliding contour and mesh, height datum and visible footprint limits.
- [x] Existing urban/road/house/district/access/traffic and town scene checks pass.
- [x] Private implementation first; only vetted city files and public pinned assets synced.
- [x] Public Pages build result recorded with exact run and commit; screenshots honestly reported.

## Two future backlog ideas
1. **Block-grade clearance ledger:** sampled elevation along each entrance and crosswalk,
   highlighting measured/unknown grades and requiring survey before moving any collider.
2. **Contour-versus-road inspector:** overlay elevation isolines and OSM centerlines with
   a comparison mode, toggling a 1x DEM ghost surface only when an inspection camera is active.

## Evidence and limitations
Sources: OSM 2026-11-09 extract (ODbL); USGS/NASA SRTM V3 via
https://api.opentopodata.org/v1/srtm30m (dataset ~30m; raster/first-return height is
not a measured curb, roof, road grade, or building base).
Expected metadata includes source timestamp, unit meters, sample interpolation,
vertical reference as declared by SRTM metadata, and model uncertainty. Live network tests
are distinct from static code inspection.

## Verified implementation and source evidence
- Bounded acquisition: `city/survey/acquire-writer-block-terrain.mjs`, Node fixture tests `city/tests/writer-block-terrain.test.mjs`.
- Real OpenTopoData SRTM30 API snapshot: `city/survey/output/writer-block-dem-srtm30m.json`, capture `2026-11-09T11:22:36.987Z`, 64 samples incl. home anchor, heights 1234–1243 m EGM96. SRTM is 1 arc-second nominal raster (~30m) and cannot resolve individual curbs/house foundations.
- Sourced static browser module `web/writer-block-terrain-data.js`; builder `web/writer-block-terrain.js` constructs 203 clipped ground triangles (stored as **hidden 1:1 inspection mesh**) and 21 visible 2m interval contour segments, clipped to the OSM 12,264.69 m² road-bounded candidate. The actual city ground/colliders stay unchanged.
- Absolute DEM sample at home anchor: 1242m EGM96; bilinear map interpolation at exact local (0,0): 1241.92m; do not conflate these with an engineering benchmark.
- Private town source `web/town.js` imports the terrain builder; public pinned `.github/citizens-assets/town.js` and `.github/city-assets/writer-block-terrain*.js` mirrored.
- Actual public GitHub Actions [Pages run 42609544002](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42609544002) at SHA `59de0740067d3497624f910fddf4c76b35083bcb`: **success**, `TEHRAN-WRITER-TERRAIN-OK`, `URBAN-PLAN-OK`, `ROAD-TOPOLOGY-OK`, `WRITER-HOME-CONSISTENCY-OK`, `CITY-DISTRICTS-OK`, `HOUSING-ACCESS-OK`, `TOWN-SCENE-OK` layout/paths/wiring and `CITY-TRAFFIC-OK`.
- Browser day/night/overhead screenshots and GPU performance: **not captured, not verified**. No actual ground collision/roads/buildings were physically rebuilt.
