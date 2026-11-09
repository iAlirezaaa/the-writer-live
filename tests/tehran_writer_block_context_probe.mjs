/* MAYOR-043: validate visible but explicitly non-surveyed streetscape context.
 * node --experimental-vm-modules tests/tehran_writer_block_context_probe.mjs [site-root]
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createContext, SourceTextModule } from "node:vm";
const root=resolve(process.argv[2]||".");
const read=p=>readFileSync(resolve(root,p),"utf8");
const THREE=await import("data:text/javascript;base64,"+
  Buffer.from(read("web/vendor/three.module.js")).toString("base64"));
const ctx=createContext({console,Date,performance});
const seen=new Map();
const load=path=>{
  if(seen.has(path))return seen.get(path);
  const m=new SourceTextModule(readFileSync(path,"utf8"),{context:ctx,identifier:path});
  seen.set(path,m);return m;
};
const file=load(resolve(root,"web/writer-block-illustrative-context.js"));
await file.link((specifier,parent)=>{
  assert.ok(specifier.startsWith("./"),"No remote prop sources allowed");
  return load(resolve(dirname(parent.identifier),specifier.split("?")[0]));
});
await file.evaluate();
const {planWriterBlockContext,buildWriterBlockContext}=file.namespace;
const plan=planWriterBlockContext();
const counts={trees:plan.trees.length,shrubs:plan.shrubs.length,
  lamps:plan.lamps.length,parkedVehicleProxies:plan.cars.length};
assert.ok(counts.trees>=8&&counts.trees<=24);
assert.ok(counts.shrubs>=8&&counts.shrubs<=36);
assert.ok(counts.lamps>=6&&counts.lamps<=18);
assert.ok(counts.parkedVehicleProxies>=3&&counts.parkedVehicleProxies<=9);
assert.equal(plan.actualObjectPositionsVerified,false);
assert.equal(plan.physicalCollider,false);
const road=load(resolve(root,"web/writer-block-road-preview.js"));
const contains=road.namespace.writerBlockContainsLocalPoint;
for(const points of [plan.trees,plan.shrubs,plan.lamps,plan.cars]){
  for(const p of points){
    assert.ok(contains(p.x,p.z),"Proxy context must stay inside one sourced block");
    assert.ok(Math.hypot(p.x,p.z)>7.99,"Writer room safety exclusion");
  }
}
const scene=new THREE.Scene(),room=new THREE.Group(),outside=new THREE.Group();
room.name="writer-interior-street-level";outside.name="writer-home-exterior-v2";
scene.add(room,outside);
const {group,update}=buildWriterBlockContext(THREE,scene,{streetY:-3});
assert.equal(scene.getObjectByName(room.name),room);
assert.equal(scene.getObjectByName(outside.name),outside);
assert.equal(group.name,"writer-block-illustrative-streetscape");
assert.equal(group.userData.cityContextEvidence.kind,"INTERPRETIVE_NOT_SURVEYED");
assert.equal(group.userData.cityContextEvidence.realParkedCarsObserved,false);
assert.equal(group.userData.cityContextEvidence.actualTreeSpeciesKnown,false);
assert.equal(group.userData.cityContextEvidence.physicalCollider,false);
assert.equal(group.userData.cityContextEvidence.routesUnchanged,true);
assert.equal(group.userData.cityContextEvidence.writerRoomPreserved,true);
assert.deepEqual(group.userData.cityContextEvidence.instances,counts);
assert.ok(group.children.length>=6&&group.children.length<=15);
for(const mesh of group.children){
  assert.equal(mesh.isInstancedMesh,true);
  assert.equal(mesh.userData.physicalCollider,false);
  assert.equal(mesh.userData.illustrativeOnly,true);
  assert.ok(mesh.count>0);
  const b=new THREE.Box3().setFromObject(mesh);
  assert.ok([...b.min,...b.max].every(Number.isFinite),"Finite bounds: "+mesh.name);
  const matrix=new THREE.Matrix4(),pos=new THREE.Vector3();
  for(let i=0;i<mesh.count;i++){
    mesh.getMatrixAt(i,matrix);
    pos.setFromMatrixPosition(matrix);
    assert.ok([pos.x,pos.y,pos.z].every(Number.isFinite));
    assert.ok(contains(pos.x,pos.z),"Instance escaped block: "+mesh.name);
  }
}
const bulbs=group.getObjectByName("illustrative-streetlamp-bulbs");
assert.ok(bulbs);
update(1);
const day=bulbs.material.emissiveIntensity;
update(0);
const night=bulbs.material.emissiveIntensity;
assert.ok(night>day+1,"Night must brighten existing lamp emissive material");
assert.equal(scene.children.length,3,"No duplicate town or writer root");
console.log("TEHRAN-ILLUSTRATIVE-BLOCK-CONTEXT-OK",JSON.stringify({
 counts,instancedDrawables:group.children.length,realObjectLocationsVerified:false,
 writerRoomPreserved:true,physicalCollidersAdded:0,dayLightIntensity:day,nightLightIntensity:night
}));
