---
name: city-layout-rebuild
description: Route all The Writer city/house/road changes to the canonical city-engineering skills and acceptance gates.
---

# City Engineering — agent discovery entry

The source of truth for this skill is **`city/skills/city-layout-rebuild/SKILL.md`**. Read that complete file before modifying geometry, road layout, house interiors, surroundings, camera views or resident travel.

Then load the relevant specialized instructions from `city/skills/`:
- `road-parcel-access/SKILL.md` — one connected road surface, markings, plots, parking, trees and access.
- `building-foundations/SKILL.md` — real street-level structural support and neighbour spacing.
- `writer-home-consistency/SKILL.md` — one 6×6 stage-zero writer room, grounded walls and synced interior/exterior.
- `city-regression/SKILL.md` — real 3D tests, cache versioning and release requirements.

**This file is only an auto-discovery shim.** Do not duplicate or amend the detailed city rules here: update `city/skills/` in both repositories. Never alter narrative memories, published story IDs or citizen identities during a city-only rebuild.
