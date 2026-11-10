# MAYOR-075 — Source-gated placement of the writer home in real Civita building footprints
Date: 2026-11-10
Status: SOURCE-CORRELATED SITE PLACEMENT AND SHELL FIT IMPLEMENTED; PUBLIC CI PASSED; CADASTRAL VERIFICATION PENDING

Owner: do not assign the writer's house an arbitrary coordinate. Keep original writer appearance and all furnished-room assets/logic.

Evidence:
1. Civita Institute 2014 town plan https://www.civitainstitute.org/files/1127.pdf identifies Institute grounds within Civita.
2. Civita Institute ground floor plan https://www.civitainstitute.org/files/1128.pdf labels D=Lo Studio, E=Il Nuovo, F=Il Ruderino, G=courtyard, along Via Provvidenza/Via Porta Maesta. Drawing explicitly not to scale.
3. Official house description https://www.civitainstitute.org/496/lo-studio.html: two floors, tufa, peperino, chestnut, clay tiles.
4. OpenStreetMap ODbL 2026-11-10 source snapshot, way/464102189: geometry matches a strong SITE-PLAN CANDIDATE for building D: approximately 84 square metres, 7.5 by 12.6 metre oriented envelope, in Institute district. IMPORTANT: no explicit Lo Studio name on this OSM way, association not cadastral-survey certified. Do not describe it as exact.

Deliverable: implement conservative OSM way-ID/shape/neighbor/footprint validator. When source confirms the candidate, relocate both protected existing writer room root and Civita-inspired exterior to its source geometry, retaining exact original character meshes, original furnished room, identity, animations, interactions, and indoor camera. Align outdoor footprint with polygon and verify access. If validation fails, DO NOT draw a fake writer house at world origin: keep room accessible in its separate view. Clear only corresponding OSM proxy building, never blanket radius around (0,0).
Safety: read Civita GOAL and skill, vendored 3Dviz Pro Max SKILL/TWIN-WORLD and architectural craft. Historical private/public Tehran backup branches and manifests verified present. Never touch author/publisher/citizen core. Private-first then public with pinned source parity and actual CI.
CI prerequisite: repair public/private terrain test discrepancy: -0 and +0 compare strictly different in Node assert. Do not bypass geometry tests.
Accuracy limitations: site plan not to scale; OSM building identification is a high-confidence working match and requires independent survey confirmation, vertical DTM ground contact and door face confirmation before declaring one-to-one reconstruction.

Two backlog tasks:
1. Obtain legal georeferenced cadastral/civic evidence or an explicit Civita Institute confirmation that way/464102189 is property D / Lo Studio; record parcel and facade survey confidence.
2. Obtain real threshold/first-floor altitude at this parcel with licensed Lazio 5m DTM and dimensions; validate door, outdoor steps, full writer-room shell collision in a real browser capture.
## Actual implementation and quality evidence — 2026-11-10
- `web/civita-writer-location.js` checks exact OSM way/464102189, required neighboring buildings, licensed bounded source snapshot, closed footprint, area range and a rotated 6×6m interior fit. Candidate WGS84 position computed from actual geometry: **42.6280873585, 12.1147156074**; OSM area **84.47 m²**. The model's own building label is **CANDIDATE**, never cadastral-verified Lo Studio.
- `web/world.js`: move the already-existing writer interior root + independently-owned interpretive exterior together (source XY rotation and approximate source DEM Y). Indoor cameras and follower camera use room `matrixWorld`. Author mesh, costume, memory, stories, publisher and citizen identities/routing remain untouched. If source validation fails, do not render a fake outdoor writer house.
- `web/town-civita.js`: suppress only the matched source footprint OSM way/464102189 after placement. Old blanket suppression of all buildings near arbitrary 0,0 eliminated.
- During actual post-build geometry inspection, **8 exterior mesh parts** (eaves/roof, foundation, side walls, entry step) crossed the candidate polygon although the room rectangle had passed. Changed only `web/civita-writer-house.js` study exterior: narrower plinth and masonry shell, reduced roof overhang and shallow threshold, without altering original 6×6m furnished interior or character.
- Added a real OSM polygon containment regression in `tests/civita_writer_location_probe.mjs`: checks all **864 opaque structural vertices** after actual Three.js world transforms and rotated site placement; **zero out-of-parcel vertices**, excluding the invisible nonphysical raycaster target.
- Public/private source blob parity confirmed for `web/world.js`, `web/town.js`, pinned `.github/citizens-assets/town.js`, site locator, exterior and tests.
- **Verified public GitHub Actions Pages run 42817036625**, head SHA `c7d29cb40f2d4c50d6fe386de71c92fe2044e6c7`, completed SUCCESS. Log `CIVITA-REAL-WRITER-PARCEL-CANDIDATE-OK` showed 84 m², 864 vertices, 0 violations; `CIVITA-WRITER-HOME-OK`, `CIVITA-WRITER-HOME-CONSISTENCY-OK`, source terrain, original-character and path tests also passed.
- Source truth limitations: the Civita Institute plan **D** and OSM way/464102189 match by location and shape **only**, not certified cadastre; the real Lo Studio door, balcony, roof cornices, actual horizontal dimensions and vertical datum remain unmeasured. Model uses interpretive period materials and illustrative height. Never claim 1:1 verified restoration.
- Attempted a live browser screenshot from the verified Pages artifact, but local Chromium navigation to both localhost and file URLs returned `ERR_BLOCKED_BY_ADMINISTRATOR` in this container; pixel-level WebGL/camera inspection is **NOT verified**. GitHub Actions success confirms build/deploy, not actual browser appearance.
- Next backlog (see city skill): (1) constrain all larger author room-growth stages to the real lot with the same vertex test; (2) confirm Lo Studio street entrance and upper door to Il Nuovo from measured licensed sources.

