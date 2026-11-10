# MAYOR-064 — Reject incomplete GeoJSON point coordinates
Date: 2026-11-10
Status: TODO (before implementation)

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
Pending implementation and tests.
