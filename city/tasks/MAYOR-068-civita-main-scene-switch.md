# MAYOR-068 — Replace active Tehran map with Civita in writer world's main town view
Date: 2026-11-10
Status: MAIN-WORLD MAP SWITCH COMMITTED; GITHUB PAGES DEPLOY SUCCESS; BROWSER QA PENDING.

Goal: Make real Civita source-backed OSM map and provisional building footprints visible on the main writer site (not merely in a separate preview). Preserve the writer room, publisher/story/memory, citizen identities and their routing, and both frozen Tehran backup branches.

Preflight: read city/GOAL.md; city/skills/civita-digital-twin/SKILL.md; vendored 3Dviz Pro Max SKILL.md/TWIN-WORLD.md and object-craft; inspect web/town.js, web/world.js and Pages pinned citizen assets, city deploy script and old smoke probes. Verify both backup refs and manifests before touching map.

One bounded integration:
- Add web/town-civita.js using already authored OSM tile and legal vector reader; mark unknown heights and plateau terrain as **not surveyed**; never invent a 1:1 scanned cliff. Use one existing Three.js instance; no engine migration without a measured constraint.
- Change buildTown() default to Civita. Keep explicit source-only Tehran and legacy options strictly for rollback/probe, not public default.
- Ship matching public pinned town module and safe main-scene imports/labels/camera clamp.
- Retain protected writer exterior at its local temporary 0,0 anchor with an explicit *not placed in authenticated Lo Studio parcel* flag; avoid any OSM sourced building rendering within its footprint. Do not reparent the room or change citizens.
- Preserve existing legacy probes as explicit legacy/Tehran-only, add active Civita integration probe, align Pages gate with actual output rather than bypassing protection.

Acceptance: locally executed Node geometry/room/camera test and historical collision tests when runnable; public pinned parity; no unsupported geometry; browser screenshot and Pages deploy status reported only if actually checked. If release gates cannot pass, do not assert deployment.

Two fresh backlog ideas:
1. Acquire a dated, permitted local OSM vector extract as a deterministic self-hosted snapshot to avoid Overpass downtime and save provenance / timestamp.
2. Implement georeferenced Lo Studio parcel matching with an architectural scan licence audit, then prepare reversible historically accurate exterior with full writer-room door accessibility probe.

No backup deletion, no deletion of author room, no invented verified storeys, no tearing down citizen data.

## Actual execution and release evidence
- Both frozen Tehran recovery branches and backup manifests were read and left unchanged.
- Read city goal, Civita skill, vendor 3Dviz Pro Max SKILL.md and TWIN-WORLD.md, and object-craft reference.
- Private main builder: `web/town-civita.js` commit `df96c0128796bb916a861ddbbdc1ce9b092b5b59`. Active `web/town.js` default switched to `civita` in `54f6a90ee1a736ba0ed9e05bbc3af5ab3b2db305`. Old modes remain available for the historic regression ONLY.
- Main world `web/world.js` Civita first view, outdoor camera pan/zoom limits, cache-key refresh, labels: private `cbef1265b5caa5d8f5bb4e5a1239df2da5f1cc6a`; private index cache `985ae7c91a955311271a14583ccea5d5be47cc5e`.
- Public town deployment `web/town.js` `db74f4f397c40bb4ff69dfd756f70246a49c0408`, mandatory pinned `.github/citizens-assets/town.js` `b79bd5f39cbea328f4b2c0a9c3be554f20776ab7`, and world entry `146224e613ad07cae42890f489b343dbd516c82a`. Public pin and private source town blob SHA equal `65a504b437f6be7862c9bf5bacb20c04c92cfbd1`; both world source blobs equal `328008fb68e44a032a496d6a89358ea3cd118ede`.
- Fixed the public Pages overlay scripts' outdated version checks; retained all Tehran tests by explicitly exercising the source-only fallback and original legacy collisions. New `tests/civita_main_town_probe.mjs` runs against real Three.js and protects room ownership, nonphysical map underlay, and active geometry.
- GITHUB ACTIONS VERIFIED: public `Deploy living world` run **42782461956**, checkout commit `043a29993eee4739473cc259537c18f4badb6a73`, **completed SUCCESS**. Build step and deployment step both successful; earlier failing runs 42781970680, 42782149551, and 42782305282 were debugged and repaired.
- GitHub logs explicitly show: `CIVITA-MAIN-TOWN-OK`, `TEHRAN-...SOURCE-ONLY-OK` historical regressions, `TOWN-SCENE-OK layout`, `TOWN-SCENE-OK paths`, `TOWN-SCENE-OK wiring`, `WRITER-HOME-CONSISTENCY-OK`, `CITY-DISTRICT-BUILD-OK` and `OBSERVATORY-OK`.
- No new verified cliff/bridge DEM or Lo Studio parcel; keep writer room and legacy apartment exterior intact. This deployment shows a source-backed but currently flat map and provisional 3D extrusions, not a certified full 3D town.
- Browser WebGL screenshot, actual OpenStreetMap tile/CORS and live Overpass vector count have not been captured or verified. Do not claim precise building heights, 1:1 architecture, or real geographic placement of writer's house until source review.
- Next source-of-truth work: two fresh backlog tasks in city/skills/civita-digital-twin/SKILL.md — reproducible licensed local vector snapshot, and verified Lo Studio parcel/exterior/door integration.
