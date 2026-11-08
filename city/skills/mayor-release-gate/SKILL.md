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
