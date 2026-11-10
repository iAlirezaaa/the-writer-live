import assert from 'node:assert/strict';
import {test} from 'node:test';
import {OSM_QUERY,parseCivitaVectors} from '../../web/civita-osm-vectors.mjs';
const square=(d=0)=>[{lat:42.62765,lon:12.11364},{lat:42.62765,lon:12.11374+d},{lat:42.62775,lon:12.11374+d},{lat:42.62775,lon:12.11364},{lat:42.62765,lon:12.11364}];
const sample=[{type:'way',id:11,tags:{building:'yes'},timestamp:'2026-10-01T00:00:00Z',geometry:square()},{type:'way',id:12,tags:{highway:'footway'},geometry:square().slice(0,2)}];
test('source query is bounded and requests tagged ways',()=>{assert.match(OSM_QUERY,/42\.62695/);assert.match(OSM_QUERY,/out meta geom/);});
test('source id, provenance and unknown-height explicit proxy',()=>{
 const r=parseCivitaVectors({elements:sample});assert.equal(r.buildings.length,1);assert.equal(r.paths.length,1);
 assert.equal(r.buildings[0].id,'way/11');assert.equal(r.buildings[0].provenance.height_m,null);
 assert.equal(r.buildings[0].displayHeightIsProxy,true);assert.equal(r.buildings[0].displayHeight,6);
 assert.equal(r.buildings[0].provenance.license,'ODbL-1.0');
 assert.ok(r.buildings[0].points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)));
});
test('tagged height stays source-tag and invalid measurements stay null',()=>{
 let a=parseCivitaVectors({elements:[{...sample[0],tags:{building:'yes',height:'10 m','building:levels':'3'}}]});
 assert.equal(a.buildings[0].displayHeight,10);assert.equal(a.buildings[0].displayHeightIsProxy,false);assert.equal(a.buildings[0].provenance.levels,3);
 a=parseCivitaVectors({elements:[{...sample[0],tags:{building:'yes',height:'9-20','building:levels':'2.5'}}]});
 assert.equal(a.buildings[0].displayHeightIsProxy,true);assert.equal(a.buildings[0].provenance.levels,null);
});
test('rejects unclosed, self-intersecting and distant footprints',()=>{
 const bad=[{...sample[0],id:23,geometry:square().slice(0,-1)},
 {...sample[0],id:24,geometry:[square()[0],square()[2],square()[1],square()[3],square()[0]]},
 {...sample[0],id:25,geometry:square().map(p=>({...p,lat:p.lat+2}))}];
 const a=parseCivitaVectors({elements:[...bad,...sample]});assert.equal(a.buildings.length,1);assert.equal(a.rejected,3);
});
test('reject duplicate ids and unbounded source responses',()=>{
 const a=parseCivitaVectors({elements:[sample[0],sample[0]]});assert.equal(a.buildings.length,1);assert.equal(a.rejected,1);
 assert.throws(()=>parseCivitaVectors({elements:Array(651).fill(sample[0])}));
});
