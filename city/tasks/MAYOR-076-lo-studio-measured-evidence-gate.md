# MAYOR-076 — Lo Studio / Il Nuovo architectural evidence gate

Status: TODO registered before code — 2026-11-10 (Europe/Rome).
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
