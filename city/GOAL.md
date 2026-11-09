# Goal — Tehran real-city digital twin, building by building
Updated: 2026-11-09. Project priority: **reconstruct Tehran's real geography rather than an imagined city**.

## Intended finished product
A measurable, documented, photogrammetry/survey-supported reconstruction of the real Tehran
cityscape. Rebuild **building by building** in the exact geographic places and orientation shown
by appropriately licensed top-down mapping and legal aerial/parcel sources, with realistic roads,
parcel setbacks, ground topology, planting, urban equipment, night/day and weather synchronized
to Tehran. This is a **long-term accuracy target**; current data do not certify a 1:1 replica.

## Currently authorized geographic scope
**One single real Tehran writer block only**, bounded by actual mapped OSM centerline candidates
(Khalil Mikaeili, Falahat Pour, Fifth and Eighth Daryan-e Now), with the writer's house WGS84
reference at `35.715361987616696, 51.3642455031707` (EPSG:4326). +X is east, -Z north.
Do not spread physical reconstruction into adjacent blocks without explicit user permission.
Protect writer room, writer narrative data, publishing logic, citizen identities and their routes;
the room may be relocated after validated access checks but must never be removed.

## Accuracy and evidence ladder (per roofprint, per building)
1. **T0 — located:** valid WGS84 polygon, correct local transform, orientation, licensed and
   dated OSM/Overture feature ID, area and uncertainty. No roof/floor claims.
2. **T1 — aerial shape matched:** source roofprint copied without artistic deformation;
   compare footprint geometry, mesh area and actual reference from above. Single original
   ML-derived polygon may join several buildings: do not split it without higher-grade sources.
3. **T2 — vertically measured:** verified ground datum, roof elevation, footprint/curb setback,
   entrances, number of floors, land slope; then construct real 3D masses.
4. **T3 — facade and usable architecture:** lawful photo/survey evidence of materials,
   windows/doors, roof, balconies, wall/sidewalk joins, night lights; validated 3Dviz LOD.
5. **T4 — certified interactive twin:** room and citizen access, road/pavement physical
   collision and routes migrated *one segment at a time*, audited against photographs,
   drone/municipal open imagery, recorded screenshot-diff, safety and FPS thresholds.

Only T0/T1 planar information is now partially supported. ALL known source building
heights/floors are null. The current 6m meshes are **display-only, explicitly symbolic**,
not sourced heights. SRTM30 (~30m raster) cannot resolve door or curb grades.
Overture 4 ML roofprint candidates are not necessarily 4 real standalone buildings.

## Construction iteration contract
For EACH run: check immutable backup refs; read city/skills/tehran-writer-block/SKILL.md,
MAYOR-026 and 3Dviz Pro Max SKILL/TWIN-WORLD/relevant kit; register a standalone TODO;
choose ONE documented roofprint or road element; implement **private first**; validate
WGS84 and local X/Z vertices, 3D contact and silhouette, writer room preservation and
city navigation/traffic regression; make actual before/after aerial/street/day/night
captures if browser capture available, and report if unavailable; mirror only safe
city assets into public pins; verify live Pages run status and SHA. Record two new
non-repeated backlog ideas and update 3Dviz lessons in the city skills.

## Source and licensing
Sources currently authorized are OSM road centerline data (ODbL-1.0) dated 2026-11-09,
Overture Buildings / Microsoft ML Buildings roofprints dated 2026-11-09 (ODbL-1.0;
underlying release unverified), and NASA/USGS SRTMGL1 v3 DEM sampled via OpenTopoData
(EGM96). Preserve source IDs, timestamp, license, uncertainty and provenance per
object. **Do not scrape or trace Google Maps, Google aerial tiles or Street View**
outside their licenses. In absence of a building's height/facade evidence,
visually label the reconstruction proxy and keep physics unchanged.

Authoritative progress ledger: `city/buildings/manifest.json`.
Current model source: `city/survey/output/writer-block-overture-buildings.json`.
Frozen scene backups: `backup/writer-block-pre-tehran-rebuild-2026-11-09` in both repositories.
