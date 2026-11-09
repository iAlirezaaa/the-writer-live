import test from 'node:test';
import assert from 'node:assert/strict';
import {WRITER_HOME,writerArea,toScene,toGeo,overpassQuery,compileSurvey,normalizeOsmApiMap,deriveContainingRoadFace,OSM_ATTRIBUTION}
  from '../survey/writer-block-survey.mjs';
const area=writerArea(230);
const t=(x,z)=>{const p=toGeo(x,z);return {lat:p.lat,lon:p.lon};};
const ring=[t(-12,-14),t(12,-14),t(12,14),t(-12,14),t(-12,-14)];
const mock={version:0.6,osm3s:{timestamp_osm_base:'2026-11-09T09:00:00Z'},elements:[
  {type:'way',id:5,tags:{highway:'residential',name:'Test Street','addr:housenumber':'HIDDEN'},geometry:[t(-30,0),t(30,0)]},
  {type:'way',id:6,tags:{building:'yes','addr:housenumber':'SECRET'},geometry:ring},
  {type:'way',id:7,tags:{building:'yes',height:'11'},geometry:[t(-240,0),t(-180,0),t(-180,8),t(-240,8),t(-240,0)]},
  {type:'way',id:8,tags:{building:'yes'},geometry:[t(-5,0),t(10,0)]},
  {type:'way',id:5,tags:{highway:'residential'},geometry:[t(1,0),t(3,0)]}
]};
test('anchor roundtrip uses local metric east and south',()=>{
  assert.deepEqual(toScene(WRITER_HOME.lat,WRITER_HOME.lon),{x:0,z:0});
  const loc=toGeo(87,-65),again=toScene(loc.lat,loc.lon);
  assert.ok(Math.abs(again.x-87)<1e-7&&Math.abs(again.z+65)<1e-7);
  assert.ok(area.south<WRITER_HOME.lat&&area.north>WRITER_HOME.lat);
  assert.throws(()=>writerArea(1000),RangeError);
});
test('query is geographically bounded, read-only',()=>{
  const q=overpassQuery(area);
  assert.match(q,/way\["highway"\]/);
  assert.match(q,/way\["building"\]/);
  assert.match(q,/out geom/);
  assert.ok(!q.includes('node('));
});
test('survey retains real OSM source, not invented block, heights or private addresses',()=>{
  const x=compileSurvey(mock,{area,capturedAt:'2026-11-09T09:08:00Z'});
  assert.equal(x.blockBoundary.status,'UNVERIFIED');
  assert.equal(x.blockBoundary.geometry,null);
  assert.equal(x.totals.roads,1);
  assert.equal(x.totals.buildings,2);
  assert.equal(x.totals.incompleteWays,1);
  assert.equal(x.totals.missingHeights,1);
  assert.equal(x.totals.crossesSurveyBoundary,1);
  assert.equal(x.attribution,OSM_ATTRIBUTION);
  assert.equal(x.features.features[0].properties.kind,'building');
  assert.equal(x.features.features[0].properties.heightEvidence,'unknown');
  assert.ok(!JSON.stringify(x).includes('SECRET'));
  assert.ok(!JSON.stringify(x).includes('HIDDEN'));
  assert.equal(x.features.features.filter(f=>f.id==='osm:way:5').length,1);
  assert.deepEqual(x.features.features[0].geometry.coordinates[0][0],[ring[0].lon,ring[0].lat]);
});
test('bad source and timestamp rejected',()=>{
  assert.throws(()=>compileSurvey({elements:[]},{capturedAt:'2026-11-09T09:08:00Z'}),TypeError);
  assert.throws(()=>compileSurvey(mock,{capturedAt:'nonsense'}),TypeError);
});

test('official OSM map.json nodes resolve to only complete roads/buildings',()=>{
  const g=toGeo(15,10);
  const raw={version:'0.6',generator:'OpenStreetMap server',elements:[
    {type:'node',id:100,lat:WRITER_HOME.lat,lon:WRITER_HOME.lon},
    {type:'node',id:101,lat:g.lat,lon:g.lon},
    {type:'way',id:300,tags:{highway:'residential'},nodes:[100,101]},
    {type:'way',id:301,tags:{building:'yes'},nodes:[100,999]},
    {type:'way',id:302,tags:{landuse:'residential'},nodes:[100,101]}
  ]};
  const normalized=normalizeOsmApiMap(raw);
  assert.equal(normalized.elements.length,1);
  assert.deepEqual(normalized.elements[0].geometry[1],{lat:g.lat,lon:g.lon});
  const result=compileSurvey(normalized,{area,capturedAt:'2026-11-09T09:08:00Z'});
  assert.equal(result.totals.roads,1);
  assert.equal(result.blockBoundary.status,'UNVERIFIED');
});

test('connected real-road centerlines enclose only a map-derived candidate block',()=>{
  const corners=[[-20,-18],[35,-18],[35,23],[-20,23]];
  const elements=corners.map((p,i)=>{
    const a=toGeo(...p),b=toGeo(...corners[(i+1)%4]);
    return {type:'way',id:900+i,tags:{highway:'residential',name:'Fixture road'},
      geometry:[{lat:a.lat,lon:a.lon},{lat:b.lat,lon:b.lon}]};
  });
  const x=compileSurvey({version:0.6,elements},{capturedAt:'2026-11-09T09:08:00Z'});
  assert.equal(x.blockBoundary.status,'OSM_CENTERLINE_CANDIDATE');
  assert.equal(x.blockBoundary.areaSquareMeters,2255);
  assert.equal(x.blockBoundary.roadWayIds.length,4);
  assert.equal(x.blockBoundary.geometry.coordinates[0].length,5);
  assert.equal(x.blockBoundary.requiresSurvey,true);
  assert.match(x.blockBoundary.confidence,/not curbs/);
  const broken=deriveContainingRoadFace(x.features.features.slice(0,2));
  assert.equal(broken,null,'Open/partial roads must not produce an invented block');
});
