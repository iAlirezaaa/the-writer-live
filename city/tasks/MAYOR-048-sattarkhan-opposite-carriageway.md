# MAYOR-048 — source-backed opposite carriageway of Sattarkhan main street
Date: 2026-11-09
Status: SOURCE GEOMETRY BUILT AND PAGES-DEPLOYED AT SHA 68d78aca2a21e04a406a055d71fbbcb7259bc57f; LATER LEGACY ROUTE GATE FAILS

## Single safe city change
Make the rendered main Sattarkhan road materially more faithful by adding **one additional, separately mapped OSM way** representing the opposite-direction carriageway beside the phase-one road. Do not extend the neighborhood map perimeter beyond owner-authorized writer→Satarkhan main road corridor and do NOT infer Park Sattarkhan outline.

## Immutable backups and skills
- [x] Verified BOTH protected refs `backup/writer-block-pre-tehran-rebuild-2026-11-09` equal owner-specified commits; recovery docs present.
- [x] Read `city/skills/tehran-writer-block/SKILL.md`, `city/tasks/MAYOR-026-tehran-writer-block-3dviz-contract.md`, vendored 3Dviz Pro Max `SKILL.md`, `TWIN-WORLD.md`, and architectural/object-craft advice.
- [x] Source capture is `city/survey/output/writer-block-survey.json`, dated `2026-11-09T09:22:58.743Z`, license ODbL, OSM © contributors.
- [x] Verified source way `osm:way:1232461345` tagged `name=ستارخان`, `highway=primary`, `oneway=yes`, `lanes=4`, `sidewalk=right`, `maxspeed=50`; source direction from northeast to southwest, **opposite** to existing Sattarkhan primary way 207742970 (from southwest toward northeast).
- [x] OSM lane tagging documentation https://wiki.openstreetmap.org/wiki/Lanes says `lanes=4` counts traffic lanes, NOT surveyed width or stripe positions.

## Implementation steps
- [x] Add just this OSM way subrange (consecutive source indices 3..6) as a separate identifiable but batched motorway visual inside existing `web/writer-satarkhan-osm-corridor.js`. Ground strip width purely approximate, not certified. If any dashed lanes drawn, they are schematic.
- [x] Validate source coordinate values and 4-lane/oneway metadata directly against saved OSM survey; assert opposing direction, finite bounds, no overlaps with protected room and no physics/route migration.
- [x] Add bounded, runnable Node + real vendored Three.js test without deleting existing legacy/safety tests.
- [x] Mirrored city/Pages pinned asset and exact-version imports; GitHub Pages run 42680523167 succeeded for SHA 68d78aca2a21e04a406a055d71fbbcb7259bc57f, including built artifact upload and deploy.
- [ ] Full park polygon way 448551081 unavailable from verified API during this execution: do not fabricate its boundary nor imply roadway connects to park.

## Two new backlog items
1. Park Sattarkhan polygon *licensed acquisition*: record full geometry, original OSM node references, timestamp, entrances and true walking route from the new carriageway, only after provider access succeeds and topology is verified.
2. Street-surface evidence: license-safe Iranian municipal curb/carriageway surveys and separately dated OSM `width:lanes`, lane-dividers and sidewalk widths, to replace approximated asphalt bands with verified dimensions.

## Data confidence
Source centerlines and highway/lanes/oneway are community-tagged OSM claims, not independent traffic-authority proof. The new illustrative width, material, painted separators or physical median are NOT measured and must not be presented as a full Tehran street reconstruction. Keep source-only mode, writer floor index 3, property geometry, apartments, citizens and traffic unchanged.

## Actual execution record
- Private geometry commit `e07e4d3e295bd211e63b13deac23767439075fc6`; source cache chain version bumps in town-tehran-rebuild.js, town.js and world.js.
- Vendored Three.js evaluated the actual source module with existing scene: road geometry 80 triangles, visually schematic lane marking 90 triangles, five rendered objects, all finite-bound, room parent at +6.6m maintained, no physical traffic objects and unchanged OSM original way subranges.
- Test `tests/tehran_satarkhan_east_corridor_probe.mjs` strengthened against source way 1232461345 exact coordinate slice and OSM tags, opposite-way dot product, annotated painted lanes and in-corridor render bounds. CI must still run it in a public Pages build.
- Current stage uses owner-facing **source way ID/lanes evidence** but marks widths/paint as unknown and never claims an accurate 10.8m street profile.
- Actual street/aerial/night screenshot and FPS NOT captured. Park polygon not accessible via currently queried OpenStreetMap API; no park perimeter synthesized.

## CI and release audit
- GitHub Pages job `https://github.com/iAlirezaaa/the-writer-live/actions/runs/42680523167` **succeeded** (SHA `68d78aca2a21e04a406a055d71fbbcb7259bc57f`), including private-derived source-only city/room geometry regressions, public build and `actions/deploy-pages@v4` success. Source files and pinned city/citizens assets confirmed byte-identical at the audit.
- Later public commit `03259f0cbaf34de4046776416d17a2362d9735a3` corrected root `index.html` to use the new import cache key. Dedicated Observatory UI contract workflow `42680801966` succeeded.
- A later Pages run `42680802013` **failed** at pre-existing legacy town-path safety test: `TOWN-SCENE-FAIL paths: Route walks through furniture/wall at {"x":0,"z":7.300000000000001}`. No citizen routes, migration logic, path tests or physical collision objects were modified, so this remains an explicit blocker for latest SHA and must NOT be suppressed.
- The earlier verified successful Pages deployment remains the last directly confirmed released city version; the latest root HTML commit cannot be claimed deployed. Browser screenshots, visual accuracy, FPS and physical lane width remain unverified. Park polygon remains unavailable.
