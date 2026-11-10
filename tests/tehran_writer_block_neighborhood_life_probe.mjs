/* MAYOR-059 — real Three.js source-only city must look occupied without
 * pretending upper floors or pedestrians are surveyed. Does not alter routes.
 * Run: node --experimental-vm-modules tests/tehran_writer_block_neighborhood_life_probe.mjs [site-root]
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {createContext,SourceTextModule} from "node:vm";
const root=resolve(process.argv[2]||".");
const read=path=>readFileSync(resolve(root,path),"utf8");
const THREE=await import("data:text/javascript;base64,"+Buffer.from(read("web/vendor/three.module.js")).toString("base64"));
const ctx=createContext({console,Date,performance}),seen=new Map();
function load(path){
  if(seen.has(path))return seen.get(path);
  const m=new SourceTextModule(readFileSync(path,"utf8"),{context:ctx,identifier:path});
  seen.set(path,m);return m;
}
const entry=load(resolve(root,"web/town.js"));
await entry.link((specifier,origin)=>{
  assert.ok(specifier.startsWith("./"),"External source module forbidden "+specifier);
  return load(resolve(dirname(origin.identifier),specifier.split("?")[0]));
});
await entry.evaluate();
const scene=new THREE.Scene(),room=new THREE.Group(),exterior=new THREE.Group();
room.name="writer-interior-street-level";exterior.name="writer-home-exterior-v2";
scene.add(room,exterior);
const g={clearRect(){},fillRect(){},strokeRect(){},fillText(){},
  measureText(){return {width:120}}};
const canvasTex=(w,h,fn)=>{fn(g,w,h);return new THREE.Texture({width:w,height:h});};
const city=entry.namespace.buildTown({THREE,scene,canvasTex,mapMode:"source-only"});
assert.equal(city.group.userData.cityBuild.urbanLayout,"clean-source-only-from-scratch");
assert.equal(city.group.userData.cityBuild.visibleProxyUpperBuildings,3);
assert.equal(city.group.userData.cityBuild.realBuildingHeightsMeasured,false);
assert.equal(city.group.children.length,9,"Scene remains one sourced town, not a second fictional city");
assert.equal(city.trafficState().length,0,"Moving vehicle simulation untouched");
const context=city.group.getObjectByName("writer-block-illustrative-streetscape");
assert.ok(context);
const count=city.group.userData.cityBuild.illustrativeWalkerCount;
assert.ok(count>=12&&count<=80,"Source sidewalk should have human-scale visual activity: "+count);
assert.equal(context.userData.cityContextEvidence.instances.animatedPedestrianProxies,count);
assert.equal(context.userData.cityContextEvidence.actualObjectLocationsKnown,false);
const peopleNames=["torsos","heads","legs","arms"].map(x=>"writer-block-animated-proxy-"+x);
for(const name of peopleNames){
 const mesh=context.getObjectByName(name);
 assert.ok(mesh?.isInstancedMesh,name);
 assert.equal(mesh.userData.cityLifeEvidence.physicalCollider,false);
 assert.equal(mesh.userData.cityLifeEvidence.realCitizens,false);
 assert.equal(mesh.userData.cityLifeEvidence.routeChanges,false);
 assert.equal(mesh.count,count*(name.endsWith("legs")||name.endsWith("arms")?2:1));
}
const upper=[];
for(let i=1;i<=3;i++){
 const building=city.group.getObjectByName("writer-block-building-0"+i+"-georeferenced");
 assert.ok(building);
 const top=building.getObjectByName("writer-block-proxy-upper-envelope-"+i);
 assert.ok(top?.isMesh);
 assert.equal(top.userData.cityVisualEvidence.actualHeightKnown,false);
 assert.equal(top.userData.cityVisualEvidence.actualFloorCountKnown,false);
 assert.equal(top.userData.cityVisualEvidence.physicalCollider,false);
 upper.push(top);
}
assert.equal(new Set(upper.map(x=>x.userData.cityVisualEvidence.sourceId)).size,3);
assert.ok(upper.every(x=>new THREE.Box3().setFromObject(x).max.y>9),
  "Source-aligned city skyline still looks like 6m cubes");
const matrix0=new THREE.Matrix4(),matrix1=new THREE.Matrix4();
const heads=context.getObjectByName("writer-block-animated-proxy-heads");
heads.getMatrixAt(0,matrix0);
city.update(.2,4,false,null);
heads.getMatrixAt(0,matrix1);
assert.notDeepEqual([...matrix0.elements],[...matrix1.elements],
  "Illustrative pedestrians are frozen despite a running town clock");
assert.equal(scene.getObjectByName("writer-interior-street-level"),room);
assert.equal(scene.getObjectByName("writer-home-exterior-v2"),exterior);
const renderables=[];city.group.traverse(o=>{if(o.isMesh||o.isLineSegments)renderables.push(o);});
assert.ok(renderables.length>=55&&renderables.length<85,
  "Unexpected city visual draw object count "+renderables.length);
for(const o of renderables){
 const box=new THREE.Box3().setFromObject(o);
 assert.ok([...box.min,...box.max].every(Number.isFinite),"Infinite bounds "+o.name);
 assert.notEqual(o.userData.physicalCollider,true,"Visual model accidentally changed physical geometry "+o.name);
}
const world=read("web/world.js");
assert.ok(world.includes("town:     { pos: [22, 86, 125], target: [-10, -1, 2] }"),"Active Civita city framing not published");
assert.ok(world.includes("clampCivitaTarget") && world.includes("city-civita-main-20261110-v1"),
  "Active Civita camera safety/import missing");
console.log("TEHRAN-LIVED-IN-BLOCK-OK",JSON.stringify({
  sourcedProxyBuildings:3,anonymousVisualWalkers:count,
  sourceOnly:true,renderables:renderables.length,
  trafficRoutesUnchanged:true,writerRoomPreserved:true,
  realHeightsOrFacadesClaimed:false
}));
