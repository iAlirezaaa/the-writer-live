# MAYOR-050 — Backup ref verification and source evidence gate
Date: 2026-11-09
Status: DOCUMENTATION ONLY / GEOMETRY BLOCKED

## TODO before any change
- [x] Inspect canonical Tehran-block skill, MAYOR-026, 3Dviz Pro Max SKILL.md and TWIN-WORLD.md, and building manifest.
- [x] Read baseline backup manifest on main in the private repository.
- [ ] Independently verify BOTH frozen backup refs and exact commit SHAs. GitHub contents fetch on backup branch returned 404 in both repositories; this does not prove the branches are absent, but is insufficient confirmation.
- [ ] Read a relevant 3Dviz catalog recipe/kit before modeling; catalog README path checked but absent. Locate actual catalog entries.
- [ ] Acquire licensed building:levels, entrances, storefront POI and street/curb evidence within writer block, with source IDs, capture dates and uncertainty.
- [ ] Run source-only, writer-room, legacy route, collisions and Pages checks before geometry publication.

## Findings
Manifest has four Overture ML polygons; heights, floors, entrance locations, commercial occupants and individual-building segmentation remain unknown. The 6m envelopes and 3m guides are illustrative, not measured floors. Existing independent building 02 and 03 builders must not be represented as surveyed architecture. The current user mandate limits work to the writer block; no new outside-block geometry is authorized by this task.

## 3Dviz review
The vendored 3Dviz SKILL and TWIN-WORLD guide require evidence-first silhouettes, grounded supports, deterministic meshes, shared Three.js geometry/materials, and visual capture before quality claims. No kit was copied, no mesh changed, and no visual capture performed.

## Backlog (two new candidates)
1. **Backup ref integrity probe:** automate exact frozen branch SHA verification in both repos, comparing immutable expected commit IDs and backup manifest presence, without modifying refs.
2. **Footprint confidence overlay:** per-Overture-polygon UI metadata for source ID, segmentation uncertainty, unknown levels/doors/shops, and explicit proxy legend; no physical colliders or unsourced storefronts.

## Verification / release
This is documentation-only: no source-only geometry, citizen route, writer room, publisher, or runtime behavior changed. No Node tests or browser screenshots run. No deployment asserted. Geometric rebuild remains gated until backup integrity, licensed source and relevant QA are verified.

## Follow-up verification — 2026-11-10, MAYOR-054
The unchecked backup-ref gate above is now independently RESOLVED by MAYOR-054. Direct GitHub `git/ref/heads/backup/writer-block-pre-tehran-rebuild-2026-11-09` reads returned both immutable branch refs at their exact expected snapshot commit SHA values. Both main-branch backup manifests are present and match by Git blob SHA. The historical `city/GOAL.md` lookup returned 404 because the file was absent at that old ref, not because the backup branch had disappeared. Use `city/survey/verify-backup-refs.mjs` and `city/tests/writer-block-backup-refs.test.mjs`; 6 mock tests passed in local Node. This does not authorize scene or road geometry changes without their own evidence and regression gates.
