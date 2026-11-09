# MAYOR-054 — Git-ref backup integrity gate (recovery of prior 404 blocker)
Date: 2026-11-10
Status: IMPLEMENTED AND TESTED LOCALLY; read-only city evidence gate; no geometry change

## One safe, measurable task
Implement a read-only, independently testable verification utility for both immutable writer-block pre-Tehran rebuild backup branches, using the GitHub Git-ref endpoint instead of attempting to open `city/GOAL.md` at the 2026-11-09 backup commit (the file was not present at capture time, so 404 does not imply branch removal). Verify branch name and full commit SHA with exact matching; missing permission, timeout, 404, or any mismatch MUST fail closed and never report success. Verify a local backup-manifest consistency check too.

## Verified preflight (direct GitHub ref reads, current run)
- Private `iAlirezaaa/the-writer`: branch `backup/writer-block-pre-tehran-rebuild-2026-11-09` present; `cfdac995b6e070d472627b484c93d8fbf5f6ed2b`.
- Public `iAlirezaaa/the-writer-live`: branch same name present; `ececf9ffc041b1666b0425f4f1746d162b9dcf67`.
- Backup manifest present at `city/backups/writer-block-pre-tehran-rebuild-2026-11-09.md` in both current branches with identical Git blob SHA `4821f550f9228adb7ba68e188ca8ee8a10b2dd04`.
- This is a ref and manifest check, NOT a complete recovery exercise or test of the historical full tree.

## Constraints
Source-only default, protected writer room in world.js, citizen routes, authorship, publisher logic and the rest of the city stay unchanged. No map meshes, city geometry, traffic, UI or vehicle state in this task. Backups must never be rewritten.

## 3Dviz quality reference
Read `cognition/skills/3dviz-pro-max/SKILL.md`, `TWIN-WORLD.md`, and `data/recipes/citygml-stable-id-scenario-diff.json`: preserve stable source IDs/epoch and separate object identity/evidence from presentation. No asset edit in this task.

## Acceptance
1. Both immutable SHA refs match exact values; 404, missing/forbidden, timeout, invalid JSON and mismatched SHA are distinct non-success states.
2. Never send credentials to logs or change any branch.
3. Run isolated mock tests for success and failure; actual live ref verification performed separately using connected GitHub.
4. Private first, public second only mirror city-only verifier/test/skill/doc. No public geometry or pinned files.
5. Distinguish self-test success, whole-scene regression, screenshot capture and deployed Pages status; do not infer one from another.

## Two backlog ideas
- **Frozen snapshot manifest checksum probe**: compare the historical commit's full Git tree and critical city blob hashes to the backup manifest without modifying its ref.
- **Road-profile evidence gate**: per OSM street segment store measured curb-to-curb width, independent sidewalk widths, parking restrictions and date/licence; block modifications of parked vehicle envelopes when values are only proxy estimates.

## Completion evidence
Implementation in private:
- `city/survey/verify-backup-refs.mjs` (GitHub GET-only, strict exact ref/SHA and manifest, no mutation);
- `city/tests/writer-block-backup-refs.test.mjs` (six mock tests);
- `city/skills/tehran-backup-ref-gate/SKILL.md` (reuse and 3Dviz evidence separation).

Actually executed in isolated Node.js v22.16.0 workspace from exact source/test bytes: `node --test city/tests/writer-block-backup-refs.test.mjs` returned 6 PASS / 0 FAIL / 0 SKIP. Local Git blob hashes matched the committed private files exactly: verifier `883851bef958032736578212d4970c1a93a30418`, tests `9ddea7dba49129289dd6ef3c13dc457dbe8abc3c`.

Actual current GitHub API `git/ref` calls returned both expected SHA values, independent of mocked tests, and both current backup manifests existed with matching blob `4821f550f9228adb7ba68e188ca8ee8a10b2dd04`.

Full Three.js/world, legacy traffic, visual captures, recovery checkout and public Pages deployment: NOT tested/verified for this task. No geometry, roads, room, citizen path or deploy-pinned JS changed. Public mirror status to be confirmed separately.
