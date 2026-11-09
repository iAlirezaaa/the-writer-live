# Map baseline backup — before exact Tehran writer-block reconstruction

Recorded: 2026-11-09
Purpose: preserve **the entire existing/procedural city state** before replacing any scenery or road layout with measured Tehran writer-block geometry. A backup is not evidence of real-world geographic fidelity.

## Permanent recovery coordinates
| Repository | Preserved branch | Full snapshot commit |
| --- | --- | --- |
| Private canonical `iAlirezaaa/the-writer` | `backup/writer-block-pre-tehran-rebuild-2026-11-09` | `cfdac995b6e070d472627b484c93d8fbf5f6ed2b` |
| Public deploy `iAlirezaaa/the-writer-live` | `backup/writer-block-pre-tehran-rebuild-2026-11-09` | `ececf9ffc041b1666b0425f4f1746d162b9dcf67` |

Private backup: https://github.com/iAlirezaaa/the-writer/tree/backup/writer-block-pre-tehran-rebuild-2026-11-09

Public backup: https://github.com/iAlirezaaa/the-writer-live/tree/backup/writer-block-pre-tehran-rebuild-2026-11-09

**Both branches preserve complete Git snapshots**, including project-specific materials, code and configuration. They are recovery branches; do not force push, delete, or reuse their names. Each SHA above is the exact snapshot commit; prefer the SHA over a mutable branch name when restoring.

## Verified map-module fingerprints (Git blob SHA at snapshot)

| Main map file | Private authoring blob | Public deployed overlay blob |
| --- | --- | --- |
| `web/urban-plan.js` / `.github/city-assets/urban-plan.js` | `64480b048da29fa8b140e99df09dc83e1d83a496` | same |
| `web/road-surface.js` / `.github/city-assets/road-surface.js` | `a14077d8b80e8bf38af58944528b29deac75ed96` | same |
| `web/town-districts.js` / `.github/city-assets/town-districts.js` | `069a8e6d0d33afd4cb2f9031e0e3d4a5d033db85` | same |
| `web/city-growth.js` / `.github/city-assets/city-growth.js` | `f15dc53e15a5ff48a010a00081ec2e91037924ca` | same |
| `web/town.js` / `.github/citizens-assets/town.js` | `0edd0148a22d2962ff385af7e39dd8d9bd488274` | same |
| `web/town-cars.js` / `.github/citizens-assets/town-cars.js` | `31574ff48cd734cadffdab296a047d65e5501149` | same |
| `web/objects.js` / `.github/citizens-assets/objects.js` | `fdcb4fc242794e53adf1c2313645e79f1ed57691` | same |
| `web/world.js` | `2eea9074e1efc5173e63786bbb42d496666ce895` | same for public `web/world.js`; pinned `.github/citizens-assets/world.js` is different |
| `web/tehran-environment.js` | `0240de55c60c76a3d612c88f0673dc4ecb423cdf` | same for public `web/`; pinned environment module is `b4c23c71328a3838d30facbec998e96530a6ea45` |

Public simulated-city data `snapshot/town.json`: `d4ce5e7457793212ef6eadcc1f5958013ccbc396` (exists in public backup). The **public pinned source files**, not simply `web/`, determine deployed city behavior. All full-tree dependencies are preserved on the branches.

## How to recover **only the map** (safe procedure)

1. Review the pre-change backup commit versus current `main`. Create a dedicated restore branch from **current** `main`; do not reset or force-push `main`, or merge an old whole-repository snapshot.
2. In the **private** repo, selectively restore geometry/scene files from the exact SHA:
   ```bash
   git fetch origin
   git switch -c city/restore-pre-tehran-map origin/main
   git restore --source=cfdac995b6e070d472627b484c93d8fbf5f6ed2b -- \
     web/urban-plan.js web/road-surface.js web/town-districts.js \
     web/city-growth.js web/town.js web/town-cars.js web/objects.js
   git diff --stat
   ```
3. If `web/world.js` or `snapshot/town.json` changed since backup, compare carefully first. They may include later writer, publisher, citizen or UI edits. **Never automatically restore an older whole `world.js`/data snapshot**; selectively port only necessary scene lines.
4. Run geo, urban, road topology, house, city scene, citizen and traffic regressions; check light/performance and old-vs-current geometry. Commit the narrowly scoped restore on the private restore branch; review and approve.
5. Mirror approved city files to **public** `web/` and the matching `.github/city-assets/` / `.github/citizens-assets/` pinned paths. As needed, obtain the public historical versions from `ececf9ffc041b1666b0425f4f1746d162b9dcf67`, update cache tokens and build guards, rerun the complete public CI, then publish. Do not roll back unrelated current public UI/data.
6. For any future redesign, save a new labeled backup rather than overwriting these two snapshots.

## State at capture
- Preserved exactly the current **pre-Tehran rebuild** repository versions, including the latest object builders, road mesh, car system, camera and georeferencing code.
- **No city geometry was changed by creating this backup.** No screenshots or tests were run for the backup operation itself; it is a Git snapshot, not a rendered scene export.
- Current exact Tehran writer-block boundaries are still unmeasured. Real-world rebuilding starts only after map source and rights are verified.
