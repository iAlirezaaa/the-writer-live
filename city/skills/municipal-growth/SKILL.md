---
name: municipal-growth-and-living-city
description: City-only roadmap, 400-person capacity planning, low-cost ambient motion, traffic, weather and civic services for The Writer.
---

# Municipal growth skill

## Read before changing the city
1. `city/TODO.md`; add a testable unchecked item before implementation.
2. `city/URBAN_CODE.md`; obey municipal limits and protected author/publisher boundaries.
3. `web/urban-plan.js`, `web/town-districts.js`, `web/city-growth.js`, `web/town.js`.
4. Other `city/skills/*/SKILL.md`, especially roads, foundations and regression.
5. Verify the public pin map in `the-writer-live/.github/workflows/pages.yml`.

## Stage gate
- Plan: write parcel/route IDs, occupancy assumption and expected visible behavior.
- Author: keep one data source, existing anchors, and avoid shifting citizens' routes.
- Performance: use InstancedMesh, reusable geometry/materials, deterministic animation without runtime resource churn.
- Validate: 100% roads connected, no overlapping reserved civic/residential parcels, 400+ theoretical places; no unsupported roofs or unusable doors.
- Mirror: update private first, then public `.github/city-assets`, `.github/citizens-assets`, `web`, tests, docs and deployment gate as applicable.
- Verify: latest Pages CI and both outdoor lighting states; report what is unverified.
- Improve: add exactly two new viable city ideas to the backlog after each completed iteration.

## Current zoning
- Civic: school (-52,-16), police (-65,-16), screenplay/decoupage office (-52,-33).
- Housing: +X rows near Z=-16/-33, with 432 theoretical occupants.
- Outskirts: forest road Z=-40 toward positive X; studio (+99,-54) via side spur.
- Background: mountain ridgeline toward negative Z.

## Never
- Modify writer's housing progression, author persona, thoughts, story files, publisher decision-making or citizen identities.
- Replace the existing citizen motion archive with per-character duplicate clips.
- Claim that 432 citizens are currently living, walking or using all 12 apartment blocks.
- Label traffic signs as enforced rules until traffic state and crossing priority tests prove it.

## Tehran real-time environment — MAYOR-010
- Only the **city sky, district light and pooled weather FX** use the Tehran wall clock. The writer, the publisher, citizen routines and their preview clock stay unchanged.
- Use `Intl.DateTimeFormat({timeZone:"Asia/Tehran"})` instead of browser timezone or server/editor simulation clock. Sunrise/sunset come from date-matched Tehran daily weather when valid; the offline fallback only approximates 06:00–18:00 and must not be presented as verified astronomical data.
- Reuse the existing 96 precipitation points. Do not simulate weather on an arbitrary elapsed-time cycle: display rain/snow only when a fresh Tehran weather response reports active precipitation. If API cannot be reached, disable precipitation and show an unavailable marker.
- Check current conditions age (<90 minutes at intake), cache lifetime (15 min request interval, 45 min display freshness), retry delay, provider attribution, and provider-free fallback. No per-frame HTTP calls or network resources in the simulation update.
- The free Open-Meteo endpoint is **non-commercial only**, with CC BY 4.0 attribution. A commercial site must switch to a licensed endpoint or suitable alternative before relying on it in production. Confirm browser CORS/CSP and record real weather HTTP success, not merely a mock fixture.
- Test `node tests/tehran_environment_probe.mjs .` plus old city road/district/house probes, then ensure the public pinned `world.js`, `town.js`, `city-growth.js` and `tehran-environment.js` match the canonical private versions.
