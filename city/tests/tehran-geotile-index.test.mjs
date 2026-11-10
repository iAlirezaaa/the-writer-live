import test from "node:test";
import assert from "node:assert/strict";
import {lonLatTile,makeTehranTileIndex} from "../survey/tehran-geotile-index.mjs";
const point=(id,lon,lat)=>({type:"Feature",id,
  geometry:{type:"Point",coordinates:[lon,lat]},properties:{kind:"building",heightEvidence:"unknown"}});
const sample=(features=[point("osm:way:1",51.3642,35.7153)])=>({
  schemaVersion:1,geoSource:"OpenStreetMap",license:"ODbL-1.0",
  attribution:"© OpenStreetMap contributors",capturedAt:"2026-11-09T09:22:58Z",
  homeAnchor:{crs:"EPSG:4326"},features:{type:"FeatureCollection",features}
});
test("A real Tehran coordinate uses deterministic EPSG:3857 tile IDs",()=>{
  const t=lonLatTile(51.3642,35.7153,17);
  assert.deepEqual(t,lonLatTile(51.3642,35.7153,17));
  const result=makeTehranTileIndex(sample());
  assert.equal(result.featureCount,1);
  assert.equal(result.tileCount,1);
  assert.deepEqual(result.tiles[`17/${t.x}/${t.y}`],["osm:way:1"]);
  assert.equal(result.mode,"provenance-metadata-only");
  assert.deepEqual(result.features["osm:way:1"],{geometryType:"Point",bbox:{west:51.3642,east:51.3642,south:35.7153,north:35.7153}});
  assert.equal(result.attribution,"© OpenStreetMap contributors");
});
test("The index is deterministic and keeps all source IDs across touched tiles",()=>{
  const features=[
    point("osm:way:5",51.3642,35.7153),
    {type:"Feature",id:"osm:way:2",geometry:{type:"LineString",
      coordinates:[[51.360,35.715],[51.370,35.715]]},properties:{kind:"road"}}
  ];
  const first=makeTehranTileIndex(sample(features));
  assert.deepEqual(first,makeTehranTileIndex(sample(features)));
  assert.equal(first.featureCount,2);
  assert.deepEqual(first.features["osm:way:2"],{geometryType:"LineString",bbox:{west:51.360,east:51.370,south:35.715,north:35.715}});
  assert.deepEqual(Object.keys(first.features),["osm:way:2","osm:way:5"]);
  assert.ok(Object.values(first.tiles).some(ids=>ids.includes("osm:way:2")));
  assert.ok(Object.values(first.tiles).every(ids=>new Set(ids).size===ids.length));
});
test("Reject duplicate source identifiers",()=>{
  assert.throws(()=>makeTehranTileIndex(sample([point("same",51.36,35.71),point("same",51.37,35.72)])),/Duplicate feature ID/);
});
test("Reject unknown source, absent legal attribution and bad CRS",()=>{
  const missing=sample();delete missing.attribution;
  assert.throws(()=>makeTehranTileIndex(missing),/license and attribution/);
  const unknown=sample();unknown.geoSource="";
  assert.throws(()=>makeTehranTileIndex(unknown),/source/);
  const badCRS=sample();badCRS.homeAnchor.crs="EPSG:3857";
  assert.throws(()=>makeTehranTileIndex(badCRS),/WGS84/);
});
test("Reject invalid lon, lat and huge unsplit OSM ways",()=>{
  assert.throws(()=>makeTehranTileIndex(sample([point("bad",200,35)])),/Invalid EPSG:4326/);
  assert.throws(()=>makeTehranTileIndex(sample([point("bad2",51.36,91)])),/Invalid EPSG:4326/);
  const wide=sample([{type:"Feature",id:"osm:way:long-road",
    geometry:{type:"LineString",coordinates:[[51.0,35.5],[52.0,35.5]]}}]);
  assert.throws(()=>makeTehranTileIndex(wide,{maxTilesPerFeature:1}),/Unsplit feature/);
});

test("A cross-tile road keeps one source identity and no duplicated tile references",()=>{
  const west=51.360,east=51.370,lat=35.715;
  const a=lonLatTile(west,lat,17),b=lonLatTile(east,lat,17);
  assert.notEqual(a.x,b.x,"Fixture must span more than one tile");
  const id="osm:way:cross-tile";
  const feature={type:"Feature",id,geometry:{type:"LineString",
    coordinates:[[west,lat],[east,lat]]},properties:{kind:"road",heightEvidence:"unknown"}};
  const index=makeTehranTileIndex(sample([feature]));
  assert.equal(index.featureCount,1);
  assert.deepEqual(Object.keys(index.features),[id]);
  const tileKeys=Object.keys(index.tiles).filter(key=>index.tiles[key].includes(id));
  assert.ok(tileKeys.length>=2,"Feature must be referenced by multiple tiles");
  for(const key of tileKeys)assert.deepEqual(index.tiles[key],[id]);
  assert.equal(index.features[id].geometryType,"LineString");
  assert.deepEqual(index.features[id].bbox,{west,south:lat,east,north:lat});
  assert.equal(index.mode,"provenance-metadata-only");
});
