---
name: city-layout-rebuild
description: Maintain the road-first urban layout, growth-based writer home, and strict geometry/access acceptance gates for The Writer.
---

# City Layout Rebuild — execution skill

## Activation
Use whenever modifying the city, homes, writer exterior/interior, building footprints, entrances, parks, roads, parking, camera views or citizen movement routes.

## Mandatory read order
1. `docs/CITY_LAYOUT_V2.md`
2. `web/urban-plan.js` (canonical schema) or the pinned live `.github/city-assets/urban-plan.js`
3. `web/town.js`, `web/town-districts.js`, `web/world.js`
4. `tests/urban_plan_probe.mjs`, `tests/city_districts_probe.mjs`, `tests/town_scene_probe.mjs`

## Procedure
1. Record which parcel/road/entry ID is changing. Do **not** move established citizen homes or publish fictional trips as actual observations.
2. Alter the road graph **first**; all road endpoints must intersect a real other segment, except an explicitly designed pedestrian cul-de-sac.
3. Update parcel boundaries/clearance, entry anchors, sidewalks, parking, planted buffers, and rendered 3D geometry together. Run validation before changing any decorative asset.
4. Keep writer's **stage-zero house one room, 4.8×4.8**, and no parking. Only expand based on accepted stories. Protect the future maximum parcel and do not expose locked rooms.
5. The opening view must be town exteriors. Clicking writer's exterior switches to preserved interior; do not display the old wide dollhouse outdoors. Keep back/return to city navigation clear.
6. Check every real `THREE.Box3` bounding volume at road and doorway elevations. Ensure all entries are reachable from pedestrian or driving networks. No props or signs cover navigation.
7. Treat shared palettes and geometry resources as cached. Keep day/night coherent without introducing excessive light sources.
8. Do **not** remove observer tabs, Persian/Jalali localization, resident routines, shared citizen motion library, current story/book IDs, or save-state memory.
9. Sync authored source and the pinned deployment files across **both repositories**; update deployment guards/cache pins and test imports whenever changing a module.
10. Run `node tests/urban_plan_probe.mjs .`, `node tests/city_districts_probe.mjs .` where applicable; run `node --experimental-vm-modules tests/town_scene_probe.mjs . layout < snapshot/town.json` for live builds; confirm Pages deployment success.
11. Review screenshots/manual street-level inspection for all home tiers, entrance visibility, parked vehicles, rooftop clipping, and mobile touch selections. A green static test alone does not prove visual perfection.

## Reject change when
- Parcel collision or urban road disconnection is detected.
- An entrance or parking approach cannot reach a traversable surface.
- Initial house displays more than one residential room or a multi-wing mansion.
- The visible facade has no working route into the writer interior.
- Old publisher overwrites the new pinned assets or any regression gate fails.
- A visual change silently mutates actual writer memories, accepted stories or the citizen roster.

## Repos & portability
- Authoring project: `iAlirezaaa/the-writer` (`web/`, `tests/`).
- Public deployment: `iAlirezaaa/the-writer-live` (pinned `.github/*-assets/`).
- External algorithms may inform implementation, not replace project-specific stable IDs or current navigation contracts.
