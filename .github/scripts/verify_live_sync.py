#!/usr/bin/env python3
"""Verify public frontend export without exposing private writer data."""
from pathlib import Path
import re, json, hashlib
ROOT=Path(__file__).resolve().parents[2]
WEB=ROOT/"web"
MANIFEST=json.loads((ROOT/".github/live-sync-manifest.json").read_text(encoding="utf-8"))
SOURCE_COMMIT=MANIFEST["private_source_commit"]
if not re.fullmatch(r"[0-9a-f]{40}",SOURCE_COMMIT):
    raise RuntimeError("Invalid committed private source reference")
READER_ASSETS={"web/book.js","web/read.js","web/library-stage.js","web/library.css","web/reader-room.css","web/read.html"}
# Old exports have six required assets. New discovery exports also review both
# isolated preview files. Keep all original mandatory checks, reject unknown or
# incomplete groups, and verify every supplied hash rather than dropping extras.
DISCOVERY_ASSETS={"web/library-preview.css","web/library-preview.js"}
reader_assets=MANIFEST.get("reader_assets",{})
if not isinstance(reader_assets,dict) or set(reader_assets) not in (READER_ASSETS,READER_ASSETS|DISCOVERY_ASSETS):
    raise RuntimeError("Reviewed reader asset hashes are missing or unexpected")
for name,expected in reader_assets.items():
    if not isinstance(expected,str) or not re.fullmatch(r"[0-9a-f]{64}",expected):
        raise RuntimeError("Invalid reviewed reader asset hash: "+name)
    asset=ROOT/name
    if not asset.is_file() or hashlib.sha256(asset.read_bytes()).hexdigest()!=expected:
        raise RuntimeError("Reader asset differs from the reviewed private commit: "+name)
# A modern aisle release must review the new layout and the retired entry route
# together. Older exports without this layout remain valid under the old guard.
if 'data-library-layout="aisles"' in (WEB/"read.html").read_text(encoding="utf-8"):
    aisle_assets=MANIFEST.get("reader_aisle_assets",{})
    if not isinstance(aisle_assets,dict) or set(aisle_assets)!={"web/library-aisle.js","web/library-aisle.css","web/interaction-library/index.html"}:
        raise RuntimeError("Reviewed adjoining-cabinet asset hashes are missing or unexpected")
    for name,expected in aisle_assets.items():
        if not isinstance(expected,str) or not re.fullmatch(r"[0-9a-f]{64}",expected):
            raise RuntimeError("Invalid reviewed aisle asset hash: "+name)
        asset=ROOT/name
        if not asset.is_file() or hashlib.sha256(asset.read_bytes()).hexdigest()!=expected:
            raise RuntimeError("Aisle asset differs from the reviewed private commit: "+name)
# Nested motion imports are versioned by the reader's import map. Review the
# curl bytes too: a new URL alone is not proof that the intended fix was copied.
if 'page-curl.js?v=motion-' in (WEB/"read.html").read_text(encoding="utf-8"):
    motion_assets=MANIFEST.get("reader_motion_assets",{})
    if not isinstance(motion_assets,dict) or set(motion_assets)!={"web/page-curl.js"}:
        raise RuntimeError("Reviewed page-curl asset hash is missing or unexpected")
    for name,expected in motion_assets.items():
        if not isinstance(expected,str) or not re.fullmatch(r"[0-9a-f]{64}",expected):
            raise RuntimeError("Invalid reviewed motion asset hash: "+name)
        asset=ROOT/name
        if not asset.is_file() or hashlib.sha256(asset.read_bytes()).hexdigest()!=expected:
            raise RuntimeError("Motion asset differs from the reviewed private commit: "+name)
expected_reader=(WEB/"read.html").read_text(encoding="utf-8").replace('href="/web/','href="../web/').replace('src="/web/','src="../web/').replace('href="/"','href="../"')
if (ROOT/"read/index.html").read_text(encoding="utf-8")!=expected_reader:
    raise RuntimeError("Deployed reader entrypoint differs from the reviewed source")
NEEDED={
    "civita-buildings.js", "civita-crowd.js", "civita-details.js",
    "civita-measured-terrain.js", "civita-street-furnishing.js",
    "civita-writer-home.js", "civita-writer-house.js",
    "civita-writer-location.js", "civita-geo.mjs",
    "town.js", "town-civita.js", "world.js",
    "library.css", "library-stage.js", "reader-room.css", "page-curl.js",
    "book.js", "read.js", "book.css", "snapshot.js",
}
DATA={
    "civita-dbt.json":100000, "civita-walks.json":100000,
    "civita-dem-inner.u16":75000,"civita-dem-outer.u16":75000,
    "civita-ground-inner.jpg":90000,"civita-ground-outer.jpg":100000,
    "civita-osm-snapshot.json":1000,"civita-bridge-corridor.json":1000,
}
for name in sorted(NEEDED):
    p=WEB/name
    if not p.is_file() or p.stat().st_size<100:
        raise RuntimeError("Missing new public frontend asset: "+str(p))
for name,minimum in DATA.items():
    p=WEB/"data"/name
    if not p.is_file() or p.stat().st_size<minimum:
        raise RuntimeError("Missing licensed map/survey data: "+str(p))
dbt=json.loads((WEB/"data/civita-dbt.json").read_text(encoding="utf-8"))
if dbt.get("source",{}).get("license")!="CC-BY-4.0":
    raise RuntimeError("Regione Lazio survey license/provenance unavailable")
for file in (ROOT/"index.html",ROOT/"read/index.html"):
    source=file.read_text(encoding="utf-8")
    if re.search(r'(?:href|src)=["\x27]/(?:web|read)(?:/|["\x27])',source):
        raise RuntimeError("Unrewritten project-root URLs in "+str(file))
home=(ROOT/"index.html").read_text(encoding="utf-8")
reader=(ROOT/"read/index.html").read_text(encoding="utf-8")
world=(WEB/"world.js").read_text(encoding="utf-8")
book=(WEB/"book.js").read_text(encoding="utf-8")
if not all(x in home for x in ('id="stage"', 'data-panel=', 'src="./web/world.js', '"three": "./web/vendor/three.module.js"')):
    raise RuntimeError("Public city entrypoint missing observer, panel or import-map")
if not all(x in reader for x in ('id="covers"', 'library.css', 'reader-room.css', '../web/read.js')):
    raise RuntimeError("New reader/bookcase entrypoint missing")
if not all(x in world for x in ('writerInteriorWorldRoot','buildTown', 'anchorWriterHome', 'loadCivitaWriterParcel')):
    raise RuntimeError("New world entrypoint lost protected room or surveyed city")
if "owner_shared" not in book or "owner_shared" not in (WEB/"read.js").read_text(encoding="utf-8"):
    raise RuntimeError("Owner-authorized story status lost")
for p in WEB.rglob("*"):
    if p.suffix not in (".js",".mjs"):continue
    source=p.read_text(encoding="utf-8")
    for imported in re.findall(r'\b(?:from\s*|import\s*\()\s*["\x27](\.[^"\x27]+)',source):
        target=p.parent/imported.split("?",1)[0]
        if not target.is_file():
            raise RuntimeError("Missing relative import "+str(p.relative_to(ROOT))+" -> "+imported)
    if re.search(r'sk-proj-[A-Za-z0-9]|ghp_[A-Za-z0-9]{20}|-----BEGIN PRIVATE KEY-----|[0-9]{9}:AA[A-Za-z0-9_-]{20}',source):
        raise RuntimeError("Credential in public frontend "+str(p))
if not (ROOT/"snapshot/stories.json").is_file() or not (ROOT/"snapshot/stories/owner-20261110-jaye-doxt.json").is_file():
    raise RuntimeError("Owner-authorized snapshot discarded")
print("LIVE-EXPORT-GATE-OK",len(NEEDED),"assets,",len(DATA),"licensed datasets, source",SOURCE_COMMIT)
