# MAYOR-064 — Reject incomplete GeoJSON point coordinates
Date: 2026-11-10
Status: CODE AND REGRESSION COMMITTED; EXECUTION NOT VERIFIED

## Scope
One small, non-rendering safety change in city/survey/tehran-geotile-index.mjs: reject coordinate tuples with fewer than two ordinates. The existing recursive geometry scanner treats a single finite number as a valid point after destructuring, which can yield an invalid bbox. Add focused regression tests for one-element tuples and ensure valid two- and three-ordinate coordinates remain accepted. No city mesh, writer room, citizen routes, legacy collision guard, or deployment files changed.

## Prerequisites reviewed
Read city/skills/tehran-writer-block/SKILL.md, city/tasks/MAYOR-026-tehran-writer-block-3dviz-contract.md, cognition/skills/3dviz-pro-max/SKILL.md and TWIN-WORLD.md; this is metadata validation, not a 3D object, so no catalog mesh/kit selected. Historical backup web/urban-plan.js read successfully from both named backup branches; blob SHA 64480b048da29fa8b140e99df09dc83e1d83a496 in each. Do not modify backups.

## Acceptance
- Reject Point [51.3642] and LineString containing a one-ordinate tuple.
- Accept valid [longitude,latitude] and optional altitude [longitude,latitude,altitude].
- Run Node regression tests if possible; report exact outcomes. Do not publish any runtime scene geometry.
- Mirror approved metadata/test/docs only from private to public.

## Backlog
1. Geometry-type-aware nesting/Polygon closed-ring validator (avoid accepting malformed coordinate nesting).
2. Shared GPU geometry ownership and disposal regression for cross-tile features.

## Results
Implementation: one explicit arity guard in city/survey/tehran-geotile-index.mjs and one focused node:test case in city/tests/tehran-geotile-index.test.mjs. Private/public Git blob parity confirmed by returned content SHA (module 6a68f24d46a0e266e44af83cdeb150b08c6f9c59; test e59ec1c6bcffe4139cdaf0d038d8c784267117e7; skill 9088c9ed9a0ef2274096a2f7e1b3d2868bf1bb7f). Backup branch web/urban-plan.js was readable in both repositories with matching blob SHA 64480b048da29fa8b140e99df09dc83e1d83a496; backup file on main also read. Node is installed in local container (v22.16.0), but direct GitHub raw fetch failed with HTTP 000 and source files could not be materialized for local execution. Therefore Node tests, city probes, legacy collision smoke, browser captures, CI, Pages deployment and live Tehran weather integration were NOT verified. No changes made to runtime geometry, writer room, citizen routes or pinned Pages assets. Two backlog items above remain open.
