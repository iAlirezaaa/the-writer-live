/* MAYOR-036: real Three.js street pavements and OSM name alignment.
 * node tests/tehran_writer_block_streets_probe.mjs [site-root]
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const read=p=>readFileSync(resolve(root,p),"utf8");
const asUrl=s=>"data:text/javascript;base64,"+Buffer.from(s).toString("base64");
const urbanSrc=read("web/urban-plan.js");
const roadSrc=read("web/writer-block-road-preview.js").replace(
 /"\.\/urban-plan\.js\?v=[^"]+"/,JSON.stringify(asUrl(urbanSrc)));
const moduleSrc=read("web/writer-block-street-frame.js").replace(
 /"\.\/writer-block-road-preview\.js\?v=[^"]+"/,JSON.stringify(asUrl(roadSrc)));
assert.notEqual(moduleSrc,read("web/writer-block-street-frame.js"),"Must depend on canonical OSM ring");
const THREE=await import(asUrl(read("web/vendor/three.module.js")));
const roads=await import(asUrl(roadSrc));
const streets=await import(asUrl(moduleSrc));
const spec=streets.WRITER_BLOCK_STREET_SPEC,plan=streets.buildStreetFramePlan();
assert.equal(plan.rings.length,5);
assert.equal(plan.rings[0].length,5);
assert.ok(Math.abs(roads.writerBlockRingArea(plan.sourceRing)-12265)<5);
assert.equal(spec.physicalCollider,false);
assert.equal(spec.physicalRoadWidthKnown,false);
assert.equal(spec.roadHalfWidthProxyMeters,3.05);
assert.equal(spec.sidewalkProxyMeters,2.02);
assert.equal(plan.labels.length,4);
assert.deepEqual(plan.labels.map(x=>x.wayId),[4292858,481657106,36697708,36697711]);
assert.deepEqual(plan.labels.map(x=>x.name),
  ["فلاحت پور","پنجم دریان‌ نو","هشتم دریان‌ نو","خلیل میکائیلی"]);
assert.deepEqual(plan.labels.map(x=>x.edge),[1,2,3,4]);
assert.ok(plan.rings.slice(1).flat().every(p=>
  roads.writerBlockContainsLocalPoint(p.x,p.z)),"Inward sidewalk ring must stay inside sourced block");
for(const ring of plan.rings)
  assert.equal(ring.length,5);

const rootGroup=new THREE.Group();
const canvasTex=(w,h,paint)=>{
  const ctx={direction:"rtl",fillStyle:"",textAlign:"center",textBaseline:"middle",
    font:"",fillRect(){},fillText(t){assert.ok(t.length>0);},clearRect(){}};
  paint(ctx,w,h);
  return new THREE.Texture({width:w,height:h});
};
const scene=streets.buildWriterBlockStreetFrame(THREE,rootGroup,{
  streetY:-3,canvasTex
});
assert.equal(rootGroup.children.length,1);
assert.equal(scene.group.children.length,5,"One road/sidewalk mesh and 4 map labels");
assert.equal(scene.labels.length,4);
assert.equal(scene.mesh.material.length,6);
assert.equal(scene.mesh.geometry.groups.length,6);
assert.equal(scene.mesh.name,"writer-block-osm-4-street-pavement");
assert.equal(scene.mesh.userData.cityStreetEvidence.physicalCollider,false);
assert.equal(scene.mesh.userData.cityStreetEvidence.actualPavementWidthKnown,false);
assert.equal(scene.mesh.userData.cityStreetEvidence.buildingOrRoadCollidersChanged,false);
assert.equal(scene.mesh.userData.cityStreetEvidence.writerRoomPreserved,true);
assert.equal(scene.mesh.userData.cityStreetEvidence.license,"ODbL-1.0");
assert.equal(scene.mesh.userData.cityStreetEvidence.sourceCenterlineAreaMeters2,roads.writerBlockRingArea());
assert.equal(scene.mesh.castShadow,false);
assert.equal(scene.mesh.receiveShadow,false);
assert.ok(scene.mesh.geometry.attributes.position.count>300);
assert.ok(scene.mesh.geometry.attributes.position.count<6000);
const a=scene.mesh.geometry.attributes.position;
const points=roads.writerBlockLocalRing();
function boundaryDistance(x,z){
 let distance=Infinity;
 for(let i=0;i<points.length-1;i++){
  const p=points[i],q=points[i+1],dx=q.x-p.x,dz=q.z-p.z;
  const t=Math.max(0,Math.min(1,((x-p.x)*dx+(z-p.z)*dz)/(dx*dx+dz*dz)));
  distance=Math.min(distance,Math.hypot(x-(p.x+t*dx),z-(p.z+t*dz)));
 }
 return distance;
}
const ys=[];
for(let i=0;i<a.count;i++){
  const x=a.getX(i),y=a.getY(i),z=a.getZ(i);
  assert.ok([x,y,z].every(Number.isFinite),"No NaN/Infinity in road paving");
  assert.ok(roads.writerBlockContainsLocalPoint(x,z)||boundaryDistance(x,z)<.015,
    "Road/sidewalk/parcel face must not extend outside OSM candidate block");
  ys.push(y);
}
for(let i=0;i<a.count;i+=3){
  const p=new THREE.Vector3(a.getX(i),a.getY(i),a.getZ(i));
  const q=new THREE.Vector3(a.getX(i+1),a.getY(i+1),a.getZ(i+1));
  const r=new THREE.Vector3(a.getX(i+2),a.getY(i+2),a.getZ(i+2));
  const normal=q.clone().sub(p).cross(r.clone().sub(p));
  assert.ok(normal.y>1e-7,"All road/sidewalk triangles must face upward");
}
assert.ok(Math.min(...ys)>=-3&&Math.max(...ys)<-2.7);
const box=new THREE.Box3().setFromObject(scene.mesh);
assert.ok(box.min.x>-120&&box.max.x<60&&box.min.z>-23&&box.max.z<95);
for(const plate of scene.labels){
  assert.ok(roads.writerBlockContainsLocalPoint(plate.position.x,plate.position.z));
  assert.equal(plate.userData.cityStreetSource.physicalCollider,false);
  assert.equal(plate.userData.cityStreetSource.actualStreetSign,false);
}
assert.equal((await import(asUrl(urbanSrc))).auditUrbanPlan().ok,true);
assert.match(read("web/town.js"),/buildWriterBlockStreetFrame\(THREE,group,\{streetY:STREET_Y,canvasTex\}\)/);
scene.mesh.geometry.dispose();
for(const m of scene.mesh.material)m.dispose();
for(const label of scene.labels){label.geometry.dispose();label.material.dispose();}
console.log("TEHRAN-4-SOURCED-STREETS-OK",JSON.stringify({
  wayIds:plan.labels.map(x=>x.wayId),sourcePolygonAreaSqm:roads.writerBlockRingArea(),
  visiblePavementTriangles:a.count/3,materialGroups:scene.mesh.geometry.groups.length,
  mapLabels:scene.labels.length,
  roadWidthSourceVerified:false,trafficCollidersChanged:false,writerRoomPreserved:true
}));
