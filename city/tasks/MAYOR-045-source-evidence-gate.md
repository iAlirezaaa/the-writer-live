# MAYOR-045 — Source evidence gate for writer-block storefronts and heights
Date: 2026-11-09
Status: TODO / RESEARCH ONLY; no mesh or public runtime change.

## Preflight
- Both immutable backup branch names found via GitHub branch search; backup manifest found on private main. The historical branch does not contain the later backup manifest (404), so its existence must not be confused with verifying its exact head SHA.
- Reviewed city/GOAL.md, city/buildings/manifest.json, city/skills/tehran-writer-block/SKILL.md, MAYOR-026 and vendored 3dviz-pro-max SKILL.md + TWIN-WORLD.md.
- 3Dviz rule for future single-building work: preserve sourced polygon silhouette and original feature ID; do not fabricate a floor stack, entrance, shop sign or roof; review ground contact, material response, draw calls and real captures before promotion. No kit was copied this run.

## Evidence audit
Current four Overture ML polygons lack sourced building:levels, heights, entrances, individual shops and real unit counts. One polygon intersects the protected writer room. The current 6 m extrusions and 3 m horizontal guides are illustrative only, not measurements. Do not split merged roofprints. Existing city/buildings/manifest.json describes private preview geometry with CI/Pages and screenshots still pending. The historic legacy-route failure near X=0,Z=8.7 remains a release gate, not grounds to modify citizen paths.

## Next measurable task (pending evidence)
For one source footprint only, search appropriately licensed OSM building:levels, height, entrance, shop and addr:* records and Overture building/places properties with dataset release metadata. Create a per-field provenance table (source feature ID, timestamp, license, coordinate, accuracy, nullable value); reject conflicting or unlocated points. Only then propose a single detachable T1/T2 model change, run source-only + legacy regression, house-room, path/collision and Pages tests, and capture day/night overhead/street images. Do not alter runtime until validated.

## Backlog (two new ideas)
1. Add an automated per-field **evidence-expiry report** flagging stale or missing licensed building height, entrance and commercial POI records, without editing geometry.
2. Add a **merged-roofprint ambiguity index** recording overlapping source polygon candidates and room-protection conflicts, requiring documented segmentation evidence before splitting.

## Verification
GitHub source documents read; both backup branch names discovered. No code changed; no browser screenshots, local geometry tests, CI, deployment or commit validation claimed. Public sync limited to this documentation task.
