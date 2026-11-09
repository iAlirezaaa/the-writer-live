# MAYOR-031 — Public Pages blocked by stale pinned Tehran weather anchor
Date: 2026-11-09
Status: COMPLETE — pinned city-weather parity and public Pages CI/deployment confirmed.

## Reproducible blocker from MAYOR-030
The actual public GitHub Pages preparation job at https://github.com/iAlirezaaa/the-writer-live/actions/runs/42603491954 executed and failed **before** the new road-preview test with:
`AssertionError: Weather latitude must match the writer-home WGS84 anchor`, actual `35.6892`, expected `35.715361987616696`.
The public `web/tehran-environment.js` and private canonical file have identical blob `0240de55c60c76a3d612c88f0673dc4ecb423cdf`, but the public pinned deployment copy `.github/city-assets/tehran-environment.js` is stale blob `b4c23c71328a3838d30facbec998e96530a6ea45`.

## Safe, minimal corrective sync
- [x] Confirm original backup branches and manifest per MAYOR-027 (do not touch them).
- [x] Verify affected module is only city weather source; no writer/citizen routes or geometry changes.
- [x] Sync **only** the approved private `web/tehran-environment.js` into the existing public pinned `.github/city-assets/tehran-environment.js`.
- [x] Re-run the public Pages job and verify all built-city tests, especially the new OSM overlay. If CI still fails, report exact next blocker and no deployment.
- [x] Keep OSM visual preview and weather synchronization as separate changes/commits.

## Two city backlog ideas
1. Automated parity failure before Pages copy: assert blob/content parity for `web/tehran-environment.js` and pinned `.github/city-assets/tehran-environment.js` at every publish.
2. Add an end-to-end deployed-page read that verifies weather request latitude/longitude and the OSM road-preview module without exposing provider/consumer secrets.

No new weather behavior is introduced; this only restores the already-authorized home-anchor request used in private and public web source.

## Fix and proof
- Public pin restored with commit: https://github.com/iAlirezaaa/the-writer-live/commit/65515b71fa9eeb703ada4d377d21232635311acc ; resulting Git blob `0240de55c60c76a3d612c88f0673dc4ecb423cdf` matches private and public `web/tehran-environment.js`.
- Verified Pages CI: https://github.com/iAlirezaaa/the-writer-live/actions/runs/42604022465. `TEHRAN-ENVIRONMENT-OK` and scene/traffic tests passed. No live provider-network or day/night browser visual test was performed.
