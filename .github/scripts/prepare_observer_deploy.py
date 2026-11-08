#!/usr/bin/env python3
"""Pin the complete observatory shell after older car/citizen/reader guards.

The scheduled snapshot publisher may use an outdated local copy of the HTML
and CSS. This operation writes ONLY the temporary GitHub Pages artifact.
Private writer data, user submissions, book identifiers and timestamps are
never rewritten.
"""
from pathlib import Path
from shutil import copy2
import sys

VERSION="observatory-20261108-v4"
WORLD_VERSION="city-world-20261108-v5"
READER_VERSION="observatory-20261108-v2"
ROOT=Path(".github/observer-assets")


def prepare(site: Path) -> None:
    assert ROOT.is_dir(), "Observer assets are missing"
    site.mkdir(parents=True,exist_ok=True)
    web=site/"web"
    web.mkdir(exist_ok=True)
    for name in ("observer-ui.js","observer.css","persian-display.js","style.css"):
        source=ROOT/name
        if not source.is_file():
            raise RuntimeError("Missing pinned UI asset: "+str(source))
        copy2(source,web/name)
    copy2(ROOT/"index.html",site/"index.html")
    index=(site/"index.html").read_text(encoding="utf-8")
    observer=(web/"observer-ui.js").read_text(encoding="utf-8")
    locale=(web/"persian-display.js").read_text(encoding="utf-8")
    world=(web/"world.js").read_text(encoding="utf-8")
    style=(web/"observer.css").read_text(encoding="utf-8")
    reader=(web/"read.js").read_text(encoding="utf-8")
    reader_html=(site/"read"/"index.html").read_text(encoding="utf-8")
    checks={
        "complete original tabs":index.count("data-panel=")==15,
        "complete original cameras":index.count("data-view=")==10,
        "journal categories":len([x for x in ("زندگی نویسنده","نوشته‌ها و انتشار","شهر و جهان","ذهن و مسیر پیشرفت","ابزار و نگهداری") if x in observer])==5,
        "keyboard accessible RTL tabs":'buttons.setAttribute("role","tablist")' in observer and 'event.key==="ArrowLeft"' in observer,
        "camera grouping":'SCENE_GROUPS' in observer,
        "theme control":'id="observer-theme"' in index,
        "theme mode":'body.app[data-observer-theme="dark"]' in style,
        "responsive mobile":'@media(max-width:670px)' in style,
        "scene links":'id="scene-data-link"' in index and 'id="panel-scene-link"' in index,
        "Persian locale module":'export function solarDate' in locale and 'export function installPersianPresentation' in locale,
        "read-only public sections":'All fifteen sections remain accessible in the PUBLIC interface' in world,
        "scene integration":f'./observer-ui.js?v={VERSION}' in world,
        "reader locale":'installPersianPresentation(document.body)' in reader,
        "reader cache":f'read.js?v={READER_VERSION}' in reader_html,
        "root script cache":f'src="./web/world.js?v={WORLD_VERSION}"' in index,
        "relative import map":'"three": "./web/vendor/three.module.js"' in index,
        "relative book link":'href="./read/"' in index,
        "resident directory search":'id="town-search"' in index and 'resident-go-to' in world,
        "designed city directory":'id="town-places"' in index and 'renderCityPlaces()' in world,
        "day/night scene calendar":'id="observer-scene-date"' in index,
        "camera drawer":'observer-camera-drawer' in index and 'observer-camera-drawer' in style,
        "public publisher, atlas and library linked":'renderPublicObserverPanels' in world and 'renderPublicObserverPanels(null)' in world and 'observer-safe-action' in style,
        "date conversion on 3D canvas":'solarDate(String(e.at).slice(0, 10))' in world,
    }
    failed=[name for name,ok in checks.items() if not ok]
    if failed:
        raise RuntimeError("Observatory validation failed: "+", ".join(failed))
    print("OBSERVATORY-BUILD-OK",len(checks),"invariants, 15 tabs, 10 cameras, Jalali dates, public-safe state")


if __name__=="__main__":
    prepare(Path(sys.argv[1]) if len(sys.argv)>1 else Path("_site"))
