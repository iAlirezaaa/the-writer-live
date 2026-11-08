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
