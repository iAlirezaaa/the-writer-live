---
name: tehran-backup-ref-gate
description: Verify immutable Tehran writer-block baseline recovery branches without confusing historical-file 404s with deleted refs.
---

# Tehran writer-block immutable backup reference gate

## Trigger and scope
Use before any Tehran map, road, building, pavement, curb, asset or collision change. This extends `city/skills/tehran-writer-block/SKILL.md` and `city/skills/mayor-release-gate/SKILL.md`; read those and `city/tasks/MAYOR-026-tehran-writer-block-3dviz-contract.md` first.

## Authoritative check
Do not use `fetch_file(ref=backupBranch,path=city/GOAL.md)` to establish the existence of a frozen snapshot. A path absent at the historical commit returns 404 even though the branch is intact.

Instead, read these exact **Git refs** in the current GitHub API:
- Private: `GET /repos/iAlirezaaa/the-writer/git/ref/heads/backup/writer-block-pre-tehran-rebuild-2026-11-09`, expected `cfdac995b6e070d472627b484c93d8fbf5f6ed2b`.
- Public: `GET /repos/iAlirezaaa/the-writer-live/git/ref/heads/backup/writer-block-pre-tehran-rebuild-2026-11-09`, expected `ececf9ffc041b1666b0425f4f1746d162b9dcf67`.
- Local backup manifest: `city/backups/writer-block-pre-tehran-rebuild-2026-11-09.md` must contain both repository names, refs and SHA values.

Read-only implementation: `node city/survey/verify-backup-refs.mjs` with `GH_TOKEN` or `GITHUB_TOKEN` possessing access to **both** repos. The public repo's default Actions token need not have access to the private repo, so a 404/403 from CI is **unverified**, not missing or verified. Never print token or use mutation APIs. Unit tests: `node --test city/tests/writer-block-backup-refs.test.mjs`.

## Interpretation
- `verified`: the actual Git-ref and exact commit SHA match, AND both manifests are consistent.
- `mismatch`: frozen ref points to a different commit; STOP and investigate, do not reset/overwrite.
- `unverified`: permission denied, 404, timeout, malformed response, wrong object type or unknown error; do not authorize a visual release.
- This verification does not ensure the backup is a *complete* usable reconstruction or that all historical files/trees are present. Audit tree/blob fingerprints separately for a recovery drill.

## 3Dviz and publication gates
3Dviz Pro Max `SKILL.md`, `TWIN-WORLD.md` and recipe `citygml-stable-id-scenario-diff` emphasize stable identities, source epoch and geometry/proxy semantics. Do not infer city model correctness from a Git backup gate. Confirm source-only default and protected writer-room ownership; inspect authoritative OSM/Overture data. For physical changes, run source-only/legacy route, collision and vehicle clearance tests, public pinned-file parity and real visual captures. Keep backup branches immutable.

## Verified retry
2026-11-10: GitHub API `git/ref/heads/backup/...` returned both branches at exact recorded SHAs. Independently executed Node.js mock-ref test suite: 6 passed, 0 failed. Verified test/module Git blob hashes against private GitHub. This is a source/test validation only, not a Three.js, traffic, screenshot or Pages deployment result.
