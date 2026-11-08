# Citizen & Publisher Rebuild — Master Tracker
**Version:** CR-01 · **Date:** 2026-11-08 · **Status:** Working implementation; 10-window runtime geometry gate passed; full-day/visual QA pending

> **Single source of work status.** Before any future citizen edit, review and update this file. Do not silently mark an item finished just because a file was committed. Preserve it as an auditable record of completed, partial and deferred requirements.

## Product intent (immutable brief)

Create a believable fictional town, not a decorative crowd. Every ordinary citizen must have a distinct, role-consistent look, readable core identity, daily plans, route, reusable acting clips, and a profile accessible by clicking the 3D actor. Ordinary citizens must **not** run conversations, LLM calls, memory writes or autonomous tools until explicitly approved. The publisher is different: it must retain a persistent identity, existing meetings and editorial decisions, and learn slowly from evidenced revisions by the writer. Residents must not visibly overlap. Real/private publisher experiences must never leak to the static public Pages site.

## Architecture and canonical files

| Layer | Files | Scope |
|---|---|---|
| Authored resident cores | `writer/citizen_cores.py` | 12 names/roles with value, flaw, desire, habits, appearance configuration and explicitly disabled capabilities |
| Pure daily plan | `writer/town.py` | Independent authored daily routines, places, server-aligned clock, privacy-safe public publisher proxy; **no I/O or active social agents** |
| Browser compatible core | `web/citizens.js` | Fallback profiles for older public snapshots, actor rig, visible paths, collision checks, clickables; mirrored authoring until schema-validated snapshots are regularly published |
| Single shared motion archive | `web/citizen-motion-library.js` | One module shared by everyone; procedural clip definitions and pose evaluation, no animation re-generation per resident |
| Author/world integration | `web/world.js` | Pass shared animation module, load town, optional private publisher identity, panels |
| 3D click/card | `web/objects.js` | Core, current action, destination, path, future capabilities; publisher revision lessons |
| Persistent publisher | `writer/publisher.py`, `writer/publisher_identity.py` | Same existing persona and submission ledger plus evidence-bound editorial learning and core |
| Tests | `tests/test_citizen_cores_v2.py`, `tests/citizens_v2_probe.mjs`, existing `tests/test_town.py`, `tests/citizens_probe.mjs` | Data purity, growth and runtime geometry |
| Public deploy | `the-writer-live/.github/citizens-assets/`, `prepare_citizens_deploy.py`, `pages.yml` | Pin reviewed world assets against an older local publisher sync; validate in actual GitHub Pages artifact |

## Implementation ledger

| Requirement | Status | Evidence / limit |
|---|---|---|
| 12 individual fictional citizen cores | **DONE** | Unique names, values, flaws, desires, temperaments; stable identifiers |
| Visually distinct citizens | **PARTIAL** | Silhouette, stature, hair, coat and occupation-specific props differ in procedural Three.js; no hand-sculpted production meshes or material atlas |
| Occupational props properly parented | **DONE — code** | Bags, folios, aprons, cups, lantern-role identifiers use the citizen rig; detailed browser visual QA remains |
| Shared animation catalogue | **DONE — procedural v1** | 10 clip IDs, shared motion module; sleep, idle, walk, read, work, carry, sweep active; greet defined, not scheduled; listen/talk disabled |
| Reusable animation instances without rebuilding clips | **DONE** | Shared definitions imported once; resident pose output buffer reused per frame |
| Individual daily schedules | **DONE — authored** | Existing unique minute-of-day activities preserved; no goal-generating autonomous planner |
| Clear route geometry | **DONE — v1** | Walkway graph, currently planned path guide, selected actor highlight, persistent destination marker |
| No ordinary citizen mesh overlap | **PARTIAL / tested** | 0.61-unit point/capsule distance guard and pre-assigned conflict-free venue slots; no full agent passing/queuing solution yet |
| Citizens returning home | **DONE — simplified** | Indoor resting citizens hidden to avoid stacking at the doorway until interior spaces exist |
| Citizen click → identity/core | **DONE** | Safe text-only detail card showing core, routine and remaining route |
| Ordinary conversations | **DORMANT BY DESIGN** | No API, prompt, transcript writes or outgoing calls |
| Ordinary long-term memory | **DORMANT BY DESIGN** | Only inactive data contract, no durable memory log or learning |
| Publisher independent world actor | **DONE — integration** | Visible at publisher entrance; distinct wardrobe, special backend identity in private, safe public proxy |
| Publisher complete writer-like persona | **PARTIAL** | Persistent named identity, ambitions, conflict, taste, meetings, editorial lessons; not full parity with writer's inner diary/independent projects/goal engine |
| Publisher learns from edits / experience | **DONE — limited evidence loop** | First review is baseline. Subsequent changed independent critic scores or print decisions of same story add bounded deduplicated editorial lessons; historical conversations and trust preserved |
| Publisher self-evaluation from free-form dialogue | **NOT STARTED** | Current lessons are tied to real manuscript submissions, not speculative unverified edits |
| Public/private sync and privacy | **DONE — pinned workflow** | Static proxy public; real publisher meetings/lessons private; JS pinned under .github/citizens-assets |
| Browser visual sign-off on actual deployed site | **NOT VERIFIED** | Code and geometry tests do not equal a real screenshot/UX inspection of the live page |

## Shared motion archive — do not rebuild clips

`web/citizen-motion-library.js` is the canonical runtime archive:

| ID | Purpose | Status |
|---|---|---|
| `sleep` | subtle rest/breathing | enabled |
| `idle` | gaze/fidget/breathing | enabled |
| `walk` | gait and opposing arms | enabled |
| `read` | book + page gesture | enabled |
| `work` | paperwork/hand gesture | enabled |
| `carry` | package balance | enabled |
| `sweep` | sweeping work | enabled |
| `greet` | one-shot greeting | defined but not scheduled |
| `listen` | active social attention | **disabled** |
| `talk` | mouth/gesture during conversation | **disabled** |

**Archive type:** procedural functions, **not** FBX/GIF/video clips. Do not claim these are already finished skeletal animation assets. Any later authored GLB clips must map onto the same immutable IDs and share a cache across all citizens.

## Collision and movement rules

- Walkway navigation uses the authored `buildRoute` network and a single crossing corridor; never move citizens directly through buildings.
- Station positions for each destination are coloured from conflicts in **existing schedules**: two visitors who overlap in time at the same venue receive separate slots.
- Minimum visual 2D separation: approximately `0.61` world units for visible citizen roots.
- Routes use stop-before-overlap instead of penetrating another actor. Future update should implement reservation and passing for two-way narrow paths; current scheme may halt two actors facing each other.
- Publisher stands just inside office entry; publisher identity and route remain separate from ordinary citizen world agents.
- Note: cross-traffic with **moving cars** is not yet coupled to pedestrian crossing permissions, and requires its own test before asserting complete traffic safety.

## Publisher evidence and privacy

- The real publisher already has `publisher.json` and meetings ledger. New `publisher_identity.py` adds core view and `editorial_memory` episodes.
- `learn_from_review` compares the latest **same-story** recorded score and decision against the new one. Exactly repeated reviews add no lessons; learning deltas are capped; only metadata from actual publisher submissions may modify this memory.
- The publisher's literary publication threshold in `publisher_policy.py` remains independent of these slow editorial skill increments.
- The backend displays full publisher core under `/api/publisher` privately. Public `town.view` projects a static fictional publisher proxy without the private meetings/lessons. The frontend must never fetch `/api/publisher` on GitHub Pages.
- Ordinary citizens have `conversation.enabled=false`, `memory.enabled=false` and `autonomy.enabled=false` even if a malicious snapshot advertises those systems as enabled.

## Testing and evidence

- Browserless local module simulation against the older published town snapshot: 13 actor roots, 26 pickables, 10 clip IDs, ordinary social systems dormant, initial 100-second scenario minimum separation about 0.62.
- GitHub Pages real Three.js geometry probe: **2026-11-08** build `42474445650` passed: 1,950 samples across 3 periods, minimum visible spacing approximately **0.68**.
- Extended real Three.js test: **2026-11-08** live build `42474641132` **PASSED** across **10 different schedule windows** and **4,500 individual time samples**; minimum separation approximately **0.68**; no visible root overlap below the test threshold. This is not a full continuous 24-hour or car/pedestrian collision proof.
- `tests/test_citizen_cores_v2.py` covers core variety, disabled capabilities and publisher learning. Python test suite has **not** been executed on a working private runner in this session.
- Existing `tests/citizens_probe.mjs` predates indoor-hidden behavior: adjust outdated visibility expectations before claiming all old regression tests pass.
- Full scene visual QA, actual click raycast inspection, mobile device QA and simultaneous vehicle/pedestrian interactions remain unverified.

## Next work — prioritized checklist

- [ ] P0: Run all legacy Python/Node citizen tests; update only genuinely stale expectations (never weaken collision assertions).
- [ ] P0: Test all 24 hours and transitions, including vehicle conflicts at the street crossing; fix stalls before full collision sign-off.
- [ ] P0: Browser QA on deployed public/private apps: click torso/head, visibility from city camera, correctly anchored route line, identity contrast and readable mobile card.
- [ ] P1: Procedural rigs → higher-quality reusable GLB rig variants and a shared cached clip pack with LOD/instancing. Do not generate duplicates per character.
- [ ] P1: Implement a deterministic pedestrian passing/queueing reservation system for narrow two-way corridors.
- [ ] P1: Make ordinary residents' daily goals react to **observable** simulation state while retaining explicit safety/agent-off boundaries.
- [ ] P1: Generate browser-facing core fallbacks from Python schema to eliminate duplicated authoring.
- [ ] P1: Publisher full parity with writer: separate project goals, inner reflection log, editorial milestones and careful human-reviewable memory consolidation, without unverified auto-claims.
- [ ] P2: Define permissioned opt-in conversation/memory RFC for ordinary residents; **do not activate** until owner explicitly requests it.
- [ ] P2: Performance tests under 50+ actors, shadow/material budgets, browser GPU profiling.
- [ ] P2: Public-page descriptions for the publisher proxy must clearly state that private personal notes are omitted.

## Change safety and review procedure

Before a new phase: compare this tracker with actual files and running CI; update statuses only when evidence exists. Leave a changelog entry for any altered ID, appearance, routine, core or animation clip. Do not edit story/publishing payment logic, automobiles, reader code or writer identity during a citizen-only update without a separate request. No PR required for this iteration; commits were pushed directly to `main` as requested in earlier work.

**Live review:** https://ialirezaaa.github.io/the-writer-live/?v=citizens-20261108-v1
**Live CI:** https://github.com/iAlirezaaa/the-writer-live/actions
**Private source:** https://github.com/iAlirezaaa/the-writer
