#!/usr/bin/env python3
"""Build one small bounded, ODbL-attributed Civita OSM source snapshot.

One request to official OSM API 0.6/map, no retry, no bulk downloads.
This output supplies footprint XY and pedestrian centerlines ONLY, not 3D
heights, legal building boundaries, terrain, house plans or population.
"""
from __future__ import annotations
import datetime as dt
import json
from pathlib import Path
import sys
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

BBOX = (12.11225, 42.62695, 12.11540, 42.62824)  # west,south,east,north
API_URL = "https://api.openstreetmap.org/api/0.6/map?bbox=" + ",".join(map(str, BBOX))
AGENT = "TheWriter-Civita-DigitalTwin/1.0 (https://github.com/iAlirezaaa/the-writer-live)"
PEDESTRIAN = {"footway", "pedestrian", "path", "steps"}
TAGS = {"building", "height", "building:levels", "roof:shape", "highway"}
MAX_RESPONSE_BYTES = 7_000_000
MAX_ELEMENTS = 650
MAX_POINTS = 160

def convert(xml_bytes: bytes, *, acquired_at: str) -> dict:
    if len(xml_bytes) > MAX_RESPONSE_BYTES:
        raise ValueError("OSM map exceeds bounded response size")
    root = ET.fromstring(xml_bytes)
    if root.tag != "osm":
        raise ValueError("Not an OSM API map document")
    nodes = {}
    for node in root.findall("node"):
        try:
            nodes[node.attrib["id"]] = (
                float(node.attrib["lat"]), float(node.attrib["lon"])
            )
        except (KeyError, ValueError):
            continue
    elements = []
    skipped = 0
    seen_way_ids = set()
    for way in root.findall("way"):
        tags = {tag.get("k"): tag.get("v") for tag in way.findall("tag")
                if tag.get("k") in TAGS}
        if not (tags.get("building") not in (None, "no")
                or tags.get("highway") in PEDESTRIAN):
            continue
        refs = [node.get("ref") for node in way.findall("nd")]
        if not 2 <= len(refs) <= MAX_POINTS or any(ref not in nodes for ref in refs):
            skipped += 1
            continue
        try:
            way_id = int(way.attrib["id"])
        except (KeyError, ValueError):
            skipped += 1
            continue
        if way_id in seen_way_ids:
            raise ValueError(f"Duplicate OSM way identity: way/{way_id}")
        seen_way_ids.add(way_id)
        raw_version = way.attrib.get("version")
        try:
            version = int(raw_version) if raw_version is not None else None
            if version is not None and version < 1:
                raise ValueError("OSM way version must be positive")
        except ValueError:
            skipped += 1
            continue
        elements.append({
            "type": "way", "id": way_id, "version": version, "tags": tags,
            "timestamp": way.attrib.get("timestamp"),
            "geometry": [{"lat": nodes[ref][0], "lon": nodes[ref][1]}
                         for ref in refs],
        })
        if len(elements) > MAX_ELEMENTS:
            raise ValueError("OSM map includes too many ways for the bounded viewer")
    if not elements:
        raise ValueError("No sourced building/footpath ways returned")
    return {
        "elements": elements,
        "source": {
            "provider": "OpenStreetMap contributors", "license": "ODbL-1.0",
            "url": API_URL, "acquired_at": acquired_at,
            "bbox_wsen": list(BBOX), "crs": "EPSG:4326",
            "building_geometry": "OSM ways, not survey-certified",
            "height_and_roof_accuracy": "unknown unless individually tagged",
            "excluded": "unsupported multipolygon relations and unverified interiors",
            "ways_without_full_nodes": skipped,
        }
    }

def download() -> bytes:
    request = Request(API_URL, headers={
        "User-Agent": AGENT, "Accept": "application/xml",
        "Referer": "https://ialirezaaa.github.io/the-writer-live/",
    })
    with urlopen(request, timeout=19) as response:
        if response.status != 200:
            raise RuntimeError(f"OSM map HTTP {response.status}")
        body = response.read(MAX_RESPONSE_BYTES + 1)
    return body

def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: build_civita_osm_snapshot.py DESTINATION.json")
    timestamp = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    result = convert(download(), acquired_at=timestamp)
    out = Path(sys.argv[1])
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":"))+"\n",
                   encoding="utf-8")
    print("CIVITA-OSM-SNAPSHOT-OK",
          len(result["elements"]), "ways",
          "source", API_URL, "acquired", timestamp,
          "skipped", result["source"]["ways_without_full_nodes"])

if __name__ == "__main__":
    main()
