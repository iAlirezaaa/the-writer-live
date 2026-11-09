/* Immutable, dated REAL coarse SRTM30 terrain source copied verbatim from
 * city/survey/output/writer-block-dem-srtm30m.json.
 * NASA/USGS SRTM V3 through OpenTopoData; NOT a surveyed land parcel.
 * No runtime network request. Attribution and uncertainty included.
 */
export const WRITER_BLOCK_DEM_SOURCE = Object.freeze({
  "schemaVersion": 1,
  "kind": "SRTM30M_APPROXIMATE_TERRAIN",
  "sourceDataset": "NASA SRTMGL1 V3",
  "providerDataset": "srtm30m",
  "provider": "OpenTopoData",
  "apiEndpoint": "https://api.opentopodata.org/v1/srtm30m",
  "sourceInfo": "https://www.usgs.gov/centers/eros/science/usgs-eros-archive-digital-elevation-shuttle-radar-topography-mission-srtm",
  "providerDocs": "https://www.opentopodata.org/datasets/srtm/",
  "licenseNotes": "NASA/USGS public access; respect OpenTopoData API usage limits, cite NASA/USGS/OpenTopoData. Not cadastral or engineering-grade.",
  "captureTime": "2026-11-09T11:22:36.987Z",
  "sourceAcquisitionPeriod": "2000-02 (SRTM mission)",
  "crs": "EPSG:4326",
  "verticalDatum": "EGM96 geoid",
  "unit": "m",
  "nominalRasterResolutionMeters": 30,
  "interpolation": "bilinear",
  "horizontalUncertainty": "SRTM 1 arc-second raster, not parcel-grade GPS",
  "verticalUncertainty": "Radar/DSM-like first-return effects; not verified ground or building height",
  "workScope": "writer-block-only; bounding rectangle samples for clipping to OSM road-bounded candidate",
  "homeAnchor": {
    "lat": 35.715361987616696,
    "lon": 51.3642455031707,
    "elevationMetersEGM96": 1242
  },
  "blockBoundary": {
    "status": "OSM_CENTERLINE_CANDIDATE",
    "ringLocalXZ": [
      [
        38.257,
        -21.571
      ],
      [
        47.659,
        11.427
      ],
      [
        58.789,
        50.483
      ],
      [
        -99.418,
        92.956
      ],
      [
        -119.352,
        20.503
      ],
      [
        38.257,
        -21.571
      ]
    ],
    "osmWayIds": [
      "osm:way:4292858",
      "osm:way:481657106",
      "osm:way:36697708",
      "osm:way:36697711"
    ],
    "osmSourceCapturedAt": "2026-11-09T09:22:58.743Z",
    "osmLicense": "ODbL-1.0"
  },
  "grid": {
    "width": 9,
    "depth": 7,
    "bounds": {
      "xMin": -119.352,
      "xMax": 58.789,
      "zMin": -21.571,
      "zMax": 92.956
    },
    "heightsMetersEGM96": [
      1240,
      1240,
      1240,
      1240,
      1240,
      1241,
      1242,
      1242,
      1243,
      1238,
      1239,
      1239,
      1240,
      1240,
      1242,
      1242,
      1242,
      1243,
      1237,
      1238,
      1239,
      1239,
      1240,
      1241,
      1242,
      1242,
      1242,
      1236,
      1237,
      1238,
      1238,
      1238,
      1240,
      1240,
      1241,
      1242,
      1235,
      1235,
      1236,
      1237,
      1238,
      1239,
      1239,
      1240,
      1241,
      1234,
      1234,
      1235,
      1236,
      1237,
      1237,
      1238,
      1238,
      1239,
      1234,
      1234,
      1235,
      1235,
      1236,
      1236,
      1235,
      1236,
      1238
    ]
  },
  "stats": {
    "sampleCount": 64,
    "minimumMetersEGM96": 1234,
    "maximumMetersEGM96": 1243,
    "minMaxDeltaMeters": 9
  }
});
