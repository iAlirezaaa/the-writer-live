# MAYOR-075 — Source-gated placement of the writer home in real Civita building footprints
Date: 2026-11-10
Status: TODO BEFORE CHANGES

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