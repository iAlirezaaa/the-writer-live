# MAYOR-059 — Make the public source-only Tehran block visibly inhabited
Date: 2026-11-10
Status: TODO before scene edits.

## Concrete user-visible defect
Live `web/world.js` defaults to `town` view. The source-only builder deliberately has only three 6m opaque Overture envelope proxies, non-colliding streetscape and no human meshes. Existing live camera `[41,53,91]` targeting `[0,2,-7]`, together with fog near/far 38/115, gives inadequate visibility of the real source block spanning approximately X=-120..59, Z=-22..93. The legacy citizen data may exist, but visual crowd is not sourced to the real OSM sidewalks. User requests visible buildings, streets and people in the initial view.

## Preflight safety
Both immutable backup branch heads verified on 2026-11-10: private cfdac995b6e070d472627b484c93d8fbf5f6ed2b, public ececf9ffc041b1666b0425f4f1746d162b9dcf67. Backup manifest found.
Read `city/GOAL.md`, `city/skills/tehran-writer-block/SKILL.md`, `city/tasks/MAYOR-026-tehran-writer-block-3dviz-contract.md`, `cognition/skills/3dviz-pro-max/SKILL.md`, `TWIN-WORLD.md` and `data/recipes/courtyard-house-cutaway.json`. Apply its architectural silhouette/roof-cap/ground-connection practices as *interpretive design*, not real survey.
Source OSM centerline candidate 2026-11-09, ODbL-1.0; Overture 4 ML roofprint candidates with unknown heights/floors/facades; 3 already have separate source-aligned 6m provisional masses. Protected-room-intersecting fourth stays unbuilt.

## One controlled visible-scene restoration
- Add a strictly visual, removable layer to the same existing Three.js source-only scene. Extend the **three already proven** mapped footprint envelopes upwards with opaque neutral proxy architecture and window rhythms, while retaining original exact polygons and clearly marking all height, window count, architecture and floors NOT VERIFIED. Do not split multi-building polygons or add new unsourced buildings.
- Add a small animated, anonymous and nonphysical crowd in `writer-block-illustrative-streetscape`, walking along the *already mapped* sidewalk proxy frame; source-only pedestrians are visual ambience and **not** the existing citizens' real identities/routes. Keep room and existing citizens untouched.
- Reframe only the **town geographic camera** so the source block is actually visible, with fog/far adjusted only in outdoor city views. Preserve author room interior view/controls and the source-only default.
- Scope is single visible writer-block presentation layer, not citywide reconstruction or data-faithful building levels. No physical colliders, path changes, new writer data, fictitious districts or third-party copyrighted imagery.

## Release gates
Create an executable dedicated Node/Three.js test covering upper envelopes, source IDs, all-geometry finite bounds, protected room, source-only mode, crowd density/within-block, animation changing poses, no physics/routes, and initial town camera/fog visibility. Run source-only, context, facades and writer-room tests; CI must pass private then public Pages including legacy safety. Compare actual camera/top-down screenshots if accessible; never claim captured when unavailable. Sync city-only code to pinned public assets; no touching writer, publisher or resident core code. Two new backlog ideas:
1. License-grounded per-building height/floor/entrance survey tied to Overture roofprint IDs; replace each visual proxy independently after survey and photo comparison.
2. Efficient geographic block streaming with a user-selectable 'surveyed only vs illustrative' layer toggle and LOD/pedestrian crowd density scaling per device FPS.
