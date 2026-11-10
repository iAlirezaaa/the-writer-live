import assert from 'node:assert/strict';
import {test} from 'node:test';
import {CIVITA_ORIGIN,SANTA_MARIA_GATE,MAP_TILES,geoToCivita,mapTileRect,clampCivitaTarget} from '../../web/civita-geo.mjs';
test('Civita origin is zero and gate is west',()=>{
 assert.deepEqual(geoToCivita(CIVITA_ORIGIN.latitude,CIVITA_ORIGIN.longitude),{x:0,z:0});
 const gate=geoToCivita(SANTA_MARIA_GATE.latitude,SANTA_MARIA_GATE.longitude);
 assert.ok(gate.x < -70 && gate.x > -95,`gate east offset ${gate.x}`);
 assert.ok(gate.z > 20 && gate.z < 45,`gate south offset ${gate.z}`);
});
test('two raster tiles cover both documented anchors',()=>{
 const rectangles=MAP_TILES.map(([x,y])=>mapTileRect(x,y));
 for(const p of [geoToCivita(CIVITA_ORIGIN.latitude,CIVITA_ORIGIN.longitude),geoToCivita(SANTA_MARIA_GATE.latitude,SANTA_MARIA_GATE.longitude)]){
  assert.ok(rectangles.some(r=>Math.abs(p.x-r.x)<r.width/2&&Math.abs(p.z-r.z)<r.depth/2));
 }
});
test('camera target never escapes safe zone',()=>{
 assert.deepEqual(clampCivitaTarget(10000,-10000),{x:140,z:-45});
 assert.deepEqual(clampCivitaTarget(-10000,10000),{x:-140,z:45});
 assert.deepEqual(clampCivitaTarget(0,0),{x:0,z:0});
 assert.throws(()=>clampCivitaTarget(Number.NaN,0));
});
test('invalid source coordinates rejected',()=>{
 assert.throws(()=>geoToCivita(91,12));assert.throws(()=>geoToCivita(42,181));
 assert.throws(()=>mapTileRect(-1,0));
});
