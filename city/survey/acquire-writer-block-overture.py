#!/usr/bin/env python3
"""Bounded, licensed Overture building roofprint acquisition for Writer's ONE block.

Uses Overture's public Python CLI and a shapely polygon intersection. No Google Maps
tiles, no synthetic building positions, and no impact on the existing town scene.
The CLI's latest release is recorded as an *unverified version* unless a matching
release can be established by a separate STAC check. Source capture is reproducible
as a bbox query but upstream data may change in later releases.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
import math
import pathlib
import subprocess
import tempfile

from shapely.geometry import shape, Polygon, MultiPolygon
from shapely.validation import explain_validity

HOME_LAT = 35.715361987616696
HOME_LON = 51.3642455031707
DEG = math.pi / 180
M_LAT = 111132.92 - 559.82 * math.cos(2 * HOME_LAT * DEG) + 1.175 * math.cos(4 * HOME_LAT * DEG)
M_LON = 111412.84 * math.cos(HOME_LAT * DEG) - 93.5 * math.cos(3 * HOME_LAT * DEG)
SOURCE = "Overture Maps Foundation / buildings / building"
LICENSE = "ODbL-1.0"
SOURCE_URL = "https://docs.overturemaps.org/guides/buildings/"
MAX_FEATURES = 800


def to_local(lon: float, lat: float):
    return [round((lon - HOME_LON) * M_LON, 3),
            round((HOME_LAT - lat) * M_LAT, 3)]


def survey_block(survey: dict) -> Polygon:
    if survey["homeAnchor"]["lat"] != HOME_LAT or survey["homeAnchor"]["lon"] != HOME_LON:
        raise ValueError("Wrong canonical writer-home anchor")
    if survey["blockBoundary"]["status"] != "OSM_CENTERLINE_CANDIDATE":
        raise ValueError("Block is not OSM-supported")
    ring = survey["blockBoundary"]["geometry"]["coordinates"][0]
    block = Polygon(ring)
    if not block.is_valid or not block.contains(shape({"type":"Point","coordinates":[HOME_LON,HOME_LAT]})):
        raise ValueError("Invalid block polygon or writer home outside block")
    if not 0 < block.area < 0.00001:
        raise ValueError("Block bounds suspicious")
    return block


def process(source_geojson: dict, survey: dict, captured_at: str, release: str):
    block = survey_block(survey)
    if source_geojson.get("type") != "FeatureCollection":
        raise ValueError("Overture GeoJSON FeatureCollection expected")
    selected = []
    ignored = {"outside": 0, "invalid": 0, "empty": 0, "small": 0}
    seen = set()
    for item in source_geojson.get("features", []):
        props = item.get("properties") or {}
        ident = props.get("id") or item.get("id")
        if not isinstance(ident, str) or not ident or ident in seen:
            ignored["invalid"] += 1
            continue
        seen.add(ident)
        try:
            geom = shape(item["geometry"])
        except Exception:
            ignored["invalid"] += 1
            continue
        if not geom.is_valid or geom.is_empty:
            ignored["invalid"] += 1
            continue  # No "fix" that silently invents edges.
        if not geom.intersects(block):
            ignored["outside"] += 1
            continue
        partial = not block.covers(geom)
        clipped = geom.intersection(block)
        parts = ([clipped] if isinstance(clipped, Polygon) else
                 list(clipped.geoms) if isinstance(clipped, MultiPolygon) else [])
        accepted = []
        for polygon in parts:
            if polygon.area < (6.0 / (M_LAT * M_LON)):
                ignored["small"] += 1
                continue
            if len(polygon.interiors):
                # Respect true polygon voids only if a future builder handles them.
                ignored["invalid"] += 1
                continue
            points = [to_local(*xy[:2]) for xy in polygon.exterior.coords]
            if len(points) < 4:
                ignored["invalid"] += 1
                continue
            # No detail outside clipped OSM writer block.
            accepted.append(points)
        if not accepted:
            ignored["empty"] += 1
            continue
        height = props.get("height")
        if not isinstance(height, (int, float)) or not 1.5 <= height <= 180:
            height = None
        floors = props.get("num_floors")
        if not isinstance(floors, int) or floors < 1 or floors > 60:
            floors = None
        selected.append({
            "id": ident,
            "ringsLocalXZ": accepted,
            "sourceFeatureType": props.get("type", "building"),
            "heightMetersSource": height,
            "numberFloorsSource": floors,
            "partialClipped": partial,
            "areaSquareMeters": round(clipped.area * M_LAT * M_LON, 2),
            "sourceAttribution": props.get("sources", []),
            "geometryEvidence": "overture-roofprint-not-cadastral"
        })
        if len(selected) > MAX_FEATURES:
            raise ValueError("Outside safe single-block feature limit")
    selected.sort(key=lambda f: f["id"])
    return {
        "schemaVersion": 1,
        "kind": "OVERTURE_REAL_BUILDING_ROOFPRINT_CANDIDATES",
        "source": SOURCE,
        "sourceUrl": SOURCE_URL,
        "license": LICENSE,
        "attribution": "© Overture Maps Foundation; © OpenStreetMap contributors",
        "release": release,
        "capturedAt": captured_at,
        "coordinates": "local X east, Z south; WGS84 source longitude/latitude",
        "homeAnchor": {"lat": HOME_LAT, "lon": HOME_LON, "localX": 0, "localZ": 0},
        "blockBoundary": {
            "status": survey["blockBoundary"]["status"],
            "areaSquareMeters": survey["blockBoundary"]["areaSquareMeters"],
            "osmWayIds": survey["blockBoundary"]["roadWayIds"],
            "osmCapturedAt": survey["capturedAt"]
        },
        "quality": {
            "buildingGeometry": "possibly ML-derived roofprints; not field surveyed",
            "heights": "only heightMetersSource if non-null; otherwise UNKNOWN",
            "limitations": "no façades, roof slopes, room connectivity, entrances or true ground contacts",
            "clipped": "geometry clipped to exact OSM road-centerline candidate polygon",
            "skippedCounts": ignored
        },
        "buildings": selected,
        "counts": {
            "inBlock": len(selected),
            "knownSourceHeight": sum(f["heightMetersSource"] is not None for f in selected),
            "clipped": sum(f["partialClipped"] for f in selected),
        }
    }


def download_cli(survey: dict, tmp_path: pathlib.Path) -> dict:
    block = survey_block(survey)
    west, south, east, north = block.bounds
    bbox = f"{west:.8f},{south:.8f},{east:.8f},{north:.8f}"
    command = ["overturemaps", "download", "--bbox=" + bbox,
               "-f", "geojson", "--type=building", "-o", str(tmp_path)]
    subprocess.run(command, check=True, timeout=190)
    if tmp_path.stat().st_size > 8_000_000:
        raise ValueError("Unexpected >8MB single-block source download")
    return json.loads(tmp_path.read_text(encoding="utf8"))


def main():
    cli = argparse.ArgumentParser()
    cli.add_argument("--survey", default="city/survey/output/writer-block-survey.json")
    cli.add_argument("--output", default="city/survey/output/writer-block-overture-buildings.json")
    cli.add_argument("--fixture", default=None)
    args = cli.parse_args()
    survey = json.loads(pathlib.Path(args.survey).read_text(encoding="utf8"))
    if args.fixture:
        raw = json.loads(pathlib.Path(args.fixture).read_text(encoding="utf8"))
        release = "synthetic-test-fixture"
    else:
        with tempfile.TemporaryDirectory() as d:
            raw = download_cli(survey, pathlib.Path(d) / "overture.geojson")
        release = "latest-via-overturemaps-cli; exact release NOT verified"
    result = process(raw, survey,
                     dt.datetime.now(dt.timezone.utc).isoformat(), release)
    out = pathlib.Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print("WRITER-BLOCK-OVERTURE-SOURCE-OK", json.dumps(result["counts"]))
    if result["counts"]["inBlock"] == 0:
        print("NO_REAL_BUILDING_ROOFPRINTS; do not invent an extrusion.")
    return result


if __name__ == "__main__":
    main()
