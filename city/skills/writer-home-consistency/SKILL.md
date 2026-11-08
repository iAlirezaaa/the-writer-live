---
name: city-writer-home-consistency
description: Keep The Writer's exterior cottage and actual furnished interior spatially identical.
---
# Unified home identity skill

1. Read **one** canonical `WRITER_HOME_BLUEPRINT` from `urban-plan.js`; never separately invent cottage dimensions in the exterior renderer.
2. Stage-zero is one room, **6×6** model units, 3.2 wall height, with one front entrance at x=-1.2, and a rear window x=-1.6..0.4 and y=1.0..2.5.
3. Exterior root is at `STREET_Y`; indoor scene uses local floor Y=0 for camera compatibility. Coordinates are relative to their respective local origin, not a second floor.
4. Interior cutaway removes the obstructing frontal wall and roof only for visibility; the wall positions, door, rear window, footprint and construction materials remain consistent.
5. A click on exterior hitbox opens the actual writer room. Its front door returns to the town. No other cottage room should be shown on stage zero.
6. Future growth stages must resize *both* architectural shells using the same stage array. Do not introduce a room in the facade that does not exist internally.
7. Keep authored desk, books, memory props, writer animations and private state; isolate unused four-wing legacy architecture in a permanently hidden compatibility group.
8. Test all five levels with `writer_house_consistency_probe.mjs` and check visuals after each upgrade.

Any exterior/interior mismatch is a release blocker.

## Mandatory grounded-wall check (added after the floating-walls defect)

The `baseWriterRoomShell` and `expandedWriterRoomShell` objects are initialized before `citySceneBaseline` is captured. Therefore the later `interiorSceneObjects` filter **does not contain either shell**. A naive blanket reposition moves furniture and floor props but leaves the actual walls above the town. Always attach both explicit shells to `writerInteriorWorldRoot` after moving the scene's dynamic room objects. The parent carries `position.y=STREET_Y`; neither shell gets its own independent elevation. Verify this contract in `tests/writer_house_consistency_probe.mjs`. Make visual inspections at level 0 and after growth.

## Rebuilding and clicking
Every stage rebuild must remove former expanded-shell children from `clickables`, mark removed nodes invisible and dispose their geometry. Camera presets for `building` and `overview` must frame the single 6x6 room rather than the retired 19-unit mansion; test those invariants with `writer_house_consistency_probe.mjs`.
