# Writer's block — real Tehran baseline (MAYOR-028)

**A source-backed start to the digital twin, NOT a one-to-one rebuilt neighborhood yet.** Existing `web/town.js`, `ROAD_SEGMENTS`, car paths, writer room and citizen routes were deliberately not modified.

## Spatial reference and verified acquisition

- Home anchor: **WGS84 35.715361987616696 N, 51.3642455031707 E**, `web/urban-plan.js` `TEHRAN_GEO_ORIGIN`.
- Metric scene: local **+X east, +Z south**, approximated with local tangent-plane degree scales for this block only.
- Dataset: **© OpenStreetMap contributors**, Open Database License (ODbL 1.0). Source: official OSM API JSON `GET /api/0.6/map.json`, read-only. Attribution and source URL are in every snapshot.
- Acquisition date: **2026-11-09**; query rectangle from about 230 m in each direction, not the physical block boundary. Stored file: `city/survey/output/writer-block-survey.json`.
- Source capture: https://api.openstreetmap.org/api/0.6/map.json?bbox=51.36170369,35.71328905,51.36678731,35.71743492
- Counts in verified capture: **47 mapped road ways**, **7 tagged building footprint ways**, **7/7 building heights missing**, 26 OSM ways cross the *survey query rectangle*. OSM incompleteness is not proof that other buildings do not exist.
- A **map-derived enclosed face** containing the writer-home point was found from connected road centerlines: **approximately 12,265 m²**, five distinct vertices and four supporting OSM way IDs. The result is labelled **`OSM_CENTERLINE_CANDIDATE`**.
- Supporting roads (OSM source IDs, names as the map currently labels them):
  - `osm:way:36697711`: **خلیل میکائیلی** (north, around 11 m from anchor)
  - `osm:way:4292858`: **فلاحت پور** (east)
  - `osm:way:481657106`: **پنجم دریان‌ نو** (south)
  - `osm:way:36697708`: **هشتم دریان‌ نو** (west)

The derived polygon uses **road centerline** geometry, NOT survey-grade street edges, sidewalk boundaries, cadastral property lines, construction approvals or Google Maps imagery. The location of the writer's home was supplied by the project owner, and **is not asserted to be a mapped real residential building**. Roofs, building levels, facade materials, height and elevation remain **unknown** unless separately documented.

## Scripts / repeatable test

```bash
node --test city/tests/writer-block-survey.test.mjs
node city/survey/acquire-writer-block.mjs --radius 230 --out city/survey/output/writer-block-survey.json
```

The read-only CLI tries the official OSM map JSON API and then bounded Overpass fallback servers, with timeouts and no invented replacement data. The CI workflow `.github/workflows/city-writer-block-survey.yml` runs tests, downloads the source, verifies attribution/candidate origin, uploads the output as an artifact, and stores the snapshot as a separate city-survey commit. Avoid frequent automated polling of OSM public servers.

Verified public CI run: https://github.com/iAlirezaaa/the-writer-live/actions/runs/42592983509 — **6 tests passed, 0 failed; OSM source acquisition passed.** The earlier Overpass-only run failed because both public endpoints timed out. Private Actions retrieval previously failed with unavailable job logs; the private/source survey JSON was synchronized from the successfully verified public source, not claimed as a passing private CI run.

## 3Dviz Pro Max and next safe reconstruction steps

- Existing vendored skill: `cognition/skills/3dviz-pro-max/SKILL.md` and `TWIN-WORLD.md`. Reviewed its `blueprint-lantern-post`, `blueprint-signboard` and `blueprint-timber-cottage` records. **Do not import village/timber/tavern-style kits as accurate Tehran objects** without ground-truth visual references; use their reusable assembly, trim, joins and contact/LOD methods for real objects when photographed or measured.
- First visual stage: construct a **separate, clearly labelled OSM survey preview** of the five-segment block boundary, source road centerlines and available footprint outlines in Three.js. Avoid guessed extruded heights. Validate true orientation and building-road clearance before replacing the fictional live roads.
- Next: source legally reusable street-level views, measured sidewalk widths, roof heights/elevations and actual frontage assets. Record corresponding coordinates and attribution; use one 3Dviz prop pilot and screenshot tests before migration.
- Keep both recovery branches `backup/writer-block-pre-tehran-rebuild-2026-11-09` immutable; do not alter narrative, publisher logic, citizen routines or car trajectories as part of this survey.
