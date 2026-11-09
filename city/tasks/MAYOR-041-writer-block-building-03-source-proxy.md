# MAYOR-041 — Third independent Overture building envelope
Date: 2026-11-09
Status: PRIVATE MODEL AUTHORED — static source checks passed; runtime/visual/legacy tests NOT RUN; public geometry HELD.

## TODO before any geometry edits
- [x] Verify both immutable pre-Tehran backup branches and their recorded commits; backup manifest exists in both repos.
- [x] Read city/GOAL.md, MAYOR-026, Tehran skill, 3Dviz SKILL.md and TWIN-WORLD.md; consult architecture catalog and object craft.
- [x] Model ONLY Overture feature 76931a07-c621-4e37-9241-c41ee59d4248 using its unaltered local-XZ ring; never split a possibly merged footprint.
- [x] Label height 6m and 3m scale line as **illustrative**, NOT real storeys, apartments, roof, doors or shops.
- [x] Retire duplicate translucent volume; keep 4 source outlines and protected writer room, no colliders, no cars or citizen route edits.
- [x] Add targeted test and update source-only scene probe.
- [ ] Execute targeted and legacy smoke tests (blocked: no executable private checkout or CI dispatch available in this run).
- [x] Record static validation and limitations.
- [ ] Sync runtime files private -> public after tests; verify pinned Pages assets.
- [ ] No screenshot claim unless actual day/night/top-down/street frames captured.

## Source and accuracy
Overture Maps ODbL 1.0, snapshot 2026-11-09; source ID above; footprint 2505.89 m²; vertical accuracy unknown; source polygon may represent several joined buildings. WGS84 origin (35.715361987616696, 51.3642455031707), +X east, -Z north. Writer room remains under web/world.js.

## Backlog (two new ideas)
1. Attach per-footprint OSM building:levels/entrance/POI evidence as independently dated, licensed records before any real floor or unit modeling.
2. Add a top-down source-to-render comparison view with feature IDs, footprint outlines and explicit uncertainty badges.

## Release gate
No public geometry update if author-room preservation, bounds, source-only, or legacy tests fail. Legacy citizen route failure X=0,Z=8.7 is pre-existing and must not be bypassed.

## Run results
- Private TODO commit: b4aa8987719e71980a12a737fe3c5cd09eafdea8.
- Private builder commit: 7177a78bd50f4e6dba622a158d46ae0623c532ef.
- Private integration commit: 2190c154c2dfa46b674d07bb47f69cbcfd4b739a.
- Static source validation performed against GitHub contents: 32 closed vertices, calculated area 2505.909908 m² vs source 2505.89 m² (within 0.08m²), no source height/floors, protected room exclusion, no duplicate ghost, third group wired, source-only probe updated. **These are static checks, not executed Node/Three.js tests.**
- Runtime/legacy probes: NOT RUN. Real day/night/top-down/street captures: NOT TAKEN. Deployment: NOT VERIFIED. Public runtime mirror: WITHHELD by safety gate.
- Backups checked: both branches and backup file present; original immutable SHAs resolvable. No citizen routes, author/publisher state, traffic, weather or scope modified.
