# Road evidence gate — 3Dviz review note (2026-11-09)

Read `SKILL.md`, `MAYOR-026`, vendored 3Dviz `SKILL.md` and `TWIN-WORLD.md` first. Existing `web/road-surface.js` builds an axis-aligned union of road strips; its `streetY=-3` is **not** Tehran elevation. Existing road segment widths are procedural placeholders.

For one **future** measured street-furniture or road-edge asset: inspect the matching 3Dviz catalog/recipe/kit entry (do not claim one was found if no matching record was retrieved), then record source/rights, WGS84 feature IDs, positional accuracy, local X east / -Z north transform, sidewalk/door clearances, grounded contact, silhouette and join quality, material scale, reusable mesh/LOD budget, and baseline day/night/overhead/street captures. Test road topology, collisions, accessibility, writer-house consistency and frame budget before private-to-public sync.

Current evidence: backup branch names and manifest were verified; no street dataset, block boundary, matching 3Dviz recipe, browser screenshot, runtime test or public deployment was verified. Treat the current road geometry as proxy.
