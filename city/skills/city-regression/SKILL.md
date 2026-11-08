---
name: city-regression
description: Enforce physical 3D tests, project-safe deployment and visual QA for urban changes.
---
# City acceptance skill

- Run `node tests/urban_plan_probe.mjs .` (layout and progression).
- Run `node tests/road_topology_probe.mjs .` (single continuous asphalt, road centerline coverage and no overlap).
- Run `node tests/city_districts_probe.mjs .` (real Three.js ground levels, access, venues, lighting).
- Run `node tests/writer_house_consistency_probe.mjs .` (unified stage and window/entry coordinates).
- On live artifact, run `node --experimental-vm-modules tests/town_scene_probe.mjs _site layout < _site/snapshot/town.json`, then `paths` and `wiring` tests.
- Confirm pinned `.github/city-assets/` and `.github/citizens-assets/` are copied into the Pages build, including `urban-plan.js`.
- Preserve published story IDs, user comments, author memories, 15 observer tabs, 10 camera views, day/night and Persian date handling.
- Latest GitHub Actions deployment must succeed. Failure is a blocker. Prior successful runs are not proof a newer revision passed.
- Document separately: source sync, tests passed, and any visual inspections **not yet completed**.

## Iteration 002: pedestrian clearance audit (documentation-only)
- For each civic entrance (school, police, screenplay office, film studio), capture: parcel ID, road-graph node, door world position, landing elevation, sidewalk width, nearest crossing, and emergency vehicle access.
- Check continuous walkable clearance >= 1.5 scene units, no sign/foliage collision and no unsupported entrance; test daytime and nighttime visibility separately.
- Compare actual private `web/` source against public pinned assets before copying; never mirror author data or entire private trees.
- A documented checklist is not a passing geometry test. Run existing Node probes and inspect screenshots before marking any geometry or public runtime change verified.

## Iteration 003: evidence-based release gate
Record each municipal change with the following fields, even if no runtime code changed:

| Evidence | Required value |
| --- | --- |
| Scope | Exact `city/` files and any runtime assets touched; exclude author/publisher/citizen data |
| Private baseline | Commit SHA before modification and resulting private commit SHA |
| Public mirror | Explicit source-to-pin file mapping and resulting public commit SHA, or `not applicable` |
| Geometry | Road graph continuity; building AABB overlaps; foundation and entrance Y vs ground; 1.5-unit pedestrian clearance; emergency and studio access |
| Performance | Draw calls, instance counts and frame-time comparison when runtime assets change |
| Probe execution | Command, exit code, revision and diagnostic excerpt for each existing probe; `NOT RUN` is not `PASS` |
| Visual QA | Street-level, aerial, day, night, mobile; explicitly mark `NOT INSPECTED` |
| Deployment | Pages workflow URL and conclusion for the **new** public revision, or `NOT VERIFIED` |

Release rule: documentation-only edits may be mirrored without claiming runtime verification. Any runtime geometry or behavior edit must remain unpublished if probe execution, pinned-file equivalence, access/collision checks, or deployment prerequisites cannot be confirmed. Never infer success from a previous green workflow.

## Iteration 004: immutable pin parity audit
Before a city runtime release, compare Git blob SHA (not filename, timestamp, or previous workflow status) for each declared mapping:

| Private source | Public pin |
| --- | --- |
| `web/urban-plan.js` | `.github/city-assets/urban-plan.js` |
| `web/road-surface.js` | `.github/city-assets/road-surface.js` |
| `web/town-districts.js` | `.github/city-assets/town-districts.js` |
| `web/city-growth.js` | `.github/city-assets/city-growth.js` |
| `web/town.js` | `.github/citizens-assets/town.js` |
| `web/world.js` | `.github/citizens-assets/world.js` |

Only compare `town.js` and `world.js`; do not modify citizen logic. A matched blob proves source parity only, **not** runtime tests, scene correctness, browser visual QA, or successful Pages deployment. Record all six SHAs and both revisions, and re-check after any new source commit. For geometry edits require the Node probes, foundation/collision/clearance checks, day/night screenshots, and a new green deployment before claiming release acceptance. Missing tests or missing files are blockers, never implicit passes.
