# MAYOR-024 — Tehran weather freshness contract

Date: 2026-11-09. Scope: city-only documentation and QA guidance; no runtime changes.

## TODO (registered before edits)
- [x] Reconcile city-regression weather staleness guidance with actual `web/tehran-environment.js` behavior.
- [x] Preserve the distinction between forecast-model `current` and station observations.
- [x] Record exact tests, limitations, two new backlog proposals and follow-up gates in `city/TODO.md`.
- [x] Mirror only documentation to the public repository where a matching path exists.

## Initial evidence
At review, `createTehranWeatherService.snapshot()` treats cached data as usable only if fetch age <45 minutes and provider timestamp age <100 minutes; request interval 15 minutes, failed retry 75 seconds. `parseWeather()` rejects source timestamps >90 minutes from local now. The existing regression skill incorrectly calls for an older-than-30-minute fallback, which is not the implemented behavior. The provider is Open-Meteo model-derived current conditions. No runtime/geometry release is authorized by this task.

## Outcome
Private skill and TODO updated. This is documentation-only: no Node execution, live provider request, browser screenshot, or Pages deployment validation was performed. Public documentation mirror is tracked separately; this task does not authorize a runtime release.
