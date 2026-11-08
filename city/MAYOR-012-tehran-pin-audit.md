# MAYOR-012 — Tehran weather pinned-source audit

Date: 2026-11-08. Scope: municipal-only, documentation and source parity; no geometry, citizen routes, writer, publisher or deploy changes.

## Before-change TODO
- [x] Read private `web/tehran-environment.js` and `tests/tehran_environment_probe.mjs`.
- [x] Compare the private weather module with the public pinned `.github/city-assets/tehran-environment.js` by Git blob SHA.
- [x] Record audit findings, any unresolved CI/runtime limitations and two new city backlog ideas.
- [x] Extend `city/skills/mayor-release-gate/SKILL.md` with a repeatable weather parity gate.
- [x] Mirror this municipal documentation and skill to the public repository after private changes.

No runtime code changes are authorized by this task. A source parity check does not prove live API availability, page deployment or visual QA.

## Evidence and outcome
- Private source `web/tehran-environment.js`: `b4c23c71328a3838d30facbec998e96530a6ea45`.
- Public pinned `.github/city-assets/tehran-environment.js`: same SHA.
- Public `web/tehran-environment.js`: same SHA. **PASS: three-way source parity at audit time.**
- Private regression test inspected: `tests/tehran_environment_probe.mjs` includes clock, rain/snow, freshness, midnight cases; **NOT EXECUTED** this iteration.
- Public Pages workflow execution, live weather request, browser visual QA, street-level access and performance: **NOT VERIFIED** this iteration. No runtime release or deployment claim.
- Weather endpoint provides Open-Meteo model data for Tehran coordinates, not a guaranteed physical station measurement.

## Two new backlog ideas
1. **Provider outage badge**: a city-only weather sign that explicitly shows the last successful update and outage state, never an invented current condition; reuse existing clock formatting.
2. **Solar transition QA fixture**: deterministic Tehran sunrise/sunset screenshot times for the city scene with fixed weather fixtures, without changing citizen schedules or the writer clock.

Status: **COMPLETE for documentation/source-parity scope only**; runtime validation remains blocked on executable CI/browser evidence.
