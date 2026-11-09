# MAYOR-028 — Acquire real Tehran writer-block streets and building footprints
Created: 2026-11-09
Status: FIRST GIS BASELINE ACQUIRED AND ARCHIVED, city runtime unchanged; 3D preview and physical reconstruction pending.

## Preflight
- Preserved private snapshot branch backup/writer-block-pre-tehran-rebuild-2026-11-09 at cfdac995b6e070d472627b484c93d8fbf5f6ed2b.
- Preserved public snapshot branch backup/writer-block-pre-tehran-rebuild-2026-11-09 at ececf9ffc041b1666b0425f4f1746d162b9dcf67.
- Home anchor WGS84 35.715361987616696, 51.3642455031707, existing cityLocalToGeo/geoToCityLocal in web/urban-plan.js. Existing road meshes are fictional.
- 3Dviz Pro Max is vendored at cognition/skills/3dviz-pro-max/; read SKILL.md + TWIN-WORLD.md for later per-prop modeling.

## First measurable increment
Create a reproducible **source-backed survey pipeline** that fetches OSM ways/building features around the existing home anchor, retains source IDs and ODbL attribution, validates coordinate conversion and detects whether the home belongs to a bounded road block. Export limited, static, auditable GIS artifacts for later modeling, not new street meshes. Keep source and test dependency-free where practical. Do not infer exact building heights from the lack of height tags.

## Guardrails
- Read-only OSM API/Overpass query, small bounded neighborhood; no Google imagery scraping. No proprietary map data persisted.
- Do not change web/town.js, citizens, car routes, author/publisher, other parts outside city.
- Do not call procedurally placed buildings an accurate Google Maps copy; only an independently licensed, verifiable OSM baseline.
- Run offline tests and a small GitHub Actions acquisition; if live fetch is unavailable, report blocker rather than invent road names, block edges or footprint measurements.
- Source first in private; only tested city/survey docs/scripts to public.

## Backlog ideas
1. **Cadastral confidence overlay:** compare OSM geometry vs legally usable local survey and approved photographs, show deviations/unknown heights.
2. **3Dviz pilot prop:** remodel one documented, actually existing street fixture inside the verified writer block, with silhouette/support/LOD checks before/after.

## Verification and outcome (2026-11-09)
- Both pre-rebuild backup branches confirmed from GitHub with exact snapshot commits in preflight.
- Implemented deterministic `city/survey/writer-block-survey.mjs` (WGS84↔local), `acquire-writer-block.mjs` (bounded official OSM JSON / fallback), `city/tests/writer-block-survey.test.mjs` and a dedicated GitHub Actions survey workflow. Added `city/survey/README.md`.
- Public GitHub Actions [42592983509](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42592983509) **SUCCEEDED**: six Node tests passed, 0 failed; official OSM JSON returned 47 road ways and 7 tagged building footprints around the writer-home anchor. No trustworthy heights were present. 26 source ways span beyond the bounded query window.
- Derived a map-sourced containing road-centerline face with **five distinct vertices, four way IDs and about 12,265 m²**. It remains `OSM_CENTERLINE_CANDIDATE`, not a measured curb line or certified cadastral block boundary.
- Captured original source URL, response acquisition time, ODbL attribution and OSM IDs in `city/survey/output/writer-block-survey.json`. Snapshot Git blob source parity with the public archive must be checked after mirroring.
- Initial Overpass-only public workflow failed because both services timed out at 44 s; official OSM API fallback succeeded in subsequent CI.
- Private GitHub Actions source survey workflow failed; private job logs were not retrievable. Public verified survey output was copied to the private canonical repository without changing outside-city data.
- **No runtime town geometry, road mesh, cars, citizen paths, author or publisher systems were edited**. Existing layout/ground/accessibility/performance probes are not claimed as executed for this documentation/survey increment. Public Pages deployment of the existing scene is a separate status, not proven by the survey workflow.
- 3Dviz Pro Max evaluated: pre-vendored asset kits are rural/stylized and unsuitable as an exact model of modern Tehran without photographs. Next phase is an isolated Three.js comparison preview and one verified street fixture pilot, only after source corroboration.

## Two next city ideas
1. OSM alignment error dashboard — show existing city roads versus sourced road-centerline geometry with per-segment offset/uncertainty and preserved original IDs.
2. Evidence-gated 3Dviz street prop pilot — reconstruct a confirmed real fixture in the first block with measured dimensions, contact/LOD tests and street-level/close-up day/night screenshot comparison.

