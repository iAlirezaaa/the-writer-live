# MAYOR-020 — Weather coordinate and provenance audit
Date: 2026-11-09. Scope: city documentation only.

## TODO (registered before changes)
- [x] Compare home WGS84 anchor with the existing Tehran weather request coordinates.
- [x] Record discrepancy and safe acceptance criteria; do not alter runtime or citizen clocks.
- [ ] Evaluate changing provider request to home coordinates in a tested checkout.
- [ ] Run Tehran environment, geometry, scene and visual probes before runtime release.

## Findings
- Home anchor in web/urban-plan.js: latitude 35.715361987616696, longitude 51.3642455031707.
- web/tehran-environment.js requests latitude 35.6892, longitude 51.3890 (central Tehran), not the home anchor.
- Provider path /v1/forecast with current fields is a forecast/model-based current estimate; it must not be described as a direct on-site observation.
- Runtime source files were not changed. Geographic road/building fidelity and live provider availability remain unverified.

## Acceptance criteria for a future implementation
- Use one shared home-anchor coordinate contract for provider request construction; assert latitude/longitude and timezone in a deterministic test.
- Label weather as model-based estimate, with source, update timestamp, stale/offline status and attribution; never claim physical observation.
- Validate solar day/night against Asia/Tehran and provider sunrise/sunset, including midnight rollover and unavailable provider fallback.
- Run city probes, source/pin parity, browser weather and day/night visual checks before public runtime release.

Status: documentation-only audit; no executable tests run, no new deployment verified.
