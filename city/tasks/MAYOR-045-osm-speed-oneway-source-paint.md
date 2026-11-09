# MAYOR-045 — OSM-source road direction and 30 km/h inspection layer
Date: 2026-11-09
Status: TODO BEFORE RUNTIME CHANGES

## One bounded change
Use the existing official OSM captured snapshot `city/survey/output/writer-block-survey.json` (2026-11-09, © OSM contributors ODbL-1.0) to make the **real road-regulation tags** of the four block-boundary ways visible in the source-only Three.js view. No real sign position is claimed. This is a navigational *map annotation* rather than physical road modification.

Source snapshot facts (independently cross-checked against feature properties):
- 4292858 / فلاحت پور: `highway=residential`, `maxspeed=30`, `surface=asphalt`; **no oneway tag**, do not infer.
- 481657106 / پنجم دریان‌ نو: `highway=residential`, `maxspeed=30`, `oneway=yes` in source-way west→east orientation.
- 36697708 / هشتم دریان‌ نو: `highway=residential`, `maxspeed=30`, `oneway=no` (bidirectional).
- 36697711 / خلیل میکائیلی: `highway=residential`, `maxspeed=30`, `oneway=yes` in source-way east→west orientation.

Note: these are dated OSM contributor-tag assertions; no official municipal regulatory validation or sign survey has been made. Overture's current schema optionally supports `height`, `num_floors`, and building parts, but the 4 saved building candidate polygons lack all such heights/floors. Do not invent architecture or shops. The OSM 230m survey lists 7 tagged building ways, none intersecting this interior candidate block, showing OSM building incompleteness.

## Required sequence
- [x] Read `city/skills/tehran-writer-block/SKILL.md`, `city/tasks/MAYOR-026-tehran-writer-block-3dviz-contract.md`, vendored 3Dviz Pro Max `SKILL.md`, `TWIN-WORLD.md` and architectural/object craft. Confirm both immutable backup refs and manifests.
- [x] Research OSM's official API capture and Overture schema (height, floors, parts); distinguish ODbL licensed baseline from illustrative facades.
- [ ] Add one self-contained non-colliding OSM traffic evidence paint group, one map glyph per supported segment/known tag, no physical sign or invented entry.
- [ ] Reject future source tag drift via targeted test comparing registry to exact official OSM snapshot. Assert sign/arrow orientation, topology, ground clearance, writer room and one-block scope; preserve source-only and legacy probes.
- [ ] Run Node/Three.js, source-only and legacy tests; sync private→public pinned city assets only after passes.
- [ ] Record commit SHAs, actual CI and Pages status, and explicit blocker(s). No false claim of browser capture or live traffic.

## Backlog additions
1. A provenance-checked per-way Overpass/official OSM refresh pipeline for roadway `oneway`, `maxspeed`, `lanes`, `width`, `sidewalk` and speed restrictions, with drift review, dates and rights.
2. Per-building Overture `building_part`, OSM `building:levels`, entrance and POI evidence cross-join on real geometry, with unknown floors and access preserved until verified.

## Visual contract
Use small source-aligned road diagram arrows (not real physical signage), 30-speed inspection discs, and status metadata. No cars or resident routes changed. Scene root `source-only` remains the default, with the writer room independent under `web/world.js`; geometry can be turned off by removing one group.
