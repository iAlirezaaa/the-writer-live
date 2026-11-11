/* MAYOR-082: surveyed walls, trees, bridge and landmarks become real geometry.
 * Usage: node tests/civita_details_probe.mjs
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildCivitaDetails,bridgeEdges,wallProfile} from '../web/civita-details.js';
import {buildCivitaBuildings} from '../web/civita-buildings.js';
import {decodeDem,createHeightSampler,validateCivitaDbt} from '../web/civita-measured-terrain.js';
const src=readFileSync(new URL('../web/vendor/three.module.js',import.meta.url),'utf8');
const THREE=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const file=n=>new URL('../web/data/'+n,import.meta.url);
const data=validateCivitaDbt(JSON.parse(readFileSync(file('civita-dbt.json'),'utf8')));
const buf=g=>{const b=readFileSync(file(g.file));return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);};
const heightAt=createHeightSampler(decodeDem(buf(data.dem.inner),data.dem.inner,data.dem.encoding),decodeDem(buf(data.dem.outer),data.dem.outer,data.dem.encoding));
const parent=new THREE.Group();
const b=buildCivitaBuildings(THREE,parent,data,heightAt);
const d=buildCivitaDetails(THREE,parent,data,heightAt,{doors:b.doors});
assert.ok(d.counts.sanDonato&&d.counts.bellTower&&d.counts.gate,'all three landmarks built');
assert.ok(d.counts.trees>1000);assert.ok(d.counts.lamps>10);
assert.ok(d.counts.columns>=30&&d.counts.columns<=44,'ENEA gives 44 columns: '+d.counts.columns);
const [L,R]=bridgeEdges(data);
assert.ok(L[0][0]>L.at(-1)[0]&&R[0][0]>R.at(-1)[0],'both edges run from the Civita end');
const width=Math.hypot(L[0][0]-R[0][0],L[0][1]-R[0][1]);assert.ok(width>1.5&&width<6,'deck width '+width);
assert.ok(L[0][2]>L.at(-1)[2],'the deck climbs toward Civita');
for(const e of [L,R]){const p=e[10];assert.ok(heightAt(p[0],p[1])<p[2]-1,'ground is below the deck at mid-span');}
const w=wallProfile([0,0,null],heightAt,'boundary');assert.ok(w.top>w.bottom);
d.layer.traverse(o=>{if(o.geometry?.attributes?.position)for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v),o.name);});
console.log('CIVITA-DETAILS-OK',JSON.stringify(d.counts));
