# MAYOR-070 — stable small-area Civita OSM roofprints in the deployed scene
Date: 2026-11-10
Status: TODO registered BEFORE changes

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
