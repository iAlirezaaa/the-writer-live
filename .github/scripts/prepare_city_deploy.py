#!/usr/bin/env python3
"""Final build gate for versioned living-city architecture.

Checks only the Pages artifact. No user memories, writer-room data,
publisher meetings, authored citizen routines or car trajectories are changed.
"""
from pathlib import Path
import sys

VERSION="city-districts-20261108-v3"
TOWN_VERSION="city-tehran-source-only-20261109-v3"
ROOT=Path(".github/city-assets")


def inspect(site: Path) -> None:
    city=(site/"web/town-districts.js").read_text(encoding="utf-8")
    town=(site/"web/town.js").read_text(encoding="utf-8")
    world=(site/"web/world.js").read_text(encoding="utf-8")
    objects=(site/"web/objects.js").read_text(encoding="utf-8")
    index=(site/"index.html").read_text(encoding="utf-8")
    urban=(site/"web/urban-plan.js").read_text(encoding="utf-8")
    roads=(site/"web/road-surface.js").read_text(encoding="utf-8")
    growth=(site/"web/city-growth.js").read_text(encoding="utf-8")
    expected=[
        ("pin matches authored growth kit",growth==(ROOT/"city-growth.js").read_text(encoding="utf-8")),
        ("new civic growth runtime", './city-growth.js?v=civic-growth-20261108-v1' in town),
        ("housing capacity declared", 'CITY_HOUSING_CAPACITY' in growth and 'flatsPerFloor:3' in growth),
        ("forest and municipal links present", 'eastern-forest-exit' in urban and 'west-civic-link' in urban),
        ("one unified road mesh module", "export function buildSeamlessRoadSurface" in roads),
        ("road paint elevation shared", "export const ROAD_PAINT_CENTER_OFFSET" in roads),
        ("one writer room root", "writerInteriorWorldRoot.add(baseWriterRoomShell)" in world),
        ("urban master plan shipped", "export function auditUrbanPlan" in urban),
        ("writer home exterior", "writer-home-exterior-v2" in world),
        ("outdoor facade first", 'let view = "town"' in world),
        ("pinned district kit",city==(ROOT/"town-districts.js").read_text(encoding="utf-8")),
        ("twelve authored blocks",city.count('{id:"')>=21),
        ("publisher office interior",'"editorial-office-desk"' in city),
        ("writer room explicitly protected",'"writerRoomUntouched:true"' in city or 'writerRoomUntouched:true' in city),
        ("city module connected",f'./town-districts.js?v={VERSION}' in town),
        ("world town cache fresh",f'./town.js?v={TOWN_VERSION}' in world),
        ("city catalog connected",f'./town-districts.js?v={VERSION}' in world),
        ("city information panel",'"place:"+civic.id' in objects),
        ("city venues navigable",'"town-places"' in world and 'renderCityPlaces()' in world),
        ("new world entrypoint",'src="./web/world.js?v=city-world-20261110-visible-neighborhood-v1"' in index),
        ("original camera menu kept",index.count("data-view=")==10),
        ("original notebook panels kept",index.count("data-panel=")==15),
        ("unchanged car source", 'buildTownCars' in town),
        ("clean source-only Tehran town default", 'mapMode="source-only"' in town and 'buildTehranReconstructionTown' in town),
        ("source map builder pinned", (site/"web/town-tehran-rebuild.js").is_file()),
    ]
    failed=[name for name,good in expected if not good]
    if failed:
        raise RuntimeError("City district build gate: "+", ".join(failed))
    print("CITY-DISTRICT-BUILD-OK",len(expected),"invariants")


if __name__=="__main__":
    inspect(Path(sys.argv[1]) if len(sys.argv)>1 else Path("_site"))
