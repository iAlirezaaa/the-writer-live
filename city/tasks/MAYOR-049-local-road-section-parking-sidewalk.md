# MAYOR-049 — Sixth Daryan-e Now: usable, separated sidewalk, parking and passable lane geometry
Date: 2026-11-09
Status: PUBLISHED AND FULL GITHUB PAGES CI PASS; ACTUAL STREET SURVEY AND BUILDING COUNT PENDING

## Task boundaries
The user requests realistic and correctly passable alley widths, pedestrian sidewalks, parallel parked cars and the true number/orientation of houses. Only a small verifiable change in this run: replace the uniform, too-narrow authored **visual cross-section for ONE confirmed OSM alley** with a bounded, non-colliding, distinctly separated illustrative example. Preserve actual OSM road centerline coordinates, original 7 source ways and 5 source junctions. No fake legal width, entrance/real house segmentation, property unit counts or sidewalk availability.

- OSM way 92200441, ششم دریان نو, `highway=residential`, `maxspeed=30`, no `oneway` or width/parking tags in 2026-11-09 snapshot. Therefore assume a **two-way passing safety envelope** solely for authored design, NOT certified actual two-way operation or actual curb position.
- Iran urban street design guideline (1399, Volume 5, Table 4-3 p56) quoted by official National Building Regulations traffic exam explanatory key (1403 question 30): illustrative minimum 2.50m passing lane, 1.80m parallel parking lane, 1.20m clear sidewalk each side, SUM 6.70m in one-lane example. Source PDF: https://iranestekhdam.ir/storage/medias/2025-02-22/1740226341_%D8%AA%D8%B1%D8%A7%D9%81%DB%8C%DA%A9-aban1403.pdf
- OSM width=* semantics: kerb-to-kerb including marked parking but excluding sidewalks; see https://wiki.openstreetmap.org/wiki/Key:width . No width tags for this actual way; width in model is an **example, not measured**.
- Proposed illustrative profile: 2×2.8m travel/passing lanes = 5.6m, one 2.1m parallel parking zone on right, 1.5m continuous sidewalk both sides; combined **10.7m**. This width is a design hypothesis only; potential building encroachment requires measured plot/curb survey before real implementation.
- Reserved entrance/intersection clearances ≥ 14m at each end of source way. Parking bays ≥ 6m long, minimum 15m spacing; five generic parked cars must not overlap moving lane or either footpath. No citizen or vehicle route modifications.
- Expose exact lane/parking/sidewalk limits and clearance checks in new `planSixthDaryanIllustrativeSection`, plus finite, efficient Three.js rendering using existing source corridor group. `physicalCollider:false`, `parkingPermittedVerified:false`, `sidewalkOnGroundVerified:false`.

## Before writing any code
- [x] Checked both original protected backups and their recovery documentation unchanged; read `city/GOAL.md`, Tehran skill and MAYOR-026, 3Dviz Pro Max SKILL/TWIN-WORLD/object-craft.
- [x] Read official Iranian 1399 urban road design contents and numerical excerpt from national traffic exam explanatory key; inspected PDF page image showing numeric values. Distinguish references from measured local conditions.
- [x] Inspected OSM dated source way and existing Three.js cross section. The current 3.0m residential band is too narrow for a genuinely separated two-way passing + parking + sidewalk design.
- [x] Add **one sourced road section sample** for way 92200441: two continuous clear travel envelopes, one separated parallel parking strip and both unobstructed continuous footpaths; generic parked static vehicle positions.
- [x] Add a source-tied geometric probe verifying centerline endpoints, minimum clear design widths, car-to-lane and car-to-sidewalk clearances, junction end setbacks, segment bounds, zero colliders and writer room preservation.
- [x] Record four already-known Overture roofprint candidates and their footprint direction separately from true house count, which remains unverified, avoiding the claim that four polygons are four registered houses.
- [x] Actual vendored Three.js source-only test and full public GitHub Pages CI including legacy safety passed; private→public pinned city files mirrored. Observatory contract run 42685175885 passed for cache version update.

## Two backlog tasks
1. Obtain independent legally usable actual *ROW/curb/sidewalk* surveys and municipal parcel offsets per OSM street way, then adjust profiles/clipping rather than expanding into building polygons; verify real parking permissions/signs.
2. Acquire high-precision plot/building-part/entrance identities and approved vs as-built storeys for the writer block, derive verified building count and street-facing orientation from separate parcel/entrance evidence, not Microsoft ML merged roofprints.

## Owner-room and scene invariant
Third-floor original writer room stays at source WGS84 anchor and room-parent Y 6.6; no deletion, citizen route or physical collision edits. Streets stay on source centerlines; no park border invented.

## Private implementation record
- Code: `web/writer-satarkhan-osm-corridor.js` adds `planSixthDaryanIllustrativeSection()` and a detachable section group under the already sourced OSM corridor; no source centerline coordinate, street names or town geometry ownership changed.
- Source: original OSM way 92200441 has `highway=residential`, `maxspeed=30`, NO `width` or `oneway` or parking permission tag in captured dataset. Distinct painted lane count, actual parked cars and sidewalk mapping are therefore unknown. 10.7m profile is an authored concept, **not necessarily physically feasible on a surveyed plot**.
- Code enforces 2.8m × 2 driving envelope, 2.1m one-side parking strip, both 1.5m continuous pedestrian paths, 7 × 6m bays with 15m end clearances, 5 static generic cars and ≥0.2m side clearance. All render parts non-colliding; traffic/citizen routes not modified.
- Full official vendored Three.js execution of source-only scene passed: nine root groups, 46 finite-bound render objects, four original Overture source footprints, zero real traffic cars, original writer room at Y 6.6 preserved. Independent OSM polygon interior sample shows no overlap of the conceptual Sixth Daryan ribbon with FOUR currently known Overture roofprint candidates; unrecorded property collisions are not excluded.
- Separate `city/buildings/writer-block-orientation-audit.json` records 4 ML polygon axis azimuths (165.8°, 76.9°, 76.1°, 78.8°) with actual house/unit count and entry facing UNKNOWN. Do not convert these into four individual houses.
- Added standalone Node probe `tests/tehran_sixth_daryan_street_section_probe.mjs`; extended corridor existing source test for 10 renderables. Added private MAYOR CI verification. Await public test and Pages conclusion.
- Browser screenshots and actual FPS, cadastral right-of-way and city as-built building counts NOT obtained.

## Verified publication
- GitHub Pages run: https://github.com/iAlirezaaa/the-writer-live/actions/runs/42685813611
- Published code SHA: `62316f6897efd9610227d92554a074b18b77108d`.
- `Prepare public site with correct vehicle imports`, artifact upload and `actions/deploy-pages@v4` concluded **success**.
- Source-only/road/citizen/author geometry regression suite passed; `tests/tehran_sixth_daryan_street_section_probe.mjs` and `tests/tehran_building_orientation_source_audit_probe.mjs` were included.
- Dated OSM source remains unchanged. There is NO verified measured 10.7m curb-to-curb ROW, NO verified parking permit, NO exact count of houses/units/floor frontages; study photos, browser snapshots and FPS still not captured.
