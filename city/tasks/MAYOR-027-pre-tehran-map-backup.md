# MAYOR-027 — Preserve current map before rebuilding the Tehran writer block
Date: 2026-11-09
Status: COMPLETE — two frozen backup refs verified, manifest and safe restore guide mirrored, hourly automation updated. No geometry changed.

## Requirement
Before altering any existing Three.js city/road/parcel/vehicle/building/terrain geometry for the georeferenced Tehran writer-block rebuild, preserve the latest present-day map so it can be restored without reverting writer, publisher or citizen data.

## Captured Git refs (snapshot — do not move these branches)
- Canonical private repo: `iAlirezaaa/the-writer`
  - Branch: `backup/writer-block-pre-tehran-rebuild-2026-11-09`
  - Frozen SHA: `cfdac995b6e070d472627b484c93d8fbf5f6ed2b`
- Public deploy repo: `iAlirezaaa/the-writer-live`
  - Branch: `backup/writer-block-pre-tehran-rebuild-2026-11-09`
  - Frozen SHA: `ececf9ffc041b1666b0425f4f1746d162b9dcf67`

## Backup scope and rationale
- Both branches record a **full Git tree** at their respective commits, rather than a partial/hand-copied asset set. The private source remains private.
- Primary geometry: `web/urban-plan.js`, `web/road-surface.js`, `web/town.js`, `web/town-districts.js`, `web/city-growth.js`, `web/town-cars.js`, `web/objects.js`, `web/world.js`.
- Public deployment overlays also include `.github/city-assets/`, `.github/citizens-assets/`, and public `snapshot/town.json`.
- Preserve named refs and immutable commit SHAs in `city/backups/writer-block-pre-tehran-rebuild-2026-11-09.md`, which contains selective rollback instructions.

## Safety and validation
- Branch creation changes **no files, geometry, traffic state or production deployment**. GitHub branch references were created at the exact commits above.
- Do not restore entire public/private repo across newer stories, citizen data or public UX. Restore only necessary city-scoped files from pinned SHA after checking changed paths and tests.
- The original procedural map is a **rollback baseline**; do not mislabel it as a surveyed accurate copy of Tehran.
- Before applying new city geometry, confirm backup branch still exists and its commit matches this register.

## Two backlog ideas
1. Automated rollback dry-run that copies only a city-asset allowlist to a temporary test branch and runs urban-plan/road topology/citizen path checks.
2. Day/night/overhead/street-level screenshot baseline album with a scene-camera matrix and measurable diffs against future Tehran reconstruction.

## Results
Branch refs: created. Runtime tests: not required for creation of refs and not run. Live Pages deploy: not triggered by a backup branch; no deployment claim.


## Final verification
- GitHub `git/ref/heads/backup/writer-block-pre-tehran-rebuild-2026-11-09` returned exactly the saved commit SHA in each repository (private `cfdac995...`, public `ececf9ff...`).
- Public and private `city/backups/` manifest, city restore skill, mayor release gate and TODO were mirrored before closing this task. The named backup refs themselves point to the older scene commits, not the later documentation commits.
- Existing hourly mayor automation updated to check the preserved refs before a physical map replacement.
- No visual capture, runtime rendering or regression execution occurred in this documentation and Git-reference-only backup task. No claim about public Pages deploy.
