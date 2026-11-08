---
name: city-regression
description: Enforce physical 3D tests, project-safe deployment and visual QA for urban changes.
---
# City acceptance skill

- Run `node tests/urban_plan_probe.mjs .` (layout and progression).
- Run `node tests/city_districts_probe.mjs .` (real Three.js ground levels, access, venues, lighting).
- Run `node tests/writer_house_consistency_probe.mjs .` (unified stage and window/entry coordinates).
- On live artifact, run `node --experimental-vm-modules tests/town_scene_probe.mjs _site layout < _site/snapshot/town.json`, then `paths` and `wiring` tests.
- Confirm pinned `.github/city-assets/` and `.github/citizens-assets/` are copied into the Pages build, including `urban-plan.js`.
- Preserve published story IDs, user comments, author memories, 15 observer tabs, 10 camera views, day/night and Persian date handling.
- Latest GitHub Actions deployment must succeed. Failure is a blocker. Prior successful runs are not proof a newer revision passed.
- Document separately: source sync, tests passed, and any visual inspections **not yet completed**.
