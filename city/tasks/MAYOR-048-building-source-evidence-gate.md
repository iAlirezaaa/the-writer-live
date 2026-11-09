# MAYOR-048 — Licensed building evidence gate (documentation-only)
Date: 2026-11-09
Status: TODO / evidence gap recorded; no geometry changed.

## Preflight
- Verified both immutable backup branch heads equal the recorded private cfdac995b6e070d472627b484c93d8fbf5f6ed2b and public ececf9ffc041b1666b0425f4f1746d162b9dcf67 via GitHub compare.
- Read city/GOAL.md, MAYOR-026, city/skills/tehran-writer-block/SKILL.md, 3dviz-pro-max/SKILL.md and TWIN-WORLD.md, manifest.json and backup manifest.
- Catalog recipe/kit not selected: no new mesh is authorized without independently verified building attributes.

## One scoped task
Find a licensed, reproducible source of building:levels / entrance / shop POIs for the four recorded Overture polygons within the approved writer block. Record feature IDs, OSM tags, extraction time, license, polygon correspondence and positional uncertainty before making any new facade, entrance, floor or shop geometry. Do not split ML polygons or infer actual floors from 3m scale guides and 6m display proxies. No changes to the room, routes, town builder, weather, time, or public scene.

## 3Dviz Pro Max review contract
When a verified building is selected, evaluate footprint silhouette, wall/roof joins, ground contact, material scale, mesh bounds, shared geometry/LOD and Three.js draw calls. Capture real overhead/street/day/night comparisons before declaring visual approval. Current status: not modeled or captured.

## Verification and release
Documentation-only change. Runtime tests and screenshots NOT RUN; no runtime deployment claimed. Existing legacy-mode citizen route obstruction remains a release blocker and must not be bypassed.

## Two new backlog ideas
1. Add a machine-readable OSM-to-Overture correspondence report with feature-level confidence and explicit unmatched/ambiguous statuses.
2. Add a source-evidence expiry audit that flags any shop/entrance/floor metadata lacking a dated source or license before mesh generation.
