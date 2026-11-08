# City Engineering — independent city subsystem

This directory is **separate from the writer's narrative, memory, and agent personality**. It contains urban design rules, scene constraints, acceptance tests, and persistent skills.

## Source of truth
- Authoring repo `iAlirezaaa/the-writer`: `web/urban-plan.js`, `web/town.js`, `web/town-districts.js`, `web/world.js`.
- Published repo `iAlirezaaa/the-writer-live`: pinned sources `.github/city-assets/urban-plan.js`, `.github/city-assets/town-districts.js`, `.github/citizens-assets/town.js`, `.github/citizens-assets/world.js`.
- The shared `WRITER_HOME_BLUEPRINT` in urban-plan.js owns room dimensions, door/window anchors, exterior material palette and growth stages. **Do not duplicate these values in separate view files.**
- `docs/CITY_LAYOUT_V2.md` is the existing long-form handoff.

## Skills (persistent)
- `skills/road-parcel-access/SKILL.md`: roads, plots, entrances, pedestrian paths, parking, landscaping.
- `skills/building-foundations/SKILL.md`: ground-level support, facades, clearance, neighbour isolation.
- `skills/writer-home-consistency/SKILL.md`: single-room opening, interior/exterior identity, expansion and cutaway.
- `skills/city-regression/SKILL.md`: browserless Three.js checks and deployment gates.
- Existing agent integration: `.agents/skills/city-layout-rebuild/SKILL.md`.

## Workflow
1. Read the relevant skill and the source modules before editing.
2. Make a minimal geometry-safe change, preserve stable IDs and saved memories.
3. Synchronize affected modules to both repos; the public deployment uses pinned source files rather than raw `web/` copies.
4. Run `tests/urban_plan_probe.mjs`, `tests/city_districts_probe.mjs`, and available `town_scene_probe.mjs` checks.
5. Verify the latest live GitHub Pages workflow is green.
6. Perform visual inspection from street level and both day/night conditions before claiming visual perfection.

## Invariants
- One physical street-level base underneath each building.
- 3D house shell grounded at STREET_Y, no unsupported upper volume.
- Initial writer room and exterior **same width/depth, same entry, same rear window**.
- Larger interior sections cannot appear before earned growth levels.
- Town remains exterior-first; clicking author's house enters the room. The room door can return to the town.
- Landmarks must not block sidewalks; neighboring houses maintain breathing room.
- No modification to author memories, stories, resident identities or movement archive.
