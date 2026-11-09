# Urban code — municipal layer

## Boundaries and order of authority
All rules below apply to scenic city geometry, not the author's room, publisher decisions, stories, citizen identities or motion archive. Keep existing stable building identifiers, camera views, Persian UI and Jalali dates intact. City source is `web/urban-plan.js`, `web/town-districts.js`, `web/city-growth.js`, `web/town.js`, with pinned mirror files in the live repository.

## Ground and road engineering
- One continuous asphalt union from `ROAD_SEGMENTS`; road pieces on the same elevation, upward normals, no z-fighting. Every road must connect to the same road graph.
- Reserve a pedestrian route at least 1.5 scene units wide, a plausible door landing and access to a street for each public venue; next pass must visually verify clearances.
- A traffic sign is NOT traffic enforcement. Painted crossings, yield handling, vehicles and route splines require separate behavior tests.
- Emergency lanes and visibility around crossroads must remain free of foliage, signs, benches and parking. Do not invent an operational police service or traffic rule engine.
- Studio off-site driveway joins the forest exit; no blocked deliveries or floating entrance steps.

## Land use and 400-person planning
- Housing rows contain 12 buildings with 4 storeys and 3 apartments per storey; planning assumption 3 residents per apartment => theoretical **432-person capacity**. This does not spawn people or assert occupancy.
- Never place a residence on an occupied plot or street. Preserve facade set-backs and light separation; protect the legacy writer, publisher and bookstore plots.
- School and police are reserved civic sites, not fully functional simulations. Scriptwriting/storyboarding office is a cultural venue only; film production studio remains on the outskirts.
- Provide later: accessible public interiors, signage, emergency access, bin collection, water/power infrastructure and a local services inventory.

## Urban life / performance budget
- Share geometries and materials; batch repeated trees, windows and seasonal props in InstancedMesh.
- Ambient birds/cats are pooled illustrative actors; they do not become citizen database rows. Reuse and extend the existing motion archive only for actual citizen characters.
- No continuous allocation during frame animation; no new per-building real-time lights. Night windows rely on shared emissive materials.
- Weather is an explicit fictional scene effect and must never be presented as a real-world forecast.
- Create Easter eggs as optional scene discoveries, not new claims about author/publisher events.

## City expansion spatial directions
North = negative Z: layered mountains farther behind the existing ridgeline. East = positive X: the primary outbound road runs toward evergreen forest, with a side driveway to the film stage. Keep this geographic orientation on all future iterations.

## Acceptance
Validate with `tests/urban_plan_probe.mjs`, `tests/city_districts_probe.mjs`, and `tests/town_scene_probe.mjs`. Then verify the current Pages workflow and inspect street-level, overhead, winter/night and mobile screenshots. If a phase fails, do not mark it visually finished.

## Geographically faithful Tehran writer-block phase (supersedes hypothetical spatial placement)
- The project's long-term geography is a real-city digital twin of Tehran. The current approved **build extent is one road-bounded block containing writer-home WGS84 35.715361987616696, 51.3642455031707**, not the whole city. The existing `ROAD_SEGMENTS`, housing, studio, mountain and forest are procedural placeholders unless independently surveyed; do not present them as actual Tehran alignments.
- Derive the initial block polygon and meter-accurate road edges, sidewalk widths, crossings, parcel footprints, roof massing, terrain elevations, green plots and street fixtures from attributed rights-cleared data. Survey/validate WGS84 projection, control points, scale, street heading and source timestamps; never guess coordinates or 1:1 precision.
- During this phase, defer reconfiguring roads and parcel positions outside the writer block, regardless of older east-forest/north-mountains plans. Preserve stable scene object IDs, public accessibility and current resident mobility contracts.
- For every new/improved prop, consult `cognition/skills/3dviz-pro-max/` and the city skill `city/skills/tehran-writer-block/SKILL.md`. Prioritize proportions, silhouettes, support/contact, coherent openings/materials, and render-cost/LOD. Do not mark a prop visually accepted until actual screenshot review.
