# Full-Tehran reconstruction inputs — safe staged import (MAYOR-057)
Updated: 2026-11-10. **Architecture only; no claim of a built or verified full Tehran.**

## Source/tool matrix
| Project | Link | Use | License and evidence gate |
| --- | --- | --- | --- |
| OSM 3D Model | https://github.com/YusufEminoglu/osm_3d_model | MIT-licensed Three.js city generation/GLB export reference; exporter omits dynamic traffic | OSM feature data is ODbL and retains attribution; exported GLB is NOT a measured facade or floor survey |
| OSM2World | https://github.com/tordanik/OSM2World | Offline city meshes to glTF/OBJ; compare against existing Three.js builders | Review application/assets versions and licenses; source map remains ODbL; do not blindly graft its runtime |
| Overture Buildings | https://docs.overturemaps.org/guides/buildings/ | Stable roofprint candidates, IDs and polygon geometry | ODbL; ML-derived polygons can aggregate individual buildings; heights, levels and use may be missing |
| OpenStreetMap/Geofabrik | https://download.geofabrik.de/ | Street connectivity and map-tag evidence; ODbL | Prefer bounded, versioned extracts; OSM centerlines alone are not survey-grade curbs, rights of way or parking rules |
| Tehran-gdbs | https://github.com/mttaherpoor/Tehran-gdbs | Potential municipal layers and place names | **No GitHub repo license declared** at review time; component source rights unclear. Evaluate per layer before ingesting/re-distributing |
| Blosm | https://github.com/vvoovv/blosm | Optional offline Blender object assembly; no compulsory dependency | Separate base and Pro availability; code/assets must be inspected; Google 3D content cannot be scraped or reused outside licensed terms |

## First implemented increment
`city/survey/tehran-geotile-index.mjs` is a strict **metadata index**, never a map generator or photorealism claim. It indexes stable OSM feature IDs under WebMercator tile keys (z/x/y), based on each feature's WGS84 bounding box. It includes source, license, attribution, timestamp and a source coverage envelope. Long ways can cover multiple tiles, so **clients must deduplicate IDs**. Missing geographic/provenance evidence and tile-overlarge uncut features are rejected rather than silently treated as valid buildings.

Run against the existing legitimately acquired and repo-stored Tehran writer-area source, without requesting new private tiles:
```bash
node --test city/tests/tehran-geotile-index.test.mjs
node city/survey/tehran-geotile-index.mjs \
  --input city/survey/output/writer-block-survey.json \
  --out /tmp/tehran-writer-block-tiles-z17.json --zoom 17
```
The generated JSON is just a reference registry; current browser code does not consume it yet. No changes to `web/town.js`, `web/world.js`, road/citizen geometry, floor claims, street lighting or Tehran weather clock were made in MAYOR-057. Existing source-only default and separate writer room remain untouched.

## Future stages (separate TODOs and release gates)
1. **Metadata coverage first:** collect version-pinned licensed features for an adjacent Tehran tile; verify exact source feature IDs, timestamp, CRS, source-specific license and any real building attributes. Do not add newly invented roofs or facade windows.
2. **One representative render tile:** replace a tested source-only visual slice in one existing Three.js scene via loaded GLB/instanced lightweight meshes; preserve ID mapping and nonphysical safety until writer/road tests, geometry bounds and real screenshots pass.
3. **Geometry and street validation:** compare documented WGS84 ground truth, on-road centerlines vs *surveyed* curb/sidewalk geometry, terrain, entrances and floors before enabling route/collision migration. Keep legacy only for diagnostics.
4. **Citywide streaming:** dynamically load nearby approved map tiles and unload distant ones, select LOD by projected screen size, budget draw calls/GPU memory, preserve stable IDs and deduplicate cross-tile overlaps; separate verified and illustrative layers.
5. **Quality ladder:** graduate each building T0→T4 using legally sourced facade photos/surveys, verified floors/height and actual screenshot comparisons; do not equate coverage with accuracy.

3Dviz Pro Max consulted: `cognition/skills/3dviz-pro-max/SKILL.md`, `TWIN-WORLD.md` and `data/recipes/citygml-stable-id-scenario-diff.json`. Its stable ID / immutable base / epoch approach informs indexing. No recipe was copied into meshes; no visual capture was made.
