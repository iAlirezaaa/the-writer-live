# MAYOR-071 — Build Civita bridge with source-backed route and structural dimensions
Date: 2026-11-10
Status: IMPLEMENTED AND DEPLOYED; ABSOLUTE ELEVATIONS UNVERIFIED

## Evidence
Engineering study: Buffarini et al. (2022), DOI 10.1007/s13349-022-00628-7, https://link.springer.com/article/10.1007/s13349-022-00628-7 . Reported 14 spans, 13 piers, roughly 19m pier spacing; first deck 16m, remaining ~16.7m; normal deck width 2.5m, first Civita span 4m; 15cm slab, 65cm beam, 3 beams except Civita first span with 5; 20 percent downhill over 5 spans from Civita, middle nearly flat, other end up 6 percent. Four 0.5m round columns/piers 1-9, two for piers 10-13; actual pier ground contacts need measured DTM and cannot be inferred.

## Single deliverable
Build a verifiable bridge source-reader and structural Three.js model using an authenticated OSM way centerline. Do not insert the bridge if the actual location/route is unverified. Source-identified polygon building heights and roofs remain provisional. The map/camera must include the entire bridge while not revealing unbuilt boundaries. Inspect artist/writer room and citizen path regression. Preserve private→public pinned parity and frozen historical backups. Real screenshots only when captured.

## Two backlog ideas
- Retrieve Regione Lazio licensed 5m DTM (photogrammetric base 2002-2003), check exact Civita coverage and vertical datum before building cliff and pier ground-contact.
- Identify exact Lo Studio parcel with permissible architecture surveys, then a single real building roof/cornice/door with verified measurement, keeping writer interior/character unchanged.

## Preflight
Read Civita active goal and skill, 3Dviz Pro Max SKILL / TWIN-WORLD / object-craft; checked frozen Tehran recovery branches and manifests on BOTH repositories. Never copy restricted Google/CyArk assets.

## Actual execution result — 2026-11-10
Status: bridge source, Three.js geometry and main scene released; absolute elevations not yet verified.
OSM bridge source: way/59997267, name Ponte Alberto Sordi e Federico Fellini, bridge=yes, ~245.38m centerline. Published visitor route length 300m is not the source-mapped bridge way length.
Engineering reference: ENEA study https://doi.org/10.1007/s13349-022-00628-7 ; 14 spans, 13 piers, 2.5m typical width and 4m first span, three 65cm prestressed beams per span (five in first), 15cm deck slab; round support columns.
Three.js code in web/civita-bridge.js produces 311 bridge objects with 44 beams and 44 round columns, anchored to OSM horizontal alignment and paper structural dimensions. Illustrative rails, pier-height selections and deck vertical datum remain explicit proxies, NOT certified measured ground/contact elevation.
Main scene web/town-civita.js loads ONLY official OSM bridge data and renders no fabricated route if source missing; web/civita-geo.mjs and world.js extend camera map reach so bridge can be visited within the available map tiles.
Actual GitHub Actions Pages deployment 42798258611 succeeded for public commit d56d84c2044e3a1e97ae12493cff7720632175e3. Tests included CIVITA-BRIDGE-SOURCE-VALID (OSM 59997267 ~246m), CIVITA-STRUCTURAL-BRIDGE-OK (14 spans, 13 piers, 44 beams, 44 round columns, 311 parts, writer appearance preserved), CIVITA-MAIN-TOWN-OK, and 4/4 WGS84/camera tests.
Both backup branches and manifests checked. Writer room, actor appearance, publisher, citizen identities and story data untouched.
Real browser screenshot, exact ground terrain, checked pier foundations, and verified Lo Studio parcel NOT obtained. Do not claim full 1:1 bridge height or cliff geometry.
Next safe improvement: licensed terrain tile/datum, then Regione Lazio 5m DTM coverage and one measured facade/roof per OSM building.
Two backlog: 1) verify Regione Lazio 5m DTM geospatial coverage, 2002-2003 age, datum, cliff/bridge grounding; 2) identify Lo Studio measured plan and tile elevations, then validate writer room/door access.
