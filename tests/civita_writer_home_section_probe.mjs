/* MAYOR-083: the writer's house sits in a surveyed volume and has the documented room plan.
 * Usage: node tests/civita_writer_home_section_probe.mjs
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {anchorWriterHome,buildWriterFacade,buildWriterHomeSection,buildWriterChimney,WRITER_HOME_PLAN,FOOTING_DEPTH} from '../web/civita-writer-home.js';
import {wallFoot} from '../web/civita-buildings.js';
import {decodeDem,createHeightSampler,validateCivitaDbt} from '../web/civita-measured-terrain.js';
const src=readFileSync(new URL('../web/vendor/three.module.js',import.meta.url),'utf8');
const THREE=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const file=n=>new URL('../web/data/'+n,import.meta.url);
const data=validateCivitaDbt(JSON.parse(readFileSync(file('civita-dbt.json'),'utf8')));
const buf=g=>{const b=readFileSync(file(g.file));return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);};
const heightAt=createHeightSampler(decodeDem(buf(data.dem.inner),data.dem.inner,data.dem.encoding),decodeDem(buf(data.dem.outer),data.dem.outer,data.dem.encoding));
const home=anchorWriterHome(data,heightAt);
const volume=data.volumes.find(v=>v.id===home.volumeId);
const inside=(p,r)=>{let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){if((r[i][1]>p[1])!==(r[j][1]>p[1])&&p[0]<(r[j][0]-r[i][0])*(p[1]-r[i][1])/(r[j][1]-r[i][1])+r[i][0])c=!c;}return c;};
for(const [x,z] of [[-2.9,-2.9],[2.6,-2.1],[-2.9,2.9],[2.9,2.9],[0,0]])assert.ok(inside(home.world(x,z),volume.ring),'room corner inside surveyed walls: '+x+','+z);
assert.ok(home.facade.lengthM>=6,'street wall is wide enough for the room');
assert.ok(home.groundRelativeM+6.4<=volume.eave_y+.4,'two storeys fit under the surveyed eave');
for(let x=-3;x<=3;x++)for(let z=-3;z<=3;z++)assert.ok(heightAt(...home.world(x,z))<=home.groundRelativeM,'ground stays under the floor');
assert.equal(home.houseIdentityVerified,false);assert.equal(WRITER_HOME_PLAN.surveyedInterior,false);
const parent=new THREE.Group();
const section=buildWriterHomeSection(THREE,parent),facade=buildWriterFacade(THREE,parent,{groundAt:home.groundAt,drop:home.groundRelativeM-home.streetRelativeM}),chimney=buildWriterChimney(THREE,parent,{chimneyY:home.chimneyY,roofAt:home.roofAt});
const names=new Set();section.group.traverse(o=>names.add(o.name));facade.group.traverse(o=>names.add(o.name));chimney.traverse(o=>names.add(o.name));
for(const part of ['fireplace-mantel','kitchen-counter','wc-bowl','cantina-barrel','upper-shower-tray','profferlo-tread','landing-arch','landing-voussoir','vine-leaves','chimney-stack','civita-writer-front-door'])assert.ok(names.has(part),'missing '+part);
assert.equal(section.targets.length,3);
// Nothing hangs in the air: the footing reaches below the lowest ground around the house, and every building's walls reach the ground.
let lowest=Infinity;for(let x=-3.4;x<=3.4;x+=.4)for(let z=-3.4;z<=6.2;z+=.4){const g=heightAt(...home.world(x,z));if(Number.isFinite(g))lowest=Math.min(lowest,g);}
assert.ok(home.groundRelativeM-FOOTING_DEPTH<lowest-.5,'house footing goes into the ground');
assert.ok(section.group.getObjectByName('house-footing'),'house has a footing');
// The chimney is carried by the roof: its foot is well inside it.
parent.updateMatrixWorld(true);const stack=chimney.getObjectByName('chimney-stack');stack.geometry.computeBoundingBox();
assert.ok(stack.geometry.boundingBox.min.y+stack.position.y<home.chimneyY-.8,'chimney starts inside the roof');assert.ok(stack.geometry.boundingBox.max.y+stack.position.y>home.chimneyY+.8,'chimney stands above the roof');
// Frames must agree: the street stair's foot meets the surveyed ground, and the surveyed floor is the local -3.2.
assert.ok(Math.abs(home.groundAt(0,0)-(heightAt(...home.world(0,0))-home.groundRelativeM-3.2))<1e-9);
const world=readFileSync(new URL('../web/world.js',import.meta.url),'utf8');
assert.match(world,/surveyedLift=site\.home\?STREET_Y:0/,'exterior stands in the town frame');
for(const v of data.volumes){const foot=wallFoot(v,heightAt);v.ring.forEach(p=>{const g=heightAt(p[0],p[1]);if(Number.isFinite(g))assert.ok(foot<g,'walls reach the ground: '+v.id);});}
assert.equal(facade.entrance.userData.writerExterior,true);
parent.traverse(o=>{const a=o.geometry?.attributes?.position?.array;if(a)for(const v of a)assert.ok(Number.isFinite(v),o.name);});
console.log('CIVITA-WRITER-HOME-SECTION-OK',home.volumeId,home.facade.lengthM.toFixed(2));
