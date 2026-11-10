# MAYOR-067 — Civita OSM buildings and footpath 3D source import
Date: 2026-11-10
Status: TODO CREATED BEFORE CODE

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
