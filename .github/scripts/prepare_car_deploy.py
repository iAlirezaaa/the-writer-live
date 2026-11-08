#!/usr/bin/env python3
"""Build-only safeguard: keep the public car fleet when snapshot sync is stale.

A separate local publisher refreshes the public repository every five minutes.
That publisher can copy an old web/town.js and old index.html. This script
changes only the deployment artifact (_site) and never edits writer records,
the actual Git checkout, residents or timeline.
"""
from pathlib import Path
import re
import sys


def patch_site(root: Path) -> None:
    web = root / "web"
    town_file = web / "town.js"
    world_file = web / "world.js"
    index_file = root / "index.html"
    cars_file = web / "town-cars.js"
    if not all(p.is_file() for p in (town_file, world_file, index_file, cars_file)):
        raise RuntimeError("Required living-world vehicle assets are missing")

    cars = cars_file.read_text(encoding="utf-8")
    if not all(s in cars for s in (
        "export function buildTownCars", 'kind:"compact"', 'kind:"sedan"',
        'kind:"taxi"', 'kind:"van"', 'kind:"pickup"',
        "const laneCars=", "safeGap=", "setCrossingDemand", "trafficState"
    )):
        raise RuntimeError("Detailed collision-aware fleet is unavailable")

    version = "fleet-20261108-e"
    town = town_file.read_text(encoding="utf-8")
    # Older publishing processes reinsert these simple, incorrect cars.
    legacy_start = town.find("  const cars = [];")
    if legacy_start >= 0:
        return_anchor = "  return {\n    group,\n    update(day, elapsed)"
        end = town.find(return_anchor, legacy_start)
        if end < 0:
            raise RuntimeError("Cannot safely remove legacy vehicle block")
        town = town[:legacy_start] + town[end:]
        old_loop = re.compile(
            r"      for \(const vehicle of cars\) \{\n"
            r".*?\n      \}", re.DOTALL
        )
        town, replaced = old_loop.subn("", town, count=1)
        if replaced != 1:
            raise RuntimeError("Legacy vehicle update loop was not found")

    old_import = 'import { buildTownCars } from "./town-cars.js";'
    new_import = f'import {{ buildTownCars }} from "./town-cars.js?v={version}";'
    town, count = re.subn(
        r'^import \{ buildTownCars \} from "\./town-cars\.js(?:\?v=[^"]+)?";',
        lambda _m: new_import, town, count=1, flags=re.MULTILINE
    )
    if count == 0:
        town = new_import + "\n\n" + town

    ret = "  return {\n    group,\n    update(day, elapsed)"
    if not re.search(r'\bconst\s+carLayer\s*=\s*buildTownCars\s*\(', town):
        if ret not in town:
            raise RuntimeError("Town return boundary changed")
        town = town.replace(
            ret,
            "  const carLayer=buildTownCars({THREE,city:group,streetY:STREET_Y});\n" + ret,
            1
        )
    if not re.search(r'\bcarLayer\.update\s*\(\s*day\s*,\s*elapsed\s*\)', town):
        update_anchor = "      umbrella.rotation.y = Math.sin(elapsed * 0.15) * 0.012;"
        if update_anchor not in town:
            raise RuntimeError("Town update hook changed")
        town = town.replace(
            update_anchor, update_anchor + "\n      carLayer.update(day,elapsed);", 1
        )
    if "const cars = []" in town or "for (const vehicle of cars)" in town:
        raise RuntimeError("Legacy vehicles remain in the deployed town")
    town_file.write_text(town, encoding="utf-8")

    world = world_file.read_text(encoding="utf-8")
    # Preserve the current street elevation and architected city module.
    # This guard owns vehicle integrity, not the newer town cache namespace.
    town_import = 'import { buildTown, nightLighting, STREET_Y } from "./town.js";'
    bust_import = 'import { buildTown, nightLighting, STREET_Y } from "./town.js?v=city-districts-20261108-v3";'
    world, count = re.subn(
        r'^import \{ buildTown, nightLighting(?:, STREET_Y)? \} from "\./town\.js(?:\?v=[^"]+)?";',
        lambda _m: bust_import, world, count=1, flags=re.MULTILINE
    )
    if count != 1:
        raise RuntimeError("Cannot locate the town import in world.js")
    if "  cars:     { pos:" not in world:
        town_view = "  town:     { pos: [26, 30, 53], target: [0, -1, 2] },"
        if town_view not in world:
            raise RuntimeError("Cannot insert vehicle camera without the town view")
        world = world.replace(
            town_view,
            town_view + "\n  cars:     { pos: [11.5, 4.2, 18.4], target: [1.6, -2.35, 8.5] },",
            1
        )
    original_label = 'const names = { town: "محلهٔ نویسنده",'
    if 'cars: "ماشین‌های شهر"' not in world:
        if original_label not in world:
            raise RuntimeError("Cannot label dedicated vehicle camera")
        world = world.replace(
            original_label,
            'const names = { cars: "ماشین‌های شهر", town: "محلهٔ نویسنده",',
            1
        )
    world_file.write_text(world, encoding="utf-8")

    html = index_file.read_text(encoding="utf-8")
    old_button = '<button data-view="town">شهر</button>'
    car_button = '<button data-view="cars">ماشین‌ها</button>'
    if car_button not in html:
        if old_button not in html:
            raise RuntimeError("City navigation button not found")
        html = html.replace(old_button, old_button + "\n        " + car_button, 1)
    # A new entrypoint URL causes the entire car import chain to be requested
    # again, even when the browser/CDN cached the former bundle.
    plain = 'src="./web/world.js"'
    versioned = f'src="./web/world.js?v={version}"'
    html, count = re.subn(
        r'src="\./web/world\.js(?:\?v=[^"]+)?"',
        lambda _m: versioned, html, count=1
    )
    if count != 1:
        raise RuntimeError("Page entrypoint script not found")
    index_file.write_text(html, encoding="utf-8")
    assert re.search(r'\bcarLayer\.update\s*\(\s*day\s*,\s*elapsed\s*\)', town)
    assert new_import in town
    assert bust_import in world
    assert versioned in html
    print("Public deployment: collision-safe, six-profile vehicle fleet wired correctly")


if __name__ == "__main__":
    patch_site(Path(sys.argv[1]) if len(sys.argv) > 1 else Path("_site"))
