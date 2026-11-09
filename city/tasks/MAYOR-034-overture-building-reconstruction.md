# MAYOR-034 — First licensed real-building map layer for the Writer block
Date: 2026-11-09
Status: PUBLIC CI TESTED AND PAGES DEPLOYED; browser screenshots and physically surveyed heights pending.

## Updated explicit user permission
All city **geometry** may be replaced/reorganized to better reproduce the actual neighborhood.
**Writer's room is immutable and must remain accessible** (its surrounding building may move,
but the room must not be deleted). Do not erase author memory, publisher logic, stories or
citizen IDs. Prefer source-backed and independently testable construction over invented
building heights. Limit full reconstruction strictly to the same road-bounded writer block.

## Source and candidate decision
Current local OSM extract (2026-11-09, ODbL 1.0) has **zero mapped building footprints inside
the target 12,265 m² writer block**. It does identify the surrounding actual four roads
(Khalil Mikaeili, Falahat Pour, Fifth Daryan-e Now, Eighth Daryan-e Now).
Use Overture Maps Foundation **Buildings** latest release selected by the public CLI (ODbL 1.0). The exact release ID was **not verified** and must not be described as pinned; source GERS IDs/licenses and capture timestamp are retained. The building
theme includes ML-derived outlines, not a cadastral survey. Source docs:
https://docs.overturemaps.org/guides/buildings/ and https://docs.overturemaps.org/getting-data/ .
The capture must be read-only and clipped to the **existing OSM centerline candidate**
polygon, not the 230m OSM context box or adjacent blocks.

## Frozen backups (verified before geometry work)
- [x] Private `backup/writer-block-pre-tehran-rebuild-2026-11-09` exact `cfdac995b6e070d472627b484c93d8fbf5f6ed2b`.
- [x] Public exact `ececf9ffc041b1666b0425f4f1746d162b9dcf67`.
- [x] Backup manifest Git blob in both `4821f550f9228adb7ba68e188ca8ee8a10b2dd04`.
- [x] Read `city/skills/tehran-writer-block/SKILL.md`, MAYOR-026, 3Dviz Pro Max SKILL and TWIN-WORLD, `historical-diorama`/ `citygml-stable-id-scenario-diff` recipes.
- [x] Read owner `web/town.js` and local OSM survey, SRTM topography and existing town scene tests.

## First implementation scope (one safe construction feature)
1. [x] Acquire actual Overture GeoJSON footprints for a **bounded AOI**; record release, time,
   license, data quality, feature stable IDs, geometries, number fully inside the target block.
   No invented buildings if provider returns none or acquisition fails.
2. [x] Build a separately selectable, clearly **source-backed** 3D building-volume layer
   on measured footprint geometry with symbolic placeholder heights when absent.
   If factual height unavailable, never imply a real height. No collision or nav changes.
3. [x] Keep all actual writer-room mesh and surrounding author state untouched.
4. [x] Run tests for footprint clipping/strict source, no buildings outside writer block,
   writer-room preservation, source/visual mesh separation, performance and existing road/house/
   traffic/access invariants. Release public **only after passing**.
5. [ ] Capture real bird's-eye/street/day/night screenshots if browser available;
   report lack of screenshots as a blocker, not a success.

## Two next backlog improvements
- Polygon-to-parcel topological audit: compare open building footprints to real OSM street
  centers, quantify road overlaps and uncertain frontage before any physical collider swap.
- Gradual **room-preserving** reconstruction migration with one-by-one verified real
  footprint and temporary navigable proxy bridges; no global reset of writer/publisher state.

## Truthfulness gate
Legacy procedural façades may remain visible until measured buildings pass source/scene
checks. Overture roofprints can be ML-derived; they do not establish floor count,
facade architecture, house ownership or roof elevation. Only licensed sources, dated
provenance and explicit error/coverage measurements support accuracy claims.

## Actual source and public release evidence
- Overture acquisition completed in public runner (private Actions would not start) and the audited output was imported into private canonical Git before implementation. Public source run: https://github.com/iAlirezaaa/the-writer-live/actions/runs/42615830208 . Dataset: `city/survey/output/writer-block-overture-buildings.json`, timestamp `2026-11-09T12:18:12.627338+00:00`, ODbL 1.0, `overturemaps-py 0.20.0` CLI; exact Overture underlying release is **unverified**.
- Strict OSM face clip: **4 real roofprint candidates**, combined mapped footprint **6461.46 m²**, **0** real building heights, **0** boundary-clipped polygons. One Overture feature intersects protected writer room; it is **outline-only** in Three.js.
- Implemented `web/writer-block-buildings.js` and frozen `web/writer-block-building-data.js`. Three additional mapped footprints are rendered as **transparent 6m symbolic-height building volumes** with one merged 588-vertex mesh; all four plans are drawn in one line set. No sidewalk, road collider, traffic routes, author-room, publisher or story systems were moved.
- Real Three.js test `tests/tehran_writer_block_buildings_probe.mjs` passed in public Pages run https://github.com/iAlirezaaa/the-writer-live/actions/runs/42617301697 at `d76c74ffa91e873e47144fe67eff74fb808a2243`. Logged `TEHRAN-REAL-BUILDING-ROOFPRINTS-OK`: 4 footprints, 3 symbolic volumes, room protected, 588 vertices, symbolic height 6m. `URBAN-PLAN-OK`, `ROAD-TOPOLOGY-OK`, `WRITER-HOME-CONSISTENCY-OK`, `CITY-DISTRICTS-OK`, `HOUSING-ACCESS-OK`, `TOWN-SCENE-OK` layout/paths/wiring, and `CITY-TRAFFIC-OK` passed.
- No real screenshots, street-view parity comparison, measured building height or photogrammetric facade validation: **NOT VERIFIED**. No claim of exact Tehran reconstruction. Current legacy procedural streets still drive traffic, while OSM streets and new Overture roofprints provide explicitly source-labeled visual evidence.
