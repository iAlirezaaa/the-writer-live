---
name: roofprint-direction-audit
description: Compute source-aligned planar roofprint boundary bearings without inventing facade directions or separate house counts.
---

# Roofprint orientation and street-facing evidence — Tehran writer block

## Use
After reading the canonical city/skills/tehran-writer-block/SKILL.md, MAYOR-026 and vendored 3Dviz Pro Max SKILL/TWIN-WORLD, use this skill when asked to align individual buildings to licensed Tehran source geometry.

## Existing Overture evidence and 3Dviz reference
- Overture / Microsoft ML Buildings, 2026-11-09 capture, ODbL-1.0; the release reference and positional accuracy remain uncertain. Source: `city/survey/output/writer-block-overture-buildings.json`.
- Relevant 3Dviz recipe: `cognition/skills/3dviz-pro-max/data/recipes/citygml-stable-id-scenario-diff.json`. Retain stable source feature identity, coordinate axes and captured epoch; do not infer labels or building semantics from meshes.
- For passage/parking, use `data/recipes/accessible-clearance-study.json`: a swept geometric collision is not legal accessibility certification. A width standard is not a measured site dimension.

## Procedure
Run `node city/survey/audit-writer-block-roofprint-axes.mjs`, then `node --test city/tests/roofprint-axis-audit.test.mjs`. The report is `city/buildings/roofprint-axis-audit.json` with four candidate source IDs, polygon area checks, longest-edge indices/lengths and undirected [0,180)-degree axis of the longest individual straight polygon edge (angle from +X east clockwise toward +Z south).

An ML polygon can represent many real structures. **Four roofprint candidates ≠ four buildings or four houses.** The edge bearing is a roofprint geometry fact; it **cannot** determine the facing direction of a real door, shop, balcony or facade, nor the legal division of plots. Floor count, unit count and number of houses are UNKNOWN until independently licensed evidence.

## Street sections and safe construction
Classify street candidates using OSM way IDs and road-centered coordinates, not imagined curb lines. Separate minimum design widths from measured widths; for the 1399 Iranian urban-street design framework, use the applicable street class and the primary regulation before specifying one/two-way travel, accessible clear walkway, parking, setbacks, crossings and corner radii. If actual road/sidewalk/parking width evidence is unavailable, record null; never silently subtract proxy sidewalks or parking from the public road.

## Future 3D change gate
- Keep world.js writer interior intact and source-only production default.
- Check both frozen backup refs before changing any mesh.
- Confirm room/no-overlap, road clearance, accessible footpaths, collision envelopes and height/ground contact using existing tests; screenshot aerial and street, daytime and night-time if available.
- No public geometry or asset pins without runtime QA and verified source. A read-only audit may be mirrored separately.

## MAYOR-055 — Source-direction versus closed-ring direction (2026-11-10)
An OSM road-bounded polygon ring is a geometric boundary, not a one-way travel graph.
Its path direction is reversed relative to the original ordered OSM way nodes on
`osm:way:481657106` (پنجم دریان نو) and `osm:way:36697711` (خلیل میکائیلی).
When instanced static vehicle illustrations are aligned to one-way traffic, reuse
`WRITER_BLOCK_OSM_REGULATIONS` from `web/writer-block-road-regulations.js` and
the source way start/end orientation. Never copy a screen-space angle from a
boundary ring into traffic semantics. If `oneway=no` or missing, do not claim
any authoritative driving direction.

The current `web/writer-block-illustrative-context.js` only applies the sourced
one-way direction to **display heading**, not to parking location, lawfulness,
curbs, measured streets, road widths, traffic plans or vehicle/citizen routes.
Place the entire car body, cab, lamps and wheels under the **same world heading**,
using existing Three.js `InstancedMesh` geometry and materials. A directional
proxy is not a locally observed parking space. Count any parked cars only as
*illustrative instances*, not actual parking capacity.

Before release, assert car-center positions and number of instances unchanged,
OSM-tagged one-way facing correct, and current source-only/legacy scene tests
not regressed. Check actual OSM evidence vintage, display ownership, pinned
public assets and daytime/nighttime imagery when capture is available. The
3Dviz `accessible-clearance-study` recipe is a **geometric envelope technique**,
not Iranian urban-code or parking permit certification.

## MAYOR-056 — Curbside parked vehicle geometry without false street certification
When displaying illustrative parked cars inside a road-centerline candidate block, compute the *visible body footprint* as an oriented rectangle and verify the four corners plus each edge midpoint against the source polygon, protected writer room and Overture roofprints. Checking only the car's centerpoint does not detect a bumper or door overlapping a building or pavement band. Reuse the same heading for body/windows/wheels and preserve the existing single Three.js `InstancedMesh` per part class.

The source-only street module uses an UNMEASURED 3.05m in-block half-road offset, a symbolic curb and a symbolic 2.02m sidewalk. With the existing 1.60m vehicle body, the updated 0.70 lateral fraction (formerly 0.58) leaves a modeled 0.115m gap between body and proxy curb (formerly 0.481m), and the geometric clearance from *road centerline* to closest body edge increases to 1.335m (formerly 0.969m). None of these dimensions describe real Tehran street capacity, legally permitted parking, loading/door clearance or emergency access. Actual sidewalk width, curb location and oneway parking-side law require independently verified measurements and local review. This is a small **reversible, nonphysical scene-layout improvement**.

Read `cognition/skills/3dviz-pro-max/references/physical-interaction.md` and `data/recipes/accessible-clearance-study.json` for volume/sweep checks, then run actual `tests/tehran_source_only_rebuild_probe.mjs` and public pinned CI before release. Never claim screenshot or real-world compatibility unless actually verified.
