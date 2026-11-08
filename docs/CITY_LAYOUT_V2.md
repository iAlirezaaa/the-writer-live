# City Layout V2 — Spatial contract and rebuild handoff

Updated: 2026-11-08. Source code is authoritative: `web/urban-plan.js` in the authoring repository, and `.github/city-assets/urban-plan.js` in the pinned public repository.

## Goal

The public experience opens with an EXTERIOR view of the town. The writer begins in a modest SINGLE-ROOM HOME; clicking the writer's house reveals the preserved detailed room/interior. The original two-storey multi-wing dollhouse should never be shown as the writer's initial exterior or visually intersect surrounding buildings. All public buildings sit on surveyed fictional parcels; access, parking and landscaping have designated physical space.

## Current implementation

- Road-first planning contract with 8 connected road segments, 17 parcels, entry anchors, parking allocation, and green buffer declarations.
- Central writer parcel reserved for gradual progression; stage zero has a 4.8 × 4.8 exterior footprint and **zero parking**.
- Growth is based on **accepted story count**, not passage of time: 0–3 / 4–9 / 10–19 / 20–39 / 40+ accepted works map to levels 0..4. Preserve the writer's authored state. This is a presentation tier, not an assertion of a real-life house.
- Central and southern streets physically joined to the perimeter street model; no freestanding roads ending short of each other. The southern building row is set back to make space for an actual road with sidewalks on both sides.
- Residential street-facing properties have modest planting strips, short access aprons and marked curbside parking. Two shared parking areas serve the dense southern blocks; paved pedestrian spurs reach every southern district front door. Public car-lane trajectories and resident routines are not changed.
- Existing character motion archive and authored interior meshes are preserved. Exterior/interior switching uses visibility, never deletion of saved data.
- Public deploy pins source modules so older snapshot exporters cannot restore the old house.
- Validation: `tests/urban_plan_probe.mjs`, `tests/city_districts_probe.mjs`, `tests/town_scene_probe.mjs` and the Pages workflow.

## Parcel and street invariants

1. Buildings never occupy the same ground footprint; enforce a positive minimum spatial separation.
2. Every building has a stable entry anchor and an approach to an existing walking/driving surface. Roof overhang may cross the footprint slightly but cannot cross another lot.
3. Parking is provided only where applicable and cannot obstruct doorways, pedestrian crossings, or car circulation. Writer level zero has no assigned private parking.
4. Main streets must form a single connected graph; secondary streets join with aligned surfaces and curbs. Roads never terminate short of intersections.
5. Garden beds, trees, benches and streetlights must not block sidewalks, emergency access or visibility at junctions.
6. In exterior mode show streets and house façades; do not expose the multi-room cutaway until the writer's home is selected.
7. The original interior contents and the real writer's memory remain unchanged. Future interior expansions require separate stage-specific layouts and should not silently relocate objects.
8. Preserve IDs `publisher`, `bookstore`, `home-west`, `home-east` and citizen station coordinates, which are existing navigation contracts.
9. Preserve Persian text/Jalali display, day/night settings, 15 observer sections, and 10 camera controls.
10. A green CI result is necessary but is **not** proof of perfect visual art direction; inspect the deployed site at desktop and mobile before certifying a release.

## Remaining art-direction and usability checkpoints

- Inspect each district block exterior from street level, not just an aerial overview; no clipped doors, hovering roof pieces, or overlapped street furniture.
- Run a camera collision/occlusion pass for the writer house at ALL five stages; reserve the whole future parcel before expanding.
- Verify parking approach and turning radius visually, plus pedestrian clearance at the northwest and southeast arterial intersections.
- Check district signage and interactable façades: selecting the writer home opens the interior; other venue selection does not teleport the user into the writer's room.
- Confirm graphical quality and legibility in both light/day and dark/night views; preserve accessible UI focus and mouse/touch picking.

## Suggested external references (evaluate license and compatibility before import)

- `lanmower/Procedural-Cities`: connected roads, plot extraction and building placement (MIT).
- `askalice/threejs-worldgen` / `threejs-city`: road/lot/building integration and terrain flattening.
- `donmccurdy/three-pathfinding`: navigation mesh routing for future citizen path improvements (MIT).
- Three.js `TransformControls`: editor snapping and visual placement debugging, not required at runtime.

Do not wholesale replace the existing handcrafted city with an external generator. Migrate algorithms into small audited modules while keeping current story, city and resident identities stable.
