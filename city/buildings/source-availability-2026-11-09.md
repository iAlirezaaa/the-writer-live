# Writer block — dated geospatial source availability (2026-11-09)

Status: **source inventory and executable queries**, not a claim of 1:1 building architecture.

## Existing project files and direct findings

- WGS84 author anchor: `35.715361987616696, 51.3642455031707` (+X east / -Z north); protect `web/world.js` writer room.
- OpenStreetMap ODbL snapshot: `city/survey/output/writer-block-survey.json`. Captured `2026-11-09T09:22:58.743Z` from official map API, URL stored under `endpoint`.
  - 47 highway ways, 7 OSM-tagged building ways in a 230 m **search rectangle**; none of those seven building polygons intersect the road-bounded writer block (polygon-membership rechecked). This is **missing OSM building coverage**, not evidence of empty land.
  - Four enclosing ways: 4292858 Falahat Pour, 481657106 Fifth Daryan-e Now, 36697708 Eighth Daryan-e Now, 36697711 Khalil Mikaeili. All four carry `maxspeed=30` in the captured source; only two carry `oneway=yes`, one carries `oneway=no`, one has no direction tag.
- Overture ODbL snapshot: `city/survey/output/writer-block-overture-buildings.json`, `2026-11-09T12:18:12.627338+00:00`.
  - Four candidate ML-derived roofprints in the one writer block; every record has `heightMetersSource:null`, `numberFloorsSource:null`.
  - All four report Microsoft ML Buildings attribution, may merge contiguous physical structures. Overture release string is NOT a verified exact release; **do not claim four actual buildings**. The writer-room-intersecting outline stays ground-only.
- Non-surveyed earlier artistic architectural facades are explicitly separate from the source polygon and must be replaceable.

## New external research and applicable fields

- Official Overture Building schema (https://docs.overturemaps.org/schema/reference/buildings/building/) permits `height`, `num_floors`, `facade_material`, `roof_shape`, and `has_parts` — **availability in schema is not availability for these four feature IDs**.
- BuildingPart schema (https://docs.overturemaps.org/schema/reference/buildings/building_part/) supports `building_id`, `min_height`, `min_floor`, `num_floors` and roof parts; all parts need verified parent ID to avoid slicing merged ML roofs inventively.
- Overture provenance/licensing (https://docs.overturemaps.org/guides/buildings/, https://docs.overturemaps.org/attribution/) places its buildings theme under ODbL with source attribution; use per-feature source fields and stable IDs where present.

## One-block-only candidate queries (not yet executed/factually verified)

The rectangle `(35.71445,51.36285,35.71565,51.36500)` is a **candidate fetch window** around the block, not the true block polygon. Requests must additionally **clip to the four-way source road ring** and review OSM dates / licences before physical modeling.

```overpass
[out:json][timeout:35];
(
  nwr["building:levels"](35.71445,51.36285,35.71565,51.36500);
  nwr["height"](35.71445,51.36285,35.71565,51.36500);
  nwr["building:part"](35.71445,51.36285,35.71565,51.36500);
  nwr["entrance"](35.71445,51.36285,35.71565,51.36500);
  nwr["shop"](35.71445,51.36285,35.71565,51.36500);
);
out center tags meta;
```

Approved Overpass endpoints and rate cautions: https://wiki.openstreetmap.org/wiki/Overpass_API . Avoid treating unavailable API queries as zero matching features. For every future result, record exact OSM type/id, vertex/POI coordinate, captured timestamp, source metadata/rights, in-block point/polygon predicate and any matching Overture ID. A shop node is not proof of a precise frontage entrance.

## Reconstruction gate

A future iteration can upgrade only ONE feature when legal geodata has matching source identity, geographic place, known dimensions and satisfactory collision/room/road probes. If no height/floor observations are found, retain current 6 m clearly labelled illustrative volume instead of inventing a floor count.

MAYOR-045 implements only the four road speed/direction **map annotation** glyphs from OSM. Diagram location is not a claim of actual road paint or traffic sign, and no vehicle logic or citizen route was changed.
