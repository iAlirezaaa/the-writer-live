# Civita di Bagnoregio — digital-twin city subsystem

Active target since 2026-11-10: **Civita di Bagnoregio, Lazio, Italy**, not Tehran. The writer's personality, actual figure, text, authored room, publisher logic, resident core identities and memory live outside this repository area and must not be destroyed.

## Active web scene
- `web/world.js`: the only real writer and observer scene, writer model/room preserved; exterior group rebuilt with `web/civita-writer-house.js`.
- `web/town.js`: **Civita-only** entry; `web/town-civita.js` renders source-identified OSM map tiles and provisional footprint volumes.
- `web/civita-geo.mjs`, `web/civita-osm-vectors.mjs`, `web/civita-osm-render.js`: local EPSG:4326 tangent projection (+X east, +Z south), OSM attribution, polygon/footway intake.
- `web/civita-pedestrians.js`: anonymous animated visual passersby tied to OSM footway centerlines. Not real population records. Historic citizen identity and routes remain in private core, but their obsolete Tehran-layout meshes are hidden in outdoor Civita views.
- `web/civita-room-plan.js`: protected author's 6×6m authored room contract. `web/civita-writer-house.js` is a **two-level interpretive tufa/peperino/terracotta shell**, inspired by Civita Institute's published Lo Studio architectural description. Location and survey dimensions of actual Lo Studio **remain unverified**.
- `web/civita-environment.js`: current model weather from Open-Meteo at `42.6277, 12.1137`; live time, dawn/dusk and clock use `Europe/Rome` (CET/CEST). Weather failure is shown explicitly.
- `web/civita-place-catalog.js`: two OSM sourced anchors (village centre + Porta Santa Maria gate), plus one explicitly unverified protected writer-room visual anchor.

## Target and evidence tiers
The long-term requirement is a near-1:1 digital twin of the real Civita, based on legally reusable plans, photogrammetry/LiDAR, building polygons, terrain and surveyed details. Current map is **NOT** 1:1 architecture, a verified height model, real resident count, verified traffic/citizen navigation or scanned cliff/bridge.

For each building, retain OSM/geo source ID, WGS84 shape, capture timestamp, license, source of each height/floor/entrance/roof fact, uncertainty and proxy-vs-surveyed flags. Do not claim an online CyArk tour grants permission to copy mesh files. Respect OSM ODbL credit and tile/server usage policies.

## GitHub Pages / CI
- Private repo `iAlirezaaa/the-writer` is canonical.
- Public `iAlirezaaa/the-writer-live` pins reviewed `web/town.js` in `.github/citizens-assets/town.js` and deploys active Civita files only.
- Civita QA: `tests/civita_main_town_probe.mjs`, `tests/civita_writer_home_probe.mjs`, `tests/civita_pedestrians_probe.mjs`, `tests/civita_environment_probe.test.mjs`, `city/tests/civita_geo_phase0.test.mjs`, `city/tests/civita_osm_vectors.test.mjs`, `city/tests/civita_osm_renderer.test.mjs` and `tests/writer_house_consistency_probe.mjs`. Also keep reader/observer and author/core safety regressions.
- Tests in GitHub Actions verify source/geometry contracts; only real browser screenshots/console prove visual quality. Check Actions status, do not assume a pushed commit has deployed.

## Historical backups
The entire old city history (including all deleted Tehran city sources, snapshots, research and tests) remains retrievable from **frozen, intentionally untouched** backup branches `backup/writer-block-pre-tehran-rebuild-2026-11-09` and the immutable SHA references in `city/backups/writer-block-pre-tehran-rebuild-2026-11-09.md`. Never force-push or remove those refs. The active branch no longer carries old Tehran map meshes, weather, OSM surveys, historical geotile pipeline or third-floor apartment scripts.

## Roadmap
1. Acquire licensed surveyed DEM/LiDAR for cliff, plateau and bridge, with vertical datum.
2. Record a dated ODbL Civita roofprint/footpath snapshot that can load without live Overpass, or clearly expose live service failure.
3. Geolocate Lo Studio lot and doorway (only with verified rights), adapt preserved room without changing writer figure.
4. Model real individual facade/roof and entrance, then test day/night, collisions, ground contact, camera bounds, UV/LOD and city population rendering.
5. Maintain one small, independently testable migration per city task, with private-first sync and cited SHA/test/deploy evidence.

For current acceptance and technical craft use `city/GOAL.md`, `city/skills/civita-digital-twin/SKILL.md` and vendored 3Dviz Pro Max SKILL/TWIN-WORLD.
