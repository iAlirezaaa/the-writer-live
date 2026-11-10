# MAYOR-059 — Cross-tile identity regression (2026-11-10)

Status: TODO registered before code changes.

## Scope
Add one read-only Node regression test for an OSM feature crossing adjacent Web Mercator tiles. Require one immutable source ID in the feature manifest and references to that ID in each touched tile; no duplicate per-tile feature objects. Do not change rendering, meshes, city routes, citizens, writer room, weather, or deployment.

## Prerequisites
- Private/public pre-rebuild backup manifests and branches checked; preserve both.
- Consulted 3Dviz Pro Max SKILL.md and TWIN-WORLD.md: stable object identity, deterministic geometry, shared GPU ownership. No object construction in this test-only iteration.

## Verification plan
Run `node --test city/tests/tehran-geotile-index.test.mjs` and the existing city safety suite in an executable checkout or CI. If execution is unavailable, record unverified and do not claim a pass. This is metadata-only and cannot certify collision, screenshot quality or Pages deployment.

## Backlog
1. Tile-reference-counted geometry cache with explicit ownership and GPU disposal test.
2. Source provenance overlay exposing feature ID, license, observation date, and unknown-height status.
