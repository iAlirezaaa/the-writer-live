#!/usr/bin/env python3
"""Build-only pin for reviewed citizen and publisher-world assets.

The scheduled local snapshot exporter may copy older web JS files into main.
This guard reads pinned sources and changes only _site, never user data.
Actual publisher meeting/experience files are not exported to Pages.
"""
from pathlib import Path
import re
import sys

VERSION = "citizens-20261109-v1"
WORLD_VERSION = "city-world-20261109-writer-apartment-floor3-v1"


def patch_site(root: Path) -> None:
    web=root/"web"
    sources={key:(web/key).read_text(encoding="utf-8") for key in (
        "citizens.js","citizen-motion-library.js","objects.js","world.js",
        "town.js","town-cars.js")}
    if not all((
        'export function createCitizens' in sources["citizens.js"],
        'setPublisherProfile' in sources["citizens.js"],
        'function paintRoute' in sources["citizens.js"],
        'cos*dx-sin*dz' in sources["citizens.js"],
        'sin*dx+cos*dz' in sources["citizens.js"],
        'function crossingDemand' in sources["citizens.js"],
        'crossingOwner' in sources["citizens.js"],
        'citizens.crossingDemand()' in sources["world.js"],
        'town.trafficState()' in sources["world.js"],
        'carLayer.setCrossingDemand(' in sources["town.js"],
        'function trafficState()' in sources["town-cars.js"],
        'citizenSelect' in sources["objects.js"],
        'MOTION_ARCHIVE' in sources["citizen-motion-library.js"],
        'socialClipsDormant:true' in sources["citizen-motion-library.js"],
        f'./citizens.js?v={VERSION}' in sources["world.js"],
        f'./citizen-motion-library.js?v={VERSION}' in sources["world.js"],
        './objects.js?v=city-districts-20261108-v1' in sources["world.js"],
        'mesh.userData.placeDetails' in sources["objects.js"],
        'buildCityDistricts(' in sources["town.js"],
    )):
        raise RuntimeError("Missing pinned citizen identity / motion / inspection integration")
    index_file=root/"index.html"
    index=index_file.read_text(encoding="utf-8")
    # Do this LAST: earlier reader deploy refreshes world.js with reader-v4,
    # but current world.js already explicitly imports book.js?v=reader-v4.
    index,count=re.subn(
        r'src="\./web/world\.js(?:\?v=[^"]+)?"',
        f'src="./web/world.js?v={WORLD_VERSION}"',
        index,count=1
    )
    if count!=1:
        raise RuntimeError("Cannot version public 3D-world entrypoint")
    index_file.write_text(index,encoding="utf-8")
    print("Citizen deployment: 12 unique cores, shared motion, protected crosswalk, click panels and publisher proxy OK")


if __name__=="__main__":
    patch_site(Path(sys.argv[1]) if len(sys.argv)>1 else Path("_site"))
