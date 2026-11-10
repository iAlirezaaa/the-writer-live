#!/usr/bin/env python3
"""Public Civita build pin: protect citizen identities and the new city overlay.

This edits only the temporary GitHub Pages artifact. It does not mutate any
private writer/publisher records or simulated resident JSON.
"""
from pathlib import Path
import re
import sys

VERSION = "citizens-20261109-v1"
WORLD_VERSION = "city-world-20261110-civita-v2"


def patch_site(root: Path) -> None:
    web = root / "web"
    files = {name:(web/name).read_text(encoding="utf-8") for name in (
        "citizens.js", "citizen-motion-library.js", "objects.js",
        "world.js", "town.js", "town-civita.js", "civita-pedestrians.js")}
    required = {
        "old resident identities preserved": "export function createCitizens" in files["citizens.js"]
           and "setPublisherProfile" in files["citizens.js"]
           and "function paintRoute" in files["citizens.js"],
        "shared citizen motion preserved": "MOTION_ARCHIVE" in files["citizen-motion-library.js"]
           and "socialClipsDormant:true" in files["citizen-motion-library.js"],
        "inspectable citizen core": "citizenSelect" in files["objects.js"],
        "old citizen author records separate": "citizens.crossingDemand()" in files["world.js"],
        "old resident visuals suppressed outdoors": "showingCivitaOutdoors" in files["world.js"],
        "Civita-only town imported": "buildCivitaTown" in files["town.js"],
        "OSM way people render in active city": "createCivitaPedestrians" in files["town-civita.js"]
          and "anonymous-footpath-visitor" in files["civita-pedestrians.js"],
        "author room unchanged": "writerInteriorWorldRoot.add(baseWriterRoomShell)" in files["world.js"],
        "shared motion import": f'./citizens.js?v={VERSION}' in files["world.js"]
          and f'./citizen-motion-library.js?v={VERSION}' in files["world.js"],
    }
    errors=[name for name,good in required.items() if not good]
    if errors:
        raise RuntimeError("Civita citizen build gate: "+", ".join(errors))
    index_file=root/"index.html"
    index=index_file.read_text(encoding="utf-8")
    index,count=re.subn(
       r'src="\./web/world\.js(?:\?v=[^"]+)?"',
       f'src="./web/world.js?v={WORLD_VERSION}"',index,count=1)
    if count!=1:raise RuntimeError("Missing versionable world entry")
    index_file.write_text(index,encoding="utf-8")
    print("CIVITA-CITIZENS-BUILD-OK", len(required),
          "checks, anonymous OSM walkers and preserved writer/publisher roster")

if __name__=="__main__":
    patch_site(Path(sys.argv[1]) if len(sys.argv)>1 else Path("_site"))
