# MAYOR-031 — Audit writer-block centerline evidence before street furniture modeling
Date: 2026-11-09
Status: TODO / documentation-only; no geometry approved.

## Independent TODO (created before any subsequent change)
- [ ] Verify immutable recovery refs against recorded private cfdac995b6e070d472627b484c93d8fbf5f6ed2b and public ececf9ffc041b1666b0425f4f1746d162b9dcf67. Manifest files were read in both repositories; branch-ref lookup via file endpoint returned 404, therefore branch existence remains UNVERIFIED in this run.
- [ ] Cross-check OSM road-centerline candidate way IDs 36697711, 4292858, 481657106, 36697708 with the dated 2026-11-09 snapshot and topology tests.
- [ ] Acquire permitted street-level reference and measured dimensions for ONE existing sidewalk fixture within the candidate block; document camera location, provenance, rights, scale, sidewalk clearance, foot contact and confidence.
- [ ] Apply 3Dviz Pro Max object workflow: silhouette -> supports/joins -> material response -> LOD and Three.js budget, without copying rural kit style.
- [ ] Only after geometry gates and actual before/after day/night, overhead and street captures, consider a one-object change; do not modify writer/citizen/publisher state.

## Evidence already inspected
- Read city/skills/tehran-writer-block/SKILL.md, MAYOR-026, 3dviz-pro-max/SKILL.md and TWIN-WORLD.md, survey README and both backup manifests.
- OSM data are ODbL 1.0; 12,265 m² is a candidate road-centerline face, not a surveyed parcel. Building heights and curb widths are unknown.
- Catalog kit source not verified this run; therefore no model reuse or physical change.
- Tests NOT RUN; captures NOT TAKEN; deployment NOT VERIFIED.

## Two backlog ideas
1. **Road-edge evidence ledger:** per OSM way, maintain centerline versus curb confidence, measured width provenance, dated junction photo references and license flags; block extrusion when absent.
2. **Street-fixture clearance harness:** non-rendering test that checks an individually surveyed prop's support footprint, walkway free width, road collision and ground height before any screenshot approval.
