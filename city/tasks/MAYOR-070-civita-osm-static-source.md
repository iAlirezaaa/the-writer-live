# MAYOR-070 — stable small-area Civita OSM roofprints in the deployed scene
Date: 2026-11-10
Status: BUILD-TIME SOURCE INTEGRATION TESTED; Pages deployment release check outstanding

## Why
The Civita world and original writer room deploy successfully (GitHub Actions #42789255435), but its 3D building footprints require every browser visitor to receive a successful Overpass query. Public Overpass servers can rate-limit or fail; the user may therefore see almost no buildings despite successful Pages deployment. The main OSM editing API can deliver one tiny area as XML, then a site build can convert it into a static, provenance-labelled source snapshot.

## One safe, measurable change
During the GitHub Pages build, make ONE bounded OSM API 0.6 /map request for the existing Civita BBOX, convert only tagged building ways and OSM pedestrian ways into geometry-bearing JSON with stable OSM way IDs / recorded timestamps, validate its limits and preserve required © OSM/ODbL attribution, and place the optional snapshot under `_site/web/data/civita-osm-snapshot.json`. The Three.js renderer should load that same-origin file FIRST, with the existing live Overpass reader as a non-fabricating fallback. Do not infer roofs/height, invent streets, change author/room/citizen data, or touch frozen backup branches.

## Safety / verification
Confirm backup manifests and branches in both repos; read city goal, Civita skill, 3Dviz SKILL/TWIN-WORLD/object craft. Create an offline XML fixture test, source-count/rejection test, run Node source geometry/room/route tests and the actual Pages job; report whether the snapshot was REALLY acquired and shipped. If the external endpoint fails, keep deployment safe and display honest fallback, no geometry fabrication. Private first, public pinned assets second.

## Two fresh backlog tasks
1. Replace the Overpass runtime fallback with an explicitly licensed, timestamped reproducible export process maintained in-repo after reviewing the ODbL derived-database obligations; monitor last successful source date.
2. Obtain actual Lazio 5m DTM coverage for Civita, confirm vertical datum, survey year and 3D ground-contact error; only then introduce terrain / cliff meshes.

## No-go
No external Google/CyArk scans without permission; no claim of surveyed building floors, roof forms, terrain elevation, or Lo Studio placement. Writer appearance, interior and backup branches stay unchanged.

## Execution evidence (2026-11-10)
Status: CODE AND OFFLINE/CI SOURCE TESTS PASSED; PAGES DEPLOYMENT PENDING IN NEW WORKFLOW RUN.
- Preflight: 3Dviz SKILL.md / TWIN-WORLD.md / object-craft, active city goal/skill, and both frozen backup branches + backup manifests were checked. No legacy backup changed.
- Code: `city/survey/build_civita_osm_snapshot.py` is a single, bounded, identifiable official OSM XML GET, no retries; converts stable way IDs/geometry/tags/timestamps into ODbL-attributed JSON. `web/civita-osm-render.js` now reads the build-time same-origin snapshot before one live Overpass fallback, with no synthetic fallback features.
- Private-first to public synchronization: task, script, two source validators, renderer regressions, runtime source reader and this skill were mirrored.
- Actual GitHub Actions #42790684330 attempt 1 and 2 built an OSM snapshot SUCCESSFULLY:
  `CIVITA-OSM-SNAPSHOT-OK 66 ways`
  `CIVITA-STATIC-SOURCE-OK {"ways":66,"buildings":61,"footpaths":5,"rejected":0,...,"heightsUnverified":61}`
  `CIVITA-STATIC-OSM-ARTIFACT-READY`
  and `CIVITA-CITY-BUILD-OK 14 checks`. File `_site/web/data/civita-osm-snapshot.json` was included in the uploaded Pages artifact.
- Actual deploy #42790684330 failed **outside model/OSM tests**. Attempt 1: deploy-pages returned 0 artifact metadata records immediately after successful artifact upload; attempt 2 (same workflow run) returned duplicate `github-pages` metadata records. The job was NOT a successful Pages deployment. For a clean run, add metadata propagation delay before deploy; do not retry the same artifact-stale job.
- Existing room, character appearance, historical backups, private publisher data and citizen identities/routes remain untouched. No full surveyed Civita 3D, cliffs or Lo Studio parcel claim. No actual browser screenshot yet.
- Backlog: versioned ODbL snapshot with legal audit; measured 5m Lazio DEM coverage/datum (see skill).
