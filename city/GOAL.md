# Active goal — Civita di Bagnoregio digital twin

Updated: 2026-11-10. **The owner has replaced Tehran with Civita di Bagnoregio (Lazio, Italy) as the sole active city-reconstruction target.** Previous Tehran materials are historical/rollback evidence, not the target for new geometry. Preserve Git history, all old backup refs, the protected writer room and author/publisher/citizen data.

## Build objective
A documented, navigable Three.js digital twin of the **actual** Civita di Bagnoregio: real plateau, bridge, alleyways, historic buildings and facades, one building at a time. No generated or estimated building heights, storeys, entrances, roof shapes or cliff elevations may be presented as surveyed facts. Each item needs source ID, WGS84 geometry, collection date, reuse license, height/roof/level certainty and accuracy tier.

## First working phase (MAYOR-065)
The standalone `web/civita-map-preview.html` shows an **OSM 2D map as a Three.js geographic underlay**, two limited normal-view tiles, visible OSM attribution, source-identified village/gate anchors, and bounded orbit/pan/zoom. It is *not yet* a geometric 3D reconstruction and **does not replace** the existing protected writer dashboard until integration tests and visual QA pass. Do not imply the map tiles supply a DEM or floor plans. Camera safe-zone is a viewing constraint, not an official cliff boundary.

- Village reference: WGS84 `42.6277, 12.1137`, OpenStreetMap node `1778014513`; village center, **not a house coordinate**.
- Porta di Santa Maria: WGS84 `42.62741, 12.11272`, OpenStreetMap node `1079071522`.
- Local coordinate system: +X east, +Z south; world unit meters in the initial tangent-plane approximation.
- Locale: `Europe/Rome`. Legacy Tehran weather/time are not Civita weather/time. Do not silently relabel existing weather readings.

## Possible writer home
**Lo Studio**, Civita Institute property on Via della Maestà, is a candidate based on published architecture, **not yet validated as an exact parcel or permitted 3D reuse asset**. Keep the existing writer interior intact and functional; do not move the room into an invented footprint. Check detailed rights, access, footprint, floors and camera behavior before any migration.

## Provenance & rights
- CyArk 2022 survey and 2026 Project ETERNAL interactive 3D tour: https://www.cyark.org/projects/civita-di-bagnoregio and https://tapestry.cyark.org/content/civita-splat . A browsable model is not proof that raw 3D data can be reused.
- Civita Institute September 2014 preservation town plan: https://www.civitainstitute.org/files/1127.pdf . Not authorized to trace/digitize as source geometry before rights/georeferencing review.
- Regional terrain-data discovery: https://geoportale.regione.lazio.it/ . Confirm site coverage and per-layer license.
- OSM data and attribution: https://www.openstreetmap.org/copyright ; tile-service policy: https://operations.osmfoundation.org/policies/tiles/ . Do not bulk-fetch tiles, cache-bust, or remove copyright attribution.

## QA & next stages
1. Basemap/browser navigation, coordinate and camera-clamp tests, verified fallback and attribution. Capture actual before/after images when browser is available.
2. Licensed OSM ways and roofprint polygon IDs for gate → square; test geometry, adjacency and feature identity.
3. Verified DEM/LiDAR cliff, bridge support and constrained visual horizon with no unmodeled map edges.
4. One licensed, measured roof/facade at a time with 3Dviz Pro Max geometry, materials, LOD and day/night rendering.
5. Relocate or refit ONLY the exterior around the **protected room**, after room-access/navigation/collision tests; maintain private→public pinned synchronization and Pages/CI proof.

Every run: unique TODO before changes, read `city/skills/civita-digital-twin/SKILL.md` and the vendored 3Dviz Pro Max SKILL/TWIN-WORLD and relevant object kits; one small change; Node/scene/legacy collision checks; two new backlog ideas and skill update; private-first followed by safe public release with SHA links. Historical backups `backup/writer-block-pre-tehran-rebuild-2026-11-09` and manifests must remain intact. Old Tehran city code may be retained as a rollback **only**, not advertised as the current target.
