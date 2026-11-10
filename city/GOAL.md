# Active target: source-grounded Civita di Bagnoregio, Italy

Owner directive 2026-11-10: Rebuild the actual **Civita di Bagnoregio**, not a fictional town based on it and not Tehran. Preserve the writer character's physical appearance and the furnished 6×6m authored room. The old Tehran scene and its research/tests are removed from the active branches; frozen historical recovery branches and backup manifest remain untouched.

## Current state — verified code, not surveyed 1:1 completion
- Main site `web/world.js` now loads **Civita-only** `web/town.js` / `web/town-civita.js` rather than Tehran source-only or fictional procedural grids. Pages uses pinned `.github/citizens-assets/town.js`.
- Local geo baseline `web/civita-geo.mjs` uses EPSG:4326, positive X east / positive Z south, centre `42.6277,12.1137` (OSM node 1778014513), Porta Santa Maria `42.62741,12.11272` (OSM node 1079071522). These are **reference points**, not precise locations for other buildings.
- `web/civita-osm-vectors.mjs` and `web/civita-osm-render.js` read bounded, legally reusable OSM building ways and pedestrian ways, validate provenance, show building **2D footprints as translucent 3D extrusions**, mark missing heights as 6m visual PROXIES (never actual level count or roof geometry). Buildings depend on source fetch; no fabricated fallback city.
- `web/civita-pedestrians.js` contains lightweight anonymous illustrated walkers traversing documented OSM footway centerlines. These are not verified actual residents, and their paths/locations are visual proxies. Old fictional urban layouts were removed, and outdated citizen meshes are suppressed in outdoor Civita views. Private actual resident identities/story routines and publisher records remain protected, not overwritten.
- `web/civita-writer-house.js`: real modeled **two-storey Civita-inspired tufa exterior** around retained room, with peperino-looking door/window masonry, chestnut-like timber and terracotta-style pitched roof. Exterior is deliberately documented as an **interpretive Lo Studio-style study**: actual Lo Studio footprint, parcel, roof measurements and rights to raw scans UNKNOWN. House not yet relocated to a legally verified Lo Studio address.
- `web/civita-environment.js`: weather from current **Open-Meteo model data** for Civita, not on-site sensors; sky cycle, dawn/dusk and clock follow `Europe/Rome` including DST; if live data fails, label this as unavailable.
- `web/civita-place-catalog.js`: actual sourced village/gate points and visibly flagged writer-room provisional anchor. Old Tehran fictional catalogue retired.
- Camera bounds in `world.js` prevent target panning outside the published map, but actual non-visible map edges / cliff terrain need browser screenshot and geodata QA.

## Final goal
Build a high-fidelity documented digital twin of every lane/building and cliff/bridge within Civita, matching geometry/floors/facades/roof/door/window and geographic orientation where primary licensed survey evidence exists. Do NOT invent missing heights or extrapolate a purported 1:1 replica from flat raster map tiles.

Source and QA plan:
1. Acquire licensed OSM vector ways with stable IDs, timestamps, ODbL citation and processed feature identity. Avoid OSM tile bulk downloads. Store bounded reusable cache with source date when permitted, to avoid external Overpass rate limits.
2. Licensed Lazio regional DEM/LiDAR / terrain datum for Civita plateau, erosive cliffs and elevated pedestrian bridge. Record spacing, vertical CRS, absolute error, no fabricated scaffolding.
3. One verified building at a time, identifying 3Dviz Pro Max silhouette, structural joins, ground contact, roof, entrances, UV/LOD, material provenance and safe scene disposal.
4. Verify precise **Lo Studio** parcel geometry and its two storeys; remodel exterior from licensed measurements and preserve the writer's figure, original room, accessible camera portals, content and interactions.
5. Test source geometry, protected room, no intersections, mapped paths, performance, pan/zoom edges, night/day and live weather, then capture actual in-browser overhead/eye-level images before claiming visual validation.
6. Release private-first to public/pinned Pages, check GitHub Actions build+deploy and current URL before claiming success.

## Sources and rights
- OpenStreetMap ODbL: https://www.openstreetmap.org/copyright .
- Civita Institute: https://www.civitainstitute.org/496/lo-studio.html and architectural reference plans; reuse and scale must be licensed/validated before copying source geometry.
- CyArk interactive reference: https://tapestry.cyark.org/content/civita-splat ; browsing does not establish rights to distribute/clone its raw model.
- Licensed geographic/DEM discovery: https://geoportale.regione.lazio.it/ . Confirm per-layer license, polygon coverage and geometric accuracy before importing.
- Open-Meteo: https://open-meteo.com/en/docs . Model weather for user-facing lighting and sky; noncommercial free-service conditions apply, show attribution.

## Strict safety, reporting and archival contract
- Author's visual identity, private content, published texts and publisher memory NEVER reconstructed or removed; existing citizen cores protected, but public ambient visual population can be progressively reauthored on source paths.
- Frozen prior-city backups remain referenced by `city/backups/writer-block-pre-tehran-rebuild-2026-11-09.md`, never delete/overwrite them. Active branches no longer contain old Tehran source meshes/data/workflows.
- In each city task: TODO before code, small reversible change, private→public, add two backlog ideas to city skill, report actual test evidence, CI SHA, checked deployment state, limitations.
- Only real runnable code, mapped source snapshots and measured data count as progress; do not say a raster map underlay is a complete 3D city.
