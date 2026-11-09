---
name: city-mayor-release-gate
description: Safe, auditable city-only planning and private-to-live synchronization for The Writer.
---
# Mayor release gate

1. **Preflight:** inspect the latest private city sources, the public pinned deploy copies, and current TODO. Add a uniquely identified TODO **before** editing any city code. Never touch the writer, publisher, private data, story, resident motion routes, or unrelated application modules.
2. **Road-first:** use `ROAD_SEGMENTS` and the shared road-surface geometry. New parcels must have real ground support, positive building clearance, paved entrance access, emergency/vehicle access and no crossing obstructions.
3. **Capacity:** distinguish planned from proven housing. Document per-building units, assumed people/unit and total; require a minimum of 400 only when physical capacity, access and utilities are defensible. Never treat 400 rendered citizens as a performance requirement.
4. **Performance:** prefer cached geometries/materials, `InstancedMesh`, shared licensed animation clips, LOD and visibility culling. Record before/after draw calls and frame times for runtime changes. Do not fetch arbitrary unreviewed libraries.
5. **Deploy:** change private first; validate there. Mirror only reviewed city files to public pinned paths, not merely `web/`. Inspect the public Pages workflow's overlay order. Preserve exact module import/version expectations.
6. **Evidence:** run existing layout, district, writer-home, town scene layout/paths/wiring and public build checks. Visual day/night and street-level inspection is a separate requirement. Never report unexecuted tests as passed.
7. **Log:** mark TODO complete only for the actual finished scope; record commit links, tests, blockers and two new ideas. On failure, do not publish a geometry change.

## Verified structural findings (2026-11-08)
- `web/town.js` already has a north mountain backdrop, and uses `buildSeamlessRoadSurface`; avoid duplicate roads/mountains.
- Public `.github/workflows/pages.yml` overwrites `_site/web/town.js` from `.github/citizens-assets/town.js`, and `town-districts.js` from `.github/city-assets/town-districts.js`.
- The live build validates city layout and scene path/wiring probes; documentation edits do not constitute a runtime validation.

## Tehran environment audit addition (MAYOR-010)
- Source of truth for the municipal display: `web/tehran-environment.js`; Tehran timezone is `Asia/Tehran`, independent of browser timezone. Never change writer or citizen clocks.
- Check `tests/tehran_environment_probe.mjs` for local 20:00 night, sunrise/sunset, rain/snow, request deduplication, 15-minute caching and unavailable stale readings.
- Check public pinned `.github/city-assets/tehran-environment.js` and deployment overlay before syncing; distinguish a passing unit probe from verified live network conditions.
- Open-Meteo response is model-derived weather, not an in-situ station observation; retain attribution and confirm licensing for production usage.

## Tehran midnight boundary (MAYOR-011)
- Assert UTC 20:29 and 20:30 on 2026-11-08 correspond to Tehran 23:59 and next-day 00:00 respectively; do not use browser-local time.
- Invalidate yesterday's sunrise/sunset metadata at Tehran midnight and use explicit fallback until matching-day provider data arrives.
- Regression-only edits do not prove real-browser API access or visual rendering; require independent Pages/CI evidence before any deployment claim.

## Pinned Tehran source parity (MAYOR-012)
- Compare the **Git blob SHA** of private `web/tehran-environment.js` with both public `web/tehran-environment.js` and `.github/city-assets/tehran-environment.js`; all three must match before treating the pinned weather module as synchronized.
- Check the public Pages overlay before relying on the web-path copy; a matching SHA is a source check, not a browser execution or deployment check.
- Require separate evidence for the Node weather probe, a real browser request to the provider, Tehran local midnight/day-night display, and public Pages status. If any are unverified, record them explicitly and do not claim live conditions work.
- Do not expose API keys or add commercial usage without reviewing Open-Meteo licensing and attribution.

## Tehran freshness and outage acceptance matrix (MAYOR-013)
- Current implementation: `createTehranWeatherService` polls no more often than 15 minutes on success, retries after 75 seconds on failure, deduplicates concurrent requests, and hides weather after 45 minutes since last successful fetch or 100 minutes since provider observation. These are code-inspection findings, **not** executed assertions in this audit.
- Provider `current.time` is parsed with an explicit `+03:30` offset when missing a zone; verify the provider still returns Tehran-local timestamps and test both explicit-offset and offset-free payloads. A malformed or >90-minute-old timestamp must not be labelled live.
- Solar metadata is only accepted when `daily.time[0]` matches today's `Asia/Tehran` date. At Tehran midnight verify the previous day's sunrise/sunset is rejected and fallback remains visually consistent until fresh data arrives.
- Required test cases: successful fetch; 15-minute no-repeat; simultaneous-call deduplication; failure retry; 44/45-minute cache boundary; 99/100-minute observation boundary; network offline; missing fields; malformed time; midnight; browser in non-Tehran timezone; daylight/night transition. Record test command, exit code and captured output.
- A Git blob SHA parity check covers private `web/tehran-environment.js` and public `web/tehran-environment.js` plus `.github/city-assets/tehran-environment.js`; it does not prove real-time data, network access, visual QA or deployment. Never substitute an older successful Pages run.
- Keep weather source attribution visible; verify provider commercial licensing separately before monetized release. No private credentials or city geometry are needed for this audit.

## CI evidence and probe parity (MAYOR-014)
- Read `tests/tehran_environment_probe.mjs` from private and public and compare Git blob SHA; identical SHA is a **test-source parity** check, not a passing execution.
- Inspect both workflow job conclusions independently. A successful public Pages `deploy` job does not override a failed private `tehran` job.
- For failed runs, fetch the job logs and identify the exact failing assertion before editing runtime code; if logs are unavailable, record the failure as undiagnosed and do not release weather-runtime changes.
- Require separate evidence for Node probe exit code, browser Open-Meteo fetch, Tehran midnight transition, visual sky, and the Pages deploy for the **specific new revision**. Older deployments cannot certify newer changes.


## Vehicle motion safety (MAYOR-015)
- Preserve the four paved lane centerlines and existing pedestrian-crossing reservation before introducing graph turns.
- Enforce minimum bumper clearance during spawn, wrap and all intersection transitions; validate against the actual road surface, not just a visual spline.
- Reload continuity based on wall-clock phase is approximate, not a persistent traffic simulation; do not describe it as saved state.
- Run `tests/city_traffic_probe.mjs`, lane-bound checks, collision/headway tests, and night visual checks before copying vehicle runtime to the public pinned site.
- If CI or local execution is unavailable, keep runtime changes private and explicitly report release blocked.

## Clock-anchored vehicle route acceptance (MAYOR-016, 2026-11-09)
- Replace short straight-line modulo loops with directed road-network itineraries. Anchor initial vehicle phase to absolute epoch time; never reset all cars to three identical spawn slots when the page reloads. Record that a deterministic, finite itinerary still eventually repeats.
- Generate turning arcs only within the intersection of physical ROAD_SEGMENTS strips; verify every sampled wheel-center path against the *real* `web/urban-plan.js` geometry. Keep a stable per-vehicle pseudorandom seed for changing turns.
- Never place new pedestrian crossing signal posts on the authored public sidewalk `z=11.3`. The town-scene paths probe catches these as wall/furniture conflicts.
- Avoid radial all-vehicle collision checks: they can cause all-way deadlock when turning cars pass near one another. Follow same-direction lane leaders with directional headway, and arbitrate crossing conflicts with signal phases.
- Emissive materials alone are not proof of night lighting. Keep visible bright headlamp lenses, a small pool of no-shadow SpotLights (bounded to six for twelve vehicles) and the night factor derived from the `Asia/Tehran` clock, falling back to scene day/night factor.
- The deployed fleet comes from pinned `.github/citizens-assets/town-cars.js` and `town.js`; the public `prepare_car_deploy.py` must recognize road-graph signatures rather than insist on `laneCars`. The car import, town import and root world entrypoint all require aligned cache bust tokens; align `prepare_city_deploy.py`, `prepare_citizens_deploy.py`, `prepare_observer_deploy.py` and the test assertion.
- Require executable regressions for path samples inside asphalt, vehicle clock snapshot across reload, night headlamps, no dangerous crosswalk overlap, town-scene layout/paths/wiring, and public deploy conclusion. Successful mocked-Three geometry checks do not substitute for live browser visual inspection.

## Scope/quality override: 3Dviz + real Tehran writer block (MAYOR-026)
- The required visual-production workflow now includes the vendored `cognition/skills/3dviz-pro-max/` for every 3D prop review/addition/reconstruction; existing Three.js builders remain authoritative. Inspect skill record, chosen recipe/asset route, real screenshot proof, bounds and runtime cost before approving object changes.
- The only *new* surveyed/copy-exact geographic scope is the writer's block containing WGS84 anchor (35.715361987616696, 51.3642455031707). AOI boundaries must come from licensed real-world street geometry. Treat current geometry as procedural, not a 1:1 Tehran map. Do not expand world coverage or move residents outside this scoped phase.
- Without legally reusable ground-truth street/parcel/height evidence and clearance/scene tests, release **documentation only**; never assert accurate reconstruction of the physical Tehran block. Detailed process: `city/skills/tehran-writer-block/SKILL.md`.

## Pre-Tehran map-backup proof (MAYOR-027)
- The user's current scene is saved in both GitHub repositories under `backup/writer-block-pre-tehran-rebuild-2026-11-09`; see `city/backups/writer-block-pre-tehran-rebuild-2026-11-09.md` for exact full commit SHAs and selective restore commands.
- Confirm both backup refs and their recorded SHA before any map replacement. Never edit or delete snapshot refs, replace the canonical author/publisher history, or revert the whole repository just to restore city geometry.
- Keep camera/lighting/street-level baseline evidence in future rebuild tasks so before/after can be compared against the saved map, and keep restore instructions pinned and public-safe.
