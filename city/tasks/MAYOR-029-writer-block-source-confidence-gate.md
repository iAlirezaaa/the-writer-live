# MAYOR-029 — Writer-block source confidence and 3D asset release gate
Date: 2026-11-09
Status: DOCUMENTATION COMPLETE; GEOMETRY NOT MODIFIED

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

## Verified findings
- Both recovery branch names were returned by GitHub branch search and the manifest matched in private/public (Git blob 4821f550f9228adb7ba68e188ca8ee8a10b2dd04). Exact backup branch tip SHAs were not independently fetched this run; manifest preserves private cfdac995b6e070d472627b484c93d8fbf5f6ed2b and public ececf9ffc041b1666b0425f4f1746d162b9dcf67.
- OSM capture (2026-11-09T09:22:58.743Z) is ODbL-1.0, 230 m acquisition radius, candidate road-centerline face 12,265 m². Building heights are unknown; no cadastral, sidewalk or curb survey was established.
- Consulted both 3Dviz core instructions. Existing survey README references signboard/lantern/timber kits, but the attempted signboard catalog file path was not found, so no new kit-level review or model claim is made.
- Private skill update: 17499c5772492618d61fb7b8b1b188e2b96f2f88. Public task mirror: 26003153addd365916cfeda1995861358d8558ae. Public skill mirror: 70a7030e2b15f831776d6e0ce32a53036e72ee06.
- No Node tests, browser screenshots, provider requests, geometry or traffic validation, Pages build or deployment were executed. This is documentation-only; public runtime assets unchanged.

## Two new municipal backlog ideas
1. **Block-contained feature audit:** deterministic point-in-polygon report distinguishing OSM buildings wholly within the candidate road face, crossing it, or only present in the 230 m acquisition rectangle; block any unsourced building extrusion.
2. **Evidence confidence badges:** opt-in Three.js survey-preview overlay labeling road-centerline, curb-unknown, parcel-unknown and height-unknown features, with provenance/ODbL link and no collision or citizen-route impact.
