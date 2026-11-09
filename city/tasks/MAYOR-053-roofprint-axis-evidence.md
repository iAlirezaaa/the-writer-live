# MAYOR-053 — Sourced roofprint edge bearings, no guessed house count
Date: 2026-11-10
Status: READ-ONLY AUDIT IMPLEMENTED; source computation PASS; no visual geometry deployed

## One bounded change
Create a repeatable, read-only audit of the **longest roofprint boundary edge** for each of the four Overture polygon candidates, using existing local-X-east/local-Z-south geometry and the documented WGS84 anchor. Report the undirected axis (modulo 180 degrees), edge length, polygon area agreement and stable source ID.

The edge axis is evidence of a source polygon's orientation, **NOT** a real facade/front door direction, an address, the number of separate houses/units/floors, a surveyed sidewalk, or road/parking width. Keep true house count unknown until lawful high-resolution evidence splits merged ML roofprints. No source-only or legacy scene geometry change.

## Source and preservation
- Input: city/survey/output/writer-block-overture-buildings.json; ODbL-1.0, Overture Maps Foundation / Microsoft ML Buildings; captured 2026-11-09, release not fully verified.
- Exact writer home WGS84: 35.715361987616696, 51.3642455031707. Local +X east, +Z south.
- Immutable backup refs and city/backups/writer-block-pre-tehran-rebuild-2026-11-09.md must be checked first.
- Do not modify writer room, citizens, roads, navigation, weather, publisher/author, runtime world, or public pinned assets.

## 3Dviz Pro Max
Read cognition/skills/3dviz-pro-max/SKILL.md, TWIN-WORLD.md and recipe.citygml-stable-id-scenario-diff. Preserve stable feature ID, CRS, epoch, source and geometry/semantics separation; future facade model is dependent on actual permitted facade photos and valid clearance proof.

## Acceptance checklist
- Every source polygon closed, has finite positive area and unique ID.
- Independently recomputed shoelace areas agree within 0.1 square meters with rounded source areas.
- Longest undirected edge bearing is in [0,180) degrees, measured clockwise in local X/Z from east towards south.
- Number of Overture roofprints remains four; separate building count MUST remain null.
- Node tests include corruption/degenerate rings and actual existing data check.
- No runtime geometry changes; 3D/legacy CI, screenshots and Pages deployment are not asserted.

## Urban-street notes
The Iranian 1399 urban street design regulation provides **design requirements, not local measured road widths**. Existing 3.05m centerline half-road, 2.02m sidewalk and illustrative 10.7m profile are unverified layout proxies; parking supply, passable width with parked vehicles, sidewalk continuity, one-way permissions and curb extents are explicitly unknown.

## Two new backlog ideas
1. Review individual ML roofprint complexes against a separately licensed and more detailed roofline/parcel dataset before splitting one polygon into separately addressed homes; store source-to-source confidence and date.
2. Evidence-tag facade/entrance bearings by licensed street-level photographs or measured entrance nodes and compare with OSM roadway topology; never derive an entrance from the roof edge.

## Outcome / verification
Private additions:
- city/survey/audit-writer-block-roofprint-axes.mjs (deterministic Node report generator)
- city/tests/roofprint-axis-audit.test.mjs (repeatable assertions, including corruption cases)
- city/buildings/roofprint-axis-audit.json (four source footprint axes and unknown semantics)
- city/skills/roofprint-direction-audit/SKILL.md (3Dviz stable-ID and clearance guidance)

Validation actually executed: JavaScript recomputation using live GitHub source and committed report: PASS for all four roofprints; tested original source IDs, closed finite rings, area delta <0.1 sq m, longest-edge identity and length, axial orientation within [0,180), and null real-house/entrance data. This does **not** prove that Node test suite or full Three.js/legacy tests ran: those remain NOT RUN, as do visual capture and live Pages checks.

The four longest-edge axes clockwise from +X east toward +Z south are 75.793°, 166.860°, 166.145°, 168.828°. They are derived roofprint boundary geometry, NOT facade bearings. No road widths, parking, curbs, physical navigation, city scene, writers or citizens changed.

Next gate: run `node --test city/tests/roofprint-axis-audit.test.mjs` in repo CI, verify asset parity before any physical geometry change. Public mirror status is tracked separately; do not claim deployment.
