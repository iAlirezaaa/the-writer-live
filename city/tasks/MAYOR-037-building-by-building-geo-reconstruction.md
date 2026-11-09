# MAYOR-037 — Geographically faithful Tehran building-by-building reconstruction
Date: 2026-11-09
Status: MODEL CREATED AND MIRRORED TO PUBLIC SOURCE; separate full Node/Three.js CI and Pages deployment verification pending.

## New top-level project objective (user directive)
Build a source-backed **digital twin of the real Tehran neighborhood**, one real map footprint at a time, making aerial topology, geometry, orientation and building placement match licensed geographic mapping as closely as the available evidence permits. This is **not** another city inspired by Tehran. Present scope remains the single OSM writer block; do not expand without separate explicit area authorization. Writer's room is never deleted or silently replaced; its local placement may move only with verified access/continuity.

## Before-edit gates
- [x] Verified private frozen backup `cfdac995b6e070d472627b484c93d8fbf5f6ed2b`, public backup `ececf9ffc041b1666b0425f4f1746d162b9dcf67`, identical recovery-manifest blob `4821f550f9228adb7ba68e188ca8ee8a10b2dd04`.
- [x] Read city/skills/tehran-writer-block/SKILL.md, MAYOR-026, 3Dviz Pro Max SKILL.md/TWIN-WORLD.md, source-provenance/historical-diorama and CityGML stable-ID recipes, existing builders, OSM source roads, Overture building survey and tests.
- [x] Overture capture `2026-11-09T12:18:12.627338+00:00` covers 4 candidate building roofprints (three outside the writer-room protection zone), ODbL-1.0; Microsoft ML-derived geometry, **zero source heights**.
- [x] Permanent hourly "شهردار شهر نویسنده" automation goal amended to explicit **building-by-building source-supported aerial fidelity** with unchanged schedule and safety contracts.

## One reversible, measurable building construction
- [x] Create `city/GOAL.md` and a per-source building register. Never split one merged Overture ML polygon into invented house lots; require higher-resolution licensed maps or survey to resolve actual building boundaries.
- [x] Choose exactly one roofprint, Overture GERS ID `3d7b8239-b1e0-48bc-8868-ae4a4d392586` (west-side candidate, 965.73 m²). Replace its anonymous translucent proxy with a distinct mapped `Three.js` building shell using the **original polygon vertices** and orientation. No assumption of its real floors, facade/roof, entrance, material or 6m illustrative height as fact.
- [x] Preserve remaining source roofprints as 2 anonymous inspection proxies + 1 writer-room-protected outline. No citizen route/physics/traffic/house changes.
- [x] Real Three.js source alignment test added (runner status pending): polygon area and vertex projection, orientation, strict in-block membership, no room intersection, no NaNs, no physics, no fake geographic height. Existing city/district/room/access/traffic probes must pass.
- [x] Mirror authored city assets/tests into pinned public source (release verification pending): and documentation from private to public pinned source, check GitHub Pages build/deploy status. No claim of browser screenshots if unperformed.

## Two new backlog ideas
1. Fetch/audit alternative **licensed high-resolution** aerial roofprint sources for each Overture cluster and record per-facade confidence; distinguish compound polygons from actual individual house plots before any subdivision.
2. Per-building visual QA ledger: north-oriented aerial before/after screenshots, footprint IoU, street setback error, source version, roof and entrance evidence, ground contact and camera LOD/draw-call budget, with a required approval gate before replacing legacy colliders.

## What is true and what is not
- Existing OSM road-boundary is a centerline candidate; paving widths are visual proxies.
- Existing Overture candidates are ML-derived building roofprints, **not legally precise parcels** or guaranteed separate structures. No provider height, floor, roof shape or street entrance evidence is available. Real-world exact-copy claims are NOT justified yet.
- Older procedural city geometry is still present; its spatial registration/physical collision is not corrected by the new map shell and must be retired only in later reversible validated steps. The writer's room must stay usable throughout.

## Actual implementation / verifiable facts
- Private code: `web/writer-block-building-01.js` (standalone model), `web/writer-block-buildings.js` (remove duplicate bulk ghost), `web/town.js` (scene integration).
- Source GERS `3d7b8239-b1e0-48bc-8868-ae4a4d392586`, original six nonclosing source vertices, calculated 965.7373205 m² against provider's 965.73 m²; no coordinate rescale or changed orientation.
- New independent material/roofline represent one map candidate only; the unmeasured 6m extrusion and flat cap are symbolic. No sourced floors or facade and no verified disaggregation into separate legal buildings.
- Runtime model provenance reports `measuredHeightMeters:null`, explicit `roomPreserved:true` and `physicalCollider:false`.
- First V8 JS constructor + source validation: 6 source vertices, area 965.7373 m², all vertices inside the OSM writer block, writer-room exclusion true. This is NOT equivalent to completed GitHub Actions/real browser screenshot.
- New real Three.js Node probe: `tests/tehran_writer_block_building_01_probe.mjs`. Updated existing `tests/tehran_writer_block_buildings_probe.mjs` and `tests/city_districts_probe.mjs`. Public Pages workflow pins `.github/city-assets/writer-block-building-01.js` and runs the new probe.
- At reporting time public GitHub Actions run https://github.com/iAlirezaaa/the-writer-live/actions/runs/42625877331 was pending; do not report success until complete. Screenshots, side-by-side aerial image comparison, live-site and device FPS remain unverified.
