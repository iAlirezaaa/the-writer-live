# Writer apartment → main Satarkhan street → Park Sattarkhan source gate
Date: 2026-11-09
Status: owner approved extension; actual connecting ways/park polygon NOT YET ACQUIRED.

The protected WGS84 apartment remains at 35.715361987616696,51.3642455031707 (+X east, -Z north). The old writer block is phase zero, not the new permitted maximum. User now permits source-derived nearby alleys toward main Sattarkhan street and Park Sattarkhan only, in measured stages.

## Iranian and geospatial sources
- IranGah https://irangaah.ir/places/parks/tehran/satarkhan : park location point 35.71570N,51.36735E, Satarkhan between Niayesh and Shadmehr. Point NOT shape/entrance.
- Mapcarta https://mapcarta.com/W448551081 : © OSM park way 448551081; approximate center 35.7166N,51.3676E, which differs from IranGah point. Acquire exact entire polygon.
- Bamsara https://www.bamsara.com/24328/ : 127m² apartment, Falahat Pour street, dated 1401/09/19, one unit per floor, built 1386, but street number hidden. NOT proven to be user's apartment.
- Shishdong https://shishdong.com/homes/c_Tehran/l_Sattarkhan/a_property/t_Apartment : broad neighborhood floor examples 3,4,5; NOT precise building survey.
- ArchBim https://archbimco.com/pages/project-pages/narenj.html : unrelated Behboudi/Sattarkhan project, five residential floors plus pilot and cellar; archetype only, NOT at owner anchor.
- Municipal property and permit resources https://map.tehran.ir/ , https://my.tehran.ir/ , https://urban.tehran.ir/Inquiry : require permit/parcel identifiers/authorization; allowed storeys do not establish actual built floors.
- Regional imagery https://amordadnews.com/71881/ : ambiance reference only; do not copy photographic textures without rights.

## Bounded, legally sourced follow-up
1. Retrieve full OSM polygon with version/tags/coordinates for way 448551081 from official OSM/Overpass, and a dated highway graph connecting the home block to the park and main street.
2. Use a query rectangle roughly latitude 35.7147..35.7175 and longitude 51.3636..51.3684 only as **acquisition bbox**, NOT a fabricated road boundary.
3. Route through actual junction nodes; identify street/service/footway ways and tags with OSM IDs, WGS84, timestamp and ODbL attribution. Flag unknown width, sidewalk and speed signs.
4. Model ONLY verified segments in a separate low-collider or non-colliding source-only corridor group with rollback, avoid citizen-route/vehicle-traffic mutation, and preserve writer room and local coordinate origin.
5. Obtain exact permit/as-built evidence for the user's building before asserting real floors/unit count or storefronts; no public property/owner identifying information needed in repo.

No full OSM park polygon or validated corridor street geometry has been acquired in MAYOR-046. The owner-defined writer-room floor-3 relocation is a separate transparent simulation scenario, not a real third-floor certification.

## Completed OSM phase-one corridor: MAYOR-047
- Existing 2026-11-09 official OSM source has three alley branch ways at local x approximately 18..60: پنجم دریان نو (36697706), ششم دریان نو (92200441), نهم دریان نو (481439240). Their existing source endpoints connect via علی نبی پور (471546873) and خلیل میکائیلی (36697711) to real ستارخان highway=primary (207742970).
- Licensed exact subranges are compiled in web/writer-satarkhan-osm-corridor.js and validated against the complete source JSON with five shared OSM way nodes. Main St segment x 145..225 m, z -140..-38 m. Source preview does NOT mean real road widths or new physical navigation.
- Model intentionally stops short of Park Sattarkhan way 448551081 until its full OSM geometry and the missing road segments are fetched and proven continuous. Do not relabel a visual link as a park route.

## MAYOR-048 — paired source Sattarkhan one-way carriageways (2026-11-09)
The 2026-11-09 official OSM capture contains the second primary way 1232461345 (`lanes=4`, `oneway=yes`, `maxspeed=50`, `sidewalk=right`), with contiguous subset indices 3..6. Its centerline direction opposes previously rendered way 207742970, providing source evidence for **two mapped one-way primary strips**, but no reliable true 4-lane width or paint-survey positions. The scene now carries a reversible authored width and dashed-marking overlay with explicit metadata. No park geometry or registered apartment floors were inferred.
