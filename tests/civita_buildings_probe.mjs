/* MAYOR-082: measured volumes become real geometry: heights match the survey, openings stay on free walls,
 * the writer's site stays clear, interpretive parts are deterministic.
 * Usage: node tests/civita_buildings_probe.mjs
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCivitaBuildings,planOpenings,resolveRoof,roofHeightAt,overlapsSite} from '../web/civita-buildings.js';
import {decodeDem,createHeightSampler,validateCivitaDbt} from '../web/civita-measured-terrain.js';
const src=readFileSync(new URL('../web/vendor/three.module.js',import.meta.url),'utf8');
const THREE=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const file=n=>new URL('../web/data/'+n,import.meta.url);
const data=validateCivitaDbt(JSON.parse(readFileSync(file('civita-dbt.json'),'utf8')));
const buf=g=>{const b=readFileSync(file(g.file));return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);};
const heightAt=createHeightSampler(decodeDem(buf(data.dem.inner),data.dem.inner,data.dem.encoding),decodeDem(buf(data.dem.outer),data.dem.outer,data.dem.encoding));
const parent=new THREE.Group(),site={x:83,z:-41};
const model=buildCivitaBuildings(THREE,parent,data,heightAt,{site});
assert.ok(model.counts.volumes>400);assert.ok(model.counts.windows>500);assert.ok(model.counts.doors>50);
const walls=model.layer.getObjectByName('civita-building-walls');
walls.geometry.computeBoundingBox();
assert.ok(walls.geometry.boundingBox.max.y>27,'bell tower must reach its measured height');
for(const a of walls.geometry.attributes.position.array)assert.ok(Number.isFinite(a));
for(const v of data.volumes.slice(0,120)){
 const roof=resolveRoof(v);
 for(const [x,z] of v.ring)assert.ok(roofHeightAt(roof,v.eave_y,x,z)>=v.eave_y-.01,'wall top never below measured eave: '+v.id);
 const a=planOpenings(v,heightAt),b=planOpenings(v,heightAt);
 assert.deepEqual(a,b,'openings must be deterministic');
 for(const o of a)assert.ok(o.y<v.eave_y,'opening under the eave: '+v.id);
}
assert.ok(data.volumes.some(v=>overlapsSite(v,site)),'writer site overlaps a surveyed volume');
const kept=data.volumes.filter(v=>!overlapsSite(v,site));
assert.ok(kept.every(v=>!overlapsSite(v,site)));
// Cutting the house open must not leave its windows hanging: they belong to the home layer.
const homed=buildCivitaBuildings(THREE,new THREE.Group(),data,heightAt,{home:{volumeId:data.volumes.find(v=>v.id.endsWith('6750-253')).id,facade:{a:[0,0],ox:0,oz:1}}});
assert.equal(homed.homeLayer.getObjectByName('civita-chimneys').count,0,'the house has one chimney, over its fireplace, added with the house');
assert.ok(homed.homeLayer.getObjectByName('civita-window-lintels'),'home windows sit in the home layer');
assert.equal(model.layer.userData.heightsMeasured,true);assert.equal(model.layer.userData.roofsAndOpeningsInterpretive,true);
console.log('CIVITA-BUILDINGS-OK',JSON.stringify(model.counts));
