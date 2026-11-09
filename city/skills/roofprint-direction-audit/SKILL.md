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
