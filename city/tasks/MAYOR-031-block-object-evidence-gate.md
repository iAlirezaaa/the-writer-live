# MAYOR-031 — Single-object evidence gate for Tehran writer block
Date: 2026-11-09
Status: TODO / documentation-only; no geometry change, screenshot, test execution or deployment claimed.

## Preflight
- Verified both immutable backup refs by fetching `web/urban-plan.js` at each named backup branch and exact historical SHA; all returned blob `64480b048da29fa8b140e99df09dc83e1d83a496`.
- Verified `city/backups/writer-block-pre-tehran-rebuild-2026-11-09.md` exists in private and public main.
- Read `city/skills/tehran-writer-block/SKILL.md`, `city/tasks/MAYOR-026-tehran-writer-block-3dviz-contract.md`, `cognition/skills/3dviz-pro-max/SKILL.md`, `TWIN-WORLD.md`, `web/urban-plan.js` and `city/survey/README.md`.
- Current OSM evidence: candidate centerline block, not measured curbs/parcel limits. The seven query-area buildings lack verified heights. Do not infer precise dimensions.

## One bounded next object: existing street-side fixture (research first)
- TODO: identify one **already present** fixture inside the candidate writer block, locate its owning Three.js builder, and establish a non-proprietary, legally reusable Tehran-specific reference before modifying its mesh.
- 3Dviz decision: review appropriate signboard/lantern recipe and kit **source and license**, reuse only construction methods (silhouette, structural connections, material response, ground contact, LOD), never transplant an unsupported historical shape.
- Record fixture ID, existing world position and bounding box, candidate-block containment, evidence URL/date/license, uncertainty, orientation and real scale; if any are unavailable, mark unknown and **do not change geometry**.
- Before any actual mesh edit, capture baseline overhead, street-level, close-up, daylight and night frames; preserve object picking, road clearance, citizen paths, author house and procedural street operation.
- Then change one fixture only in private; run applicable city probes, compare before/after frames and measured performance, and mirror only passing city assets to the public pinned path. No such change is authorized by this document alone.

## Two backlog ideas
1. **Source-linked fixture registry:** feature-to-OSM/photo correspondence, license and date, uncertainty, owner builder, world-space bounds, and visual evidence.
2. **Block-only visual QA harness:** fixed WGS84-based cameras, same camera/exposure day/night captures, collision and draw-call comparison; no automatic widening beyond the road-bounded candidate.

## Outcome
Documentation only. No runtime code or physical map was changed. Tests, captures, build and deployment: NOT RUN. This is not evidence of geographic 1:1 accuracy.
