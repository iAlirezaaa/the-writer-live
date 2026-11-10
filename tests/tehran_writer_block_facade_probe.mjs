/* MAYOR-044 historical Tehran rollback-mode regression — skins must not become sourced data.
 * node --experimental-vm-modules tests/tehran_writer_block_facade_probe.mjs [site-root]
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {createContext,SourceTextModule} from "node:vm";
const root=resolve(process.argv[2]||".");
const read=p=>readFileSync(resolve(root,p),"utf8");
const THREE=await import("data:text/javascript;base64,"+
  Buffer.from(read("web/vendor/three.module.js")).toString("base64"));
const ctx=createContext({console,Date,performance});
const cache=new Map();
const load=p=>{
  if(cache.has(p))return cache.get(p);
  const m=new SourceTextModule(readFileSync(p,"utf8"),{identifier:p,context:ctx});
  cache.set(p,m);return m;
};
const linker=(name,parent)=>{
  assert.ok(name.startsWith("./"),"No external facade model dependency");
  return load(resolve(dirname(parent.identifier),name.split("?")[0]));
};
const module=load(resolve(root,"web/town.js"));
await module.link(linker);await module.evaluate();
const road=load(resolve(root,"web/writer-block-road-preview.js")).namespace;
const scene=new THREE.Scene(),room=new THREE.Group(),exterior=new THREE.Group();
room.name="writer-interior-street-level";exterior.name="writer-home-exterior-v2";
scene.add(room,exterior);
const fakeCtx={clearRect(){},fillRect(){},fillText(){},measureText(){return{width:120}}};
const canvasTex=(w,h,draw)=>{draw(fakeCtx,w,h);return new THREE.Texture({width:w,height:h});};
const town=module.namespace.buildTown({THREE,scene,canvasTex,mapMode:"source-only"});
const result=[],meshes=[];
for(let i=1;i<=3;i++){
  const b=town.group.getObjectByName("writer-block-building-0"+i+"-georeferenced");
  assert.ok(b,"Source-backed building missing");
  const f=b.getObjectByName("writer-block-building-illustrative-facade-"+i);
  assert.ok(f,"No facade layer on a real source roofprint "+i);
  const evidence=f.userData.cityFacadeEvidence;
  assert.equal(evidence.illustrativeOnly,true);
  assert.equal(evidence.realWindowsKnown,false);
  assert.equal(evidence.realFloorsKnown,false);
  assert.equal(evidence.realMaterialsKnown,false);
  assert.equal(evidence.actualShopUseKnown,false);
  assert.equal(evidence.verifiedUnitCount,null);
  assert.equal(evidence.physicalCollider,false);
  assert.equal(evidence.writerRoomPreserved,true);
  assert.equal(f.children.length,3,"Keep three instanced parts per source envelope");
  assert.ok(evidence.instanceCount>=20&&evidence.instanceCount<=120);
  for(const mesh of f.children){
    assert.ok(mesh.isInstancedMesh);
    assert.equal(mesh.count,evidence.instanceCount);
    assert.equal(mesh.userData.cityFacadeEvidence?.physicalCollider,false,"Facade instance must remain explicitly non-colliding");
    const bounds=new THREE.Box3().setFromObject(mesh);
    assert.ok([...bounds.min,...bounds.max].every(Number.isFinite));
    const transform=new THREE.Matrix4(),p=new THREE.Vector3();
    for(let j=0;j<mesh.count;j++){
      mesh.getMatrixAt(j,transform);p.setFromMatrixPosition(transform);
      assert.ok(road.writerBlockContainsLocalPoint(p.x,p.z),"Facade outside approved block");
      assert.ok(Math.hypot(p.x,p.z)>7.9,"Writer room reserve");
    }
    meshes.push(mesh);
  }
  result.push({sourceId:evidence.sourceId,illustrativeWindows:evidence.instanceCount});
}
assert.equal(meshes.length,9);
assert.equal(town.group.children.length,9);
assert.equal(scene.getObjectByName(room.name),room);
assert.equal(scene.getObjectByName(exterior.name),exterior);
assert.equal(town.trafficState().length,0);
const pane=meshes.find(m=>m.name==="illustrative-glazing");
town.update(1,0);const day=pane.material.emissiveIntensity;
town.update(0,20);const night=pane.material.emissiveIntensity;
assert.ok(night>day);
console.log("TEHRAN-ILLUSTRATIVE-FACADE-OK",JSON.stringify({
  buildings:result,drawObjects:meshes.length,day,night,realWindowsVerified:0,
  roomPreserved:true,physicalCollisionChanges:0,trafficChanges:0
}));
