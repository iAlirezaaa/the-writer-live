# MAYOR-076 — Lo Studio / Il Nuovo architectural evidence gate

Status: partial — machine-verifiable evidence implemented; measured geometry and browser release remain pending (2026-11-10).
Active city: Civita di Bagnoregio, Italy. This task is one metadata/validation improvement, not a new construction project.

## Evidence from original sources
- Civita Institute, Sept 2014 property reference plan plate 2: https://www.civitainstitute.org/files/1128.pdf — **D = Lo Studio; E = Il Nuovo (above Lo Studio and Alma)**, plan explicitly **Not to Scale**, not a cadastral or dimensional survey.
- Civita Institute Lo Studio: https://www.civitainstitute.org/496/lo-studio.html — two storeys; tufa, peperino, chestnut and clay; a second-level connecting door to Il Nuovo.
- Civita Institute Il Nuovo: https://www.civitainstitute.org/498/2024/09/il-nuovo.html — independently confirms upper-storey door connection.
- David M. Boyd architectural study: https://www.civitainstitute.org/files/1156.pdf — previously blocked opening reinstated into Il Nuovo foyer; source describes renovation, not georeferenced door coordinates.
- OSM way/464102189 is a validated *candidate footprint only*, NOT certified cadastral lot D.

## Scope and acceptance
Add machine-readable provenance to the writer exterior scene evidence: D/E names; verified existence of upstairs link, **not** a modeled traversable door; unknown facade width, real entrance geometry and datum-based threshold height remain null, never taken from illustrative meshes or coarse Mapzen DEM. Extend an existing CI-covered writer-location test to assert documented-vs-surveyed distinction and no replacement of original writer-room geometry. NO fabricated doorway, construction, collision, parcel reassignment, Tehran changes, citizen/author core changes, or pinned Pages changes unless actual runtime code requires them.

## Execution record
- [ ] Register TODO privately before editing any implementation.
- [ ] Update only protected architectural evidence + existing location regression in private.
- [ ] Run feasible automated validation; distinguish tests unavailable without full browser/asset runtime.
- [ ] Mirror reviewed city-only changes to public, verify SHA/CI/Pages status.
- [ ] Add two novel backlog proposals and technical learning to city skill.

## Outcome — 2026-11-10, observed only
- [x] Task registered first at private commit `992a2800218ba7b17fd9f1cd19f4f58763005fa8`.
- [x] Private implementation `web/civita-writer-house.js` preserved every builder/mesh operation and added Institute D/E property and upper-door existence evidence with explicit nulls for unpublished dimensions.
- [x] Private existing regression `tests/civita_writer_location_probe.mjs` extended with historical/surveyed/collision distinction, no unverified upstairs corridor.
- [x] Four touched files mirrored byte-for-byte to public; repository blob SHAs matched.
- [x] Executed 14 checks in isolated JavaScript V8 against the **actual private GitHub module source** (blob `8d41bd489ff9ea9e0c07a141f3fe7ac22ef450d8`) with a lightweight Three.js interface mock: PASS, 37 generated mesh nodes, evidence attached, no invented Il Nuovo passage; negative room-clearance input rejected. This is **NOT a real Three.js GPU render or a browser screenshot**.
- [ ] Current public Pages deploy/CI success: NOT VERIFIED. The direct new Pages run `42820787348` was cancelled by concurrency. The subsequent run `42820804100` on a newer commit failed **before** reaching the writer-location test: `prepare_observer_deploy.py`: `Observatory validation failed: reader cache`. Out of scope: do not modify readers/observer to force a city-only pass.
- [ ] Pixel/WebGL validation in a real browser: NOT DONE. Container DNS cannot resolve the Pages host, and Chromium navigation to even a local data URL is blocked by administrator. No screenshot claim.
- [ ] Cadastral lot D verification, exact facade/door measurements, second-level door geometry and surveyed threshold elevation: NOT DONE without authorized cadastral/survey/plan measurements. The historical connection itself IS documented.

No authorized changes to Tehran history, actual writer room, author identity, text, publisher, citizens or road paths. No pinned Pages copy of `civita-writer-house.js` exists; the workflow copies `web/` into `_site/web/`, then pins only `objects.js` and `town.js`. No protected pinned asset was modified.

Final state: documentation and release gate implemented; exact geometry and final live visual proof pending authorized data and a clean CI run.
