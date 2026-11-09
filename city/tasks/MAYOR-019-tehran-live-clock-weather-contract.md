# MAYOR-019 — Tehran clock and live-weather acceptance contract
Date: 2026-11-09
Status: IN PROGRESS — documentation-only; no runtime release.

## Scope
Audit and specify Tehran-local clock and observed weather integration without editing citizens, author, publisher, roads, buildings, or existing rendering modules. Home WGS84 anchor: 35.715361987616696, 51.3642455031707. Existing urban-plan.js provides georeferencing and Asia/Tehran, but this alone does not prove that scene lighting or weather uses Tehran time/observations.

## Acceptance criteria for a later isolated implementation
1. Tehran time MUST derive from Intl.DateTimeFormat with timeZone Asia/Tehran and an actual current instant, never host-local timezone or a fixed UTC offset. Use simulated clock only under an explicitly labeled preview mode.
2. Weather MUST come from a current Tehran geolocation observation, with source name, observation time, retrieval time, weather code, and freshness. Network errors, missing permission, or stale observations (>30 min) MUST display a clearly labeled unavailable/stale state; do not silently present fictional weather as current.
3. Throttle requests (>=10 minutes), deduplicate in-flight calls, cache only with timestamp, avoid embedding secrets or fetching private location data. Use explicit WGS84 coordinate pair for Tehran.
4. Day/night lighting must use Tehran local solar position or documented sunrise/sunset, not only fixed 18:00/06:00. Test 00:00, sunrise boundary, noon, sunset boundary, and DST-independent timezone conversions.
5. Preserve 60fps target by separating network polling from render loop. No geometry, resident routes, or author/publisher state changes.
6. Before publication run existing urban_plan, road_topology, city_districts, writer_house_consistency and town_scene probes, check 6 pin blobs, verify fresh Pages run and inspect day/night/mobile screenshots.

## This iteration evidence
Private and public city/TODO.md and city/skills/city-regression/SKILL.md read. Private web/urban-plan.js includes anchor/timezone and procedural roads; web/city-growth.js plans 432 housing places. No live weather endpoint or day/night consumer verified. Node tests NOT RUN; browser screenshots NOT INSPECTED; deployment NOT VERIFIED. No runtime code touched.

## Next backlog candidates
- Solar-phase fixture set: Tehran sunrise/sunset reference instants across seasons, with winter and summer visual screenshots.
- Weather provenance badge: unobtrusive source/observed-at/freshness indication in city diagnostics, without revealing any private location or adding render-loop fetches.
