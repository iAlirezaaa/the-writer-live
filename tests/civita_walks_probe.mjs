/* MAYOR-084: the walking network stays out of surveyed buildings, joins the bridge to the far belvedere through the gate,
 * and the crowd walks it without leaving it. Usage: node tests/civita_walks_probe.mjs
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCivitaCrowd,prepareNetwork} from '../web/civita-crowd.js';
import {decodeDem,createHeightSampler} from '../web/civita-measured-terrain.js';
const src=readFileSync(new URL('../web/vendor/three.module.js',import.meta.url),'utf8');
const THREE=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const file=n=>new URL('../web/data/'+n,import.meta.url);
const data=JSON.parse(readFileSync(file('civita-dbt.json'),'utf8')),walks=JSON.parse(readFileSync(file('civita-walks.json'),'utf8'));
const buf=g=>{const b=readFileSync(file(g.file));return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);};
const heightAt=createHeightSampler(decodeDem(buf(data.dem.inner),data.dem.inner,data.dem.encoding),decodeDem(buf(data.dem.outer),data.dem.outer,data.dem.encoding));
const inside=(x,z,r)=>{let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const seg=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);};
const gate=walks.passages[0],inPassage=(x,z)=>gate.axis.slice(1).some((b,i)=>seg(x,z,gate.axis[i],b)<gate.width_m/2+.05);
const volumes=data.volumes.filter(v=>v.ring.some(p=>p[0]>-150&&p[0]<190&&p[1]>-125&&p[1]<85));
const solid=(x,z)=>volumes.some(v=>inside(x,z,v.ring))&&!inPassage(x,z);
assert.equal(gate.name,'Porta Santa Maria');assert.ok(gate.length_m>8,'the passage goes through the whole gate block');
let checked=0;
for(const r of walks.routes)if(!r.deck)for(const [x,z] of r.points){checked++;assert.ok(!solid(x,z),`route point inside a building: ${x},${z}`);}
const net=prepareNetwork(walks),far=net.index('Bridge far end'),head=net.index('Bridge head'),porta=net.index('Porta Santa Maria'),square=net.index('Piazza San Donato'),view=net.index('Belvedere');
for(const i of [far,head,porta,square,view])assert.ok(i>=0);
assert.ok(net.route(far,head)?.deck,'bridge deck route');assert.ok(net.route(head,porta)&&net.route(porta,square)&&net.route(square,view));
const through=net.route(porta,square);assert.ok(through.points.some(([x,z])=>inPassage(x,z)),'gate route uses the passage');
const crowd=createCivitaCrowd(THREE,new THREE.Group(),walks,{maxPeople:110,heightAt,seated:[],seed:5});
assert.equal(crowd.count,110);
crowd.update(1,0);
let t=0,moved=0,inWall=0,samples=0,onBridge=0,inTown=0;const before=crowd.people.map(p=>[p.x,p.z]);
for(let k=0;k<3000;k++){t+=.1;crowd.update(1,t);if(k%10)continue;for(const p of crowd.people){if(!p.visible||!p.moving)continue;samples++;assert.ok(Number.isFinite(p.x+p.y+p.z));if(p.x>-140&&solid(p.x,p.z))inWall++;if(p.x<-126)onBridge++;else inTown++;}}
crowd.people.forEach((p,i)=>{if(Math.hypot(p.x-before[i][0],p.z-before[i][1])>1)moved++;});
assert.ok(samples>5000);assert.equal(inWall,0,'nobody walks inside a building');assert.ok(onBridge>100&&inTown>1000);assert.ok(moved>30);
console.log('CIVITA-WALKS-OK',JSON.stringify({routes:walks.routes.length,hubs:walks.hubs.length,checked,samples,onBridge,inTown,moved,offset:walks.osm_offset,gate:gate.length_m}));
