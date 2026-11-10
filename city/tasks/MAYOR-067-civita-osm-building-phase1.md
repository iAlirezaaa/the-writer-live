# MAYOR-067 — Civita OSM buildings and footpath 3D source import
Date: 2026-11-10
Status: SOURCE-ONLY PREVIEW COMMITTED / LOCAL TESTS PASSED / RENDER & PAGES UNVERIFIED

Owner: start constructing source-backed Civita de Bagnoregio, true 1:1 goal; change writer house exterior when real footprint is anchored. Three.js remains rendering engine unless reproducible benchmark requires migration.

## One safe measurable change
Implement and test a read-only OSM Overpass small-area vector import in the independent Civita preview. Render source-backed building **footprint volumes** (not real architectural heights) and footpath centerlines, with OSM way IDs, timestamp/license attribution and explicit proxy statuses. Preserve the old protected writer room, publisher, citizen routes, main world, and all frozen Tehran backups. Do not insert any fake building shapes or author-house placement into main world.

## Acceptance
- Validate source coordinate ring, deduplicate way IDs, reject malformed/empty paths; explicit max feature count and bbox.
- Buildings use tagged height if valid, otherwise a clearly labelled uniform temporary display height, never a surveyed height.
- Guard against accidental rendering of unsupported relations / invalid geometry, visualize roads as **centerlines**, not navigable roads with invented widths.
- One bounded browser request, visible failure state; exact OSM ODbL attribution.
- Node regression, JS parse, and if possible browser screenshot before public deployment; mirror only after passing safe checks. Verify pinned Pages status, report unknowns.

## Two novel backlog ideas
1. Match any OSM polygon touching the cliff/bridge with the regional Lazio DEM coverage and record horizontal/vertical error per polygon before placing a foundation.
2. Create a non-destructive Lo Studio architectural-reference exterior study (golden tufa, chestnut roof, gray peperino, clay tiles) without claiming exact floorplan or geographic parcel until measured and licensed.

## Safety preflight
Frozen backup branches for both repos and backup manifests confirmed. Active goal city/GOAL.md and city/skills/civita-digital-twin/SKILL.md read; 3Dviz Pro Max SKILL.md / TWIN-WORLD.md / object-craft reviewed. Old data retained solely for rollback.

## Execution report — 2026-11-10
Status: IMPLEMENTED AS SOURCE-ONLY PREVIEW; OFFLINE TESTS PASSED; DEPLOYMENT/RENDER NOT VERIFIED.

- Existing historical backup refs and manifests confirmed accessible in both repositories, not modified. Active Civita goal and 3Dviz Pro Max SKILL/TWIN-WORLD/object-craft reviewed.
- Engine kept Three.js (reuses the project's current renderer and avoids unnecessary migration); exactness is limited primarily by licensed source data, not geometry library choice.
- Implemented `web/civita-osm-vectors.mjs`: bounded OpenStreetMap Overpass query (1 request), stable way ID / ODbL attribution, polygon closure and simple-ring validation, geometric coordinate checks, duplicate handling and query/payload caps. Building heights, floors and facades remain unknown unless directly tagged.
- Implemented `web/civita-osm-render.js`: draw real-source XY building footprints as **transparent 6m provisional extrusion only when no OSM height tag exists**; when tagged, display that mapped height without certifying its survey accuracy. Render pedestrian ways as centerline-only strokes; no collision/traffic graph creation.
- Integrated renderer and neutral lights into isolated `web/civita-map-preview.js`; HTML labels source limitations honestly. Do not replace or mutate the protected writer room or the existing live world.
- Updated the Civita skill with new source/renderer lessons, two fresh actionable backlog ideas, and the published architectural constraints for Lo Studio (golden tufa, peperino lintels, chestnut structure, clay roof and two levels). **Writer's house exterior has NOT been moved or replaced yet** because the exact Lo Studio footprint/entrance and an integrated scene collision check are missing. No imaginary 'Lo Studio' footprint was added.
- Local Node v22.16.0: `node --test` on prior Civita geo tests + two new vector/renderer tests: **11 passed, 0 failed**, exit 0. `node --check` for new vector, renderer and preview modules: exit 0. Renderer test uses a mocked Three.js layer, not a WebGL screenshot.
- GitHub public/private blob SHAs matched for every synchronized city preview module, test file, skill and this task prior to this report. Public workflow includes the `web/` directory in its GitHub Pages overlay; preview remains a standalone page. CI combined status check returned an empty status list on current heads, not a successful build claim.
- NOT VERIFIED: Overpass response delivered to an actual browser, number of real Civita ways available, actual WebGL mesh appearance, terrain/cliff elevation, collisions, rendered screenshots, Pages deployment, identity/access of Lo Studio. No surveyed 1:1 full city or author-house change claimed.
- References: https://wiki.openstreetmap.org/wiki/Overpass_API ; https://www.openstreetmap.org/copyright ; https://www.civitainstitute.org/496/lo-studio.html .
- Next: capture browser/Pages proof, obtain dated licensed OSM snapshot and Italy DEM ground truth, then map one verified exterior near gate and identify Lo Studio before moving the protected room.
