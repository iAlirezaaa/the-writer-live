# MAYOR-065 — Civita di Bagnoregio map, phase 0
Date: 2026-11-10
Status: ISOLATED PREVIEW COMMITTED — tests passed locally; browser and deployment not verified.

## Goal
Owner replaced Tehran with **Civita di Bagnoregio, Lazio, Italy** as the active digital-twin target. First build a small real-source geographic map with a clamped camera. Never delete the protected writer room, story/publisher data, citizen paths or frozen Tehran backups.

## One bounded implementation
Independent public-safe Three.js preview: two actively visible OSM map tiles, OSM attribution, WGS84 village/gate anchors and clamped OrbitControls. This is a 2D base map in a 3D renderer, **not** the surveyed 3D city, true terrain, roofprints or a verified house interior. Existing writer site stays unchanged while the candidate undergoes validation. Switch active goal document and start a Civita-specific skill.

## Acceptance / reporting
Verify both historical backup refs and manifest, read 3Dviz Pro Max SKILL/TWIN-WORLD, check Node syntax and source-coordinate/camera-bound tests, privately commit before mirroring to public, report both SHA links. No claim of actual rendered screenshot, live OSM tiles, GitHub Pages deployment or geometry validation without evidence.

## Two NEW backlog ideas
1. Obtain licensed building/street OSM ways (persistent IDs, polygon orientation and bridge connectivity) and compare their coverage against legally reusable architectural records.
2. Verify Civita cliff/plateau DEM or LiDAR coverage, access rights and source uncertainty; plan terrain/bridge LOD and camera edge occlusion.

## Evidence
TODO only; results will be appended after implementation. No active Tehran/author data is removed here.

## Execution report — 2026-11-10
Status: ISOLATED PREVIEW COMMITTED; LOCAL GEO TESTS PASS; BROWSER/PAGES NOT VERIFIED.

- Preflight: both backup branches, manifest and historical urban-plan were accessible. Backups untouched.
- 3Dviz SKILL.md, TWIN-WORLD.md and object-reasoning reference reviewed; no physical object/kit built in this preview.
- New independent Three.js OSM map underlay: web/civita-map-preview.html and .js; WGS84 origin/gate and camera bounds: web/civita-geo.mjs; new Node tests in city/tests/civita_geo_phase0.test.mjs.
- Active geographic goal changed from Tehran to Civita. New Civita skill created; old Tehran skill explicitly retired for future build instructions. Historical data and writer room preserved.
- Local runtime: Node v22.16.0. node --check web/civita-map-preview.js: exit 0. node --test city/tests/civita_geo_phase0.test.mjs: 4 passed, 0 failed, exit 0.
- Private/public blob SHA parity established for goal, task, both skills, geo, viewer, preview HTML and tests.
- Public Pages workflow copies web/ into _site/web/, but actual Pages job/deployment was NOT verified. GitHub combined status query for both city heads returned no statuses.
- Unverified: browser load, real OSM tiles, camera visual boundary screenshots, road/house/citizen collision, terrain and building mesh rendering. The preview is an OSM 2D raster in a 3D viewer, not a finished digital twin. Main writer scene remains unchanged.

Private commits: TODO 0c124e86, goal 51c9ffac, geo 425c4556, test 2f43a9fc, viewer f4eae39d, HTML 95b06153, new skill 82e6d7be, retired old skill e5786778.
Public commits: TODO e7bafeaa, goal bf503bbe, geo 9667ad47, test 5c537ec7, viewer 2d90dbe6, HTML a376bc28, new skill 8ae5eb7d, retired old skill 8aff7b9e.

Two backlog tasks: licensed vector OSM road/building ways + annotated gate-to-piazza connectivity; lawful high-resolution DEM/LiDAR coverage and cliff/bridge LOD/camera tests.
Next: browser QA and actual terrain/building provenance before connecting Civita to the main protected writer world.
