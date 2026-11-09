# MAYOR-029 — Writer-block source confidence and 3D asset release gate
Date: 2026-11-09
Status: TODO REGISTERED BEFORE CHANGE

## Scope
Documentation-only, one safe step: audit the existing licensed OSM writer-block capture and distinguish topological road-centerline boundary from curb/property/height evidence. Do not alter any map mesh, objects, traffic, citizens, writer or publisher modules.

## Required checks
- Confirm both immutable backup branches and the matching backup manifest.
- Read city/skills/tehran-writer-block/SKILL.md, MAYOR-026, vendored 3Dviz SKILL.md and TWIN-WORLD.md.
- Inspect city/survey/README.md and output/writer-block-survey.json.
- Update only city/skills/tehran-writer-block/SKILL.md with one concrete source-confidence release gate.
- Mirror only reviewed documentation to public after private update.
- Record exact test/visual limitations, commits and two backlog ideas.

## Baseline
Anchor WGS84 35.715361987616696, 51.3642455031707; X east, -Z north. Existing procedural scene is not surveyed Tehran. Backup private cfdac995b6e070d472627b484c93d8fbf5f6ed2b; public ececf9ffc041b1666b0425f4f1746d162b9dcf67.

## Acceptance
Documentation explicitly blocks inferred sidewalk, parcel, facade, roof or building heights from the 12,265 m² OSM road-centerline candidate. No claim of rendered or tested geometry.
