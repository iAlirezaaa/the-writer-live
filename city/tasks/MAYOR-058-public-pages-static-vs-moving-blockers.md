# MAYOR-058 — Repair public Pages legacy static-route false collision (city-only)
Date: 2026-11-10
Status: TODO REGISTERED BEFORE TEST SYNC; execution pending.

## Failure reproduction and root-cause evidence
- Public Pages: https://github.com/iAlirezaaa/the-writer-live/actions/runs/42719740286 — prepare/build fails at `TOWN-SCENE-FAIL paths`, local `X=0, Z=7.3`.
- Public `tests/town_scene_probe.mjs` version 3eee187... classifies **all** legacy visible BoxGeometry at pedestrian height as static blockers, including moving car bodies. This conflates instantaneous moving vehicle positions with permanent urban infrastructure.
- Private `tests/town_scene_probe.mjs` 9120944... already contains stricter static-vs-dynamic classifier: traverse ancestors; only exclude descendants of explicitly named `town-car-*` with `userData.vehicleType`. `web/town-cars.js` owns and tags those moving vehicles. The source-only live town remains default and is unaffected.
- Safety checks for moving cars, yielding and crossing pedestrians remain in `tests/city_traffic_probe.mjs`, never bypass or remove them.
- Immutable backup branch preflight: private cfdac995b6e070d472627b484c93d8fbf5f6ed2b and public ececf9ffc041b1666b0425f4f1746d162b9dcf67 verified via Git refs on 2026-11-10; backup manifest still present.

## Single minimal approved scope
1. In PRIVATE, strengthen the existing narrow classifier by asserting that the known vehicle bodies are actually found (avoid silent bypass if their tagged ownership disappears). Do not edit citizens, traffic/road geometry, world, writer, publisher, data or housing.
2. Mirror exact verified test file to PUBLIC. Confirm public test source SHA matches private.
3. Require public Pages job `town_scene_probe paths` and `city_traffic_probe` to PASS, plus source-only and room probes. If other real collisions emerge, diagnose rather than suppress them; do not report deploy success without Actions evidence.
4. This is a test ownership/classification repair, NOT a new Tehran geometry feature and NOT a measured traffic-safety certification. Browser screenshots not required for test-only fix but must be reported as not captured.

## 3Dviz Pro Max review
Read `cognition/skills/3dviz-pro-max/SKILL.md`, `TWIN-WORLD.md`, and `data/recipes/closed-lane-car-following.json`. Preserve authoritative car identity, independent car-pedestrian physical/behavior contract, vehicle group bounds and spatial ownership. Recipe is illustrative IDM ring-road advice, not an assertion about Tehran calibration. No kit or render asset imported.

## Two independent backlog ideas
1. Create a dedicated `staticObstacle` metadata contract on scene components and assert against the expected collider inventory instead of using only inferred BoxGeometry ownership; retain independent moving vehicle safety checks.
2. Add CI reproducibility matrix for legacy test and source-only test with a frozen clock and recorded collider ID/BBox on every failure, while preserving nonphysical map-preview layers.

## Verification and commit evidence
PENDING. Append exact Git commit links, public Actions test and Pages job outcomes; distinguish any partial or failed outcomes.

## Confirmed results — 2026-11-10
**Fix implemented and publicly deployed.** The private `tests/town_scene_probe.mjs` now asserts a nonempty fleet of at least 12 identifiable, tagged moving vehicle boxes before filtering only those boxes out of the **static** footpath obstruction inventory. Static obstructions remain enforced. Neither `web/citizens.js`, `web/town-cars.js`, `web/town.js`, `web/world.js`, geometry, physical paths, identity, publishing nor writer room was modified.

- Private test commit: https://github.com/iAlirezaaa/the-writer/commit/6315cafa41e9e183ca4a3b33003a5519afb42076
- Public test mirror commit: https://github.com/iAlirezaaa/the-writer-live/commit/4dfb027bd6622ac2d710634377bffe39ddec9b70
- Verified exact test file content parity: Git blob `2947768b89faf4f8b3701cc0420499c3f1034892` in both repositories.
- Public GitHub Actions + Pages: https://github.com/iAlirezaaa/the-writer-live/actions/runs/42722376545 — **conclusion SUCCESS**. The `Prepare public site with correct vehicle imports`, upload Pages artifact, and `deploy-pages` steps all succeeded.
- The public job logs include `TOWN-SCENE-OK layout`, `TOWN-SCENE-OK paths`, `TOWN-SCENE-OK wiring`, `TEHRAN-SOURCE-ONLY-REBUILD-OK` and `CITY-TRAFFIC-OK`. These are actual executed tests. On the prior failing build `42719740286`, the moving car mesh was erroneously counted as a static blocker. An earlier successful run `42720624927` under the old test points to non-deterministic, clock-position-dependent failures.
- Source-only remains the live default. No legacy route changed, and city backups were not touched.
- No browser still captures, measured FPS, or real Tehran mapping changes occurred in MAYOR-058. Live Pages deploy step succeeded, but an independent end-user visual/browser visit was not performed. This addresses a CI false collision, not citywide physical correctness.
- Private Actions CI was not separately certified in this run; public Actions used the exact mirrored code.
- Two backlog ideas recorded above remain unimplemented; no additional geometry deployment requested.

