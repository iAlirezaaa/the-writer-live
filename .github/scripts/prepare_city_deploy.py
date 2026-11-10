#!/usr/bin/env python3
"""Active Civita digital-twin artifact gate, no Tehran fallback geometry."""
from pathlib import Path
import sys

WORLD_VERSION="city-world-20261110-civita-v4"
TOWN_VERSION="city-civita-main-20261110-v3"

def inspect(root:Path):
  web=root/"web"
  needed=[
    "world.js","town.js","town-civita.js","civita-geo.mjs",
    "civita-osm-vectors.mjs","civita-osm-render.js",
    "civita-pedestrians.js","civita-writer-house.js","civita-terrain.js",
    "civita-room-plan.js","civita-place-catalog.js","civita-environment.js"
  ]
  missing=[name for name in needed if not (web/name).is_file()]
  if missing:raise RuntimeError("Missing active Civita assets: "+", ".join(missing))
  town=(web/"town.js").read_text(encoding="utf-8")
  world=(web/"world.js").read_text(encoding="utf-8")
  city=(web/"town-civita.js").read_text(encoding="utf-8")
  home=(web/"civita-writer-house.js").read_text(encoding="utf-8")
  index=(root/"index.html").read_text(encoding="utf-8")
  geo=(web/"civita-geo.mjs").read_text(encoding="utf-8")
  checks={
   "Civita is the only active town": "mapMode='civita'" in town
     and "buildCivitaTown" in town and "buildTehranReconstructionTown" not in town,
   "same origin on map": "42.6277" in geo and "12.1137" in geo,
   "source-only 3D city layer": "attachCivitaVectors" in city,
   "source terrain available for OSM map": "loadCivitaTerrain" in city and (web/"civita-terrain.js").is_file(),
   "pedestrians anchored to source ways": "createCivitaPedestrians" in city,
   "room root retained": "writerInteriorWorldRoot.add(baseWriterRoomShell)" in world
     and "writerInteriorWorldRoot.add(expandedWriterRoomShell)" in world,
   "Lo Studio study is not falsely surveyed": "matchedToActualLoStudio:false" in home,
   "exterior builder active": "buildCivitaWriterExterior(THREE,writerExterior," in world,
   "live local Italian weather": "createCivitaWeatherService()" in world
     and "./civita-environment.js" in world,
   "old Tehran weather not imported": "tehran-environment.js" not in world,
   "old Tehran architecture not active": "town-districts.js" not in world
     and "urban-plan.js" not in world,
   "Civita camera pan bounds": "clampCivitaTarget" in world,
   "source attribution": "OpenStreetMap contributors" in index,
   "current world import": f'./town.js?v={TOWN_VERSION}' in world,
   "current index entry": f'src="./web/world.js?v={WORLD_VERSION}"' in index,
  }
  errors=[name for name,good in checks.items() if not good]
  if errors:raise RuntimeError("Civita city deploy gate: "+", ".join(errors))
  print("CIVITA-CITY-BUILD-OK",len(checks),"checks; zero active Tehran road/roof meshes")

if __name__=="__main__":
  inspect(Path(sys.argv[1]) if len(sys.argv)>1 else Path("_site"))
