# MAYOR-050 — Audit illustrative Sixth Daryan street section before any further widening
Date: 2026-11-09
Status: DOCUMENTATION-ONLY COMPLETE; no scene change, no runtime or visual validation

## Scope and safeguards
Audit the one authored Sixth Daryan cross section (OSM way 92200441) against the four frozen Overture roofprint candidate polygons. No physical city mesh, writer room, road source, car routing, citizen path, or outside-block scenery changes. Do not imply the sampled 10.7m section is surveyed or legally available.

Preflight: both protected branches `backup/writer-block-pre-tehran-rebuild-2026-11-09` compare IDENTICAL with their original SHA (private cfdac995b6e070d472627b484c93d8fbf5f6ed2b, public ececf9ffc041b1666b0425f4f1746d162b9dcf67). Backup documentation exists in both default branches.

3Dviz Pro Max read: `SKILL.md`, `TWIN-WORLD.md`, `references/object-craft.md`. Existing InstancedMesh parking and no-collider surface design retained. This is an evidence/clearance review, not a visual asset creation; no before/after screenshots claimed.

## TODO
- [x] Verify exact geometry data from `web/writer-satarkhan-osm-corridor.js` and `web/writer-block-building-data.js` by source-geometry computation.
- [x] Sample the full 10.7m illustrative right-of-way at 2m intervals against all four Overture polygons. Record that polygon clearance is NOT proof of legal road width or absence of smaller unmapped buildings.
- [x] Audit parking longitudinal end clearance and vehicle width inside the authored parking band; document any geometric shortcomings and potential junction/entrance encroachment.
- [x] Record an auditable JSON result under `city/survey/output/`, with original source SHA and date; mark `surveyVerified:false`.
- [x] Append the finding to `city/skills/tehran-writer-block/SKILL.md`, with safe corrective actions and a 3Dviz Pro Max performance/LOD note.
- [x] Publish documentation-only after independent calculation; no scene/Pages deployment claim.

## Two new backlog ideas
1. Acquire a licensed curb-to-curb survey and actual cadastral building setbacks for Sixth Daryan before assigning a real section width, parking legality or vehicle route.
2. Add continuous swept-envelope collision tests for parking-car wheels, door opening, intersections, accessible pedestrian routes and curb ramps before enabling physical traffic collision.

## Release gate
No geometry change means the source-only and legacy scene regressions are not affected by this task, but **neither is claimed to have run**. Any future geometry changes require both suites, visual day/night/top/street captures and a measured-road source.
## Result (2026-11-09)
- Source SHA road `89ad68124fb226a2ff5acc86875290c649b51657`; building `80ea26c242d862709dbe053f76b13182bb847324`.
- Source way length 152.7856m; 462 point-in-polygon checks (2m longitudinal, 6 offsets) against 4 Overture candidates returned zero hits. This is NOT a continuous clearance proof, no actual ROW or entrance evidence.
- Seven 6m bays, five static proxy cars; minimum road-end clearance 15m; nominal side clearance 0.2m.
- Evidence: `city/survey/output/mayor-050-sixth-daryan-clearance-audit.json`. 3Dviz object-craft rule appended to `city/skills/tehran-writer-block/SKILL.md`.
- No source-only/legacy runtime tests, screenshots, browser captures or Pages deployment performed; no physical geometry was modified. Future geometry edits remain gated.
- Backlog ideas: (1) legally usable curb/ROW and parcel survey; (2) continuous swept car, door, footpath and accessible curb-ramp intersection tests.
