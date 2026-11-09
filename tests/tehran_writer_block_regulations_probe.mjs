/* MAYOR-045: compare authored road regulation overlays with EXACT stored OSM tags.
 * Run: node --experimental-vm-modules tests/tehran_writer_block_regulations_probe.mjs [site-root]
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {createContext,SourceTextModule} from "node:vm";
const root=resolve(process.argv[2]||".");
const read=path=>readFileSync(resolve(root,path),"utf8");
const THREE=await import("data:text/javascript;base64,"+
 Buffer.from(read("web/vendor/three.module.js")).toString("base64"));
const ctx=createContext({console,Date,performance});
const cache=new Map();
const load=path=>{
 if(cache.has(path))return cache.get(path);
 const m=new SourceTextModule(readFileSync(path,"utf8"),{context:ctx,identifier:path});
 cache.set(path,m);return m;
};
const module=load(resolve(root,"web/writer-block-road-regulations.js"));
await module.link((spec,parent)=>{
 assert.ok(spec.startsWith("./"),"No remote road data or changed physics modules");
 return load(resolve(dirname(parent.identifier),spec.split("?")[0]));
});
await module.evaluate();
const road=load(resolve(root,"web/writer-block-road-preview.js")).namespace;
const {WRITER_BLOCK_OSM_REGULATIONS,WRITER_BLOCK_REGULATION_SOURCE,
 planWriterBlockRoadRegulations,buildWriterBlockRoadRegulations}=module.namespace;
const source=JSON.parse(read("city/survey/output/writer-block-survey.json"));
assert.equal(source.license,"ODbL-1.0");
assert.equal(source.capturedAt,WRITER_BLOCK_REGULATION_SOURCE.capturedAt);
assert.equal(source.blockBoundary.status,"OSM_CENTERLINE_CANDIDATE");
assert.equal(source.blockBoundary.localXZ.length,6);
assert.equal(WRITER_BLOCK_OSM_REGULATIONS.length,4);
for(const reg of WRITER_BLOCK_OSM_REGULATIONS){
 const stored=source.features.features.find(f=>f.id==="osm:way:"+reg.wayId);
 assert.ok(stored,"Missing source OSM way "+reg.wayId);
 assert.equal(stored.properties.kind,"road");
 assert.equal(stored.properties.tags.name,reg.name);
 assert.equal(stored.properties.tags.maxspeed,reg.maxspeed);
 assert.equal(stored.properties.tags.oneway??null,reg.oneway);
 assert.equal(stored.properties.tags.surface??null,reg.surface);
 const way=stored.properties.localXZ;
 for(const i of [0,1]){
   const a=way[i===0?0:way.length-1],b=i===0?reg.wayStart:reg.wayEnd;
   assert.ok(Math.abs(a[0]-b[0])<.001&&Math.abs(a[1]-b[1])<.001,
     "OSM way orientation source changed for "+reg.wayId);
 }
}
const plan=planWriterBlockRoadRegulations();
assert.equal(plan.speeds.length,4);
assert.equal(plan.arrows.length,4);
assert.equal(plan.facts.filter(f=>f.onewayTag==="yes").length,2);
assert.equal(plan.facts.filter(f=>f.onewayTag==="no").length,1);
assert.equal(plan.facts.filter(f=>f.onewayTag===null).length,1);
assert.ok(!plan.arrows.some(a=>a.wayId===4292858),"Missing oneway tag is unknown, not bidirectional");
for(const arrow of plan.arrows){
 const way=WRITER_BLOCK_OSM_REGULATIONS.find(x=>x.wayId===arrow.wayId);
 assert.ok(road.writerBlockContainsLocalPoint(arrow.x,arrow.z));
 assert.ok(Math.hypot(arrow.x,arrow.z)>7.9,"Writer room preserved");
 const dx=way.wayEnd[0]-way.wayStart[0],dz=way.wayEnd[1]-way.wayStart[1];
 const dot=arrow.direction.x*dx+arrow.direction.z*dz;
 assert.ok(arrow.taggedOneway==="yes"?dot>0:true,
   "One-way arrow reversed relative to original OSM way ordering");
}
const scene=new THREE.Scene(),writerRoom=new THREE.Group();
writerRoom.name="writer-interior-street-level";scene.add(writerRoom);
const canvasTex=(w,h,paint)=>{
 const g={clearRect(){},beginPath(){},arc(){},fill(){},stroke(){},fillText(){}};
 paint(g,w,h);return new THREE.Texture({width:w,height:h});
};
const {group,arrowsMesh}=buildWriterBlockRoadRegulations(THREE,scene,{
 streetY:-3,canvasTex
});
assert.equal(scene.getObjectByName(writerRoom.name),writerRoom);
assert.equal(group.children.length,2);
assert.equal(group.userData.cityRoadEvidence.kind,"SOURCE_TAGS_DISPLAY_AS_MAP_ANNOTATIONS");
assert.equal(group.userData.cityRoadEvidence.physicalCollider,false);
assert.equal(group.userData.cityRoadEvidence.citizenPathsChanged,false);
assert.equal(group.userData.cityRoadEvidence.noNewCarRoutes,true);
assert.equal(group.userData.cityRoadEvidence.paintedSignLocationsSurveyed,false);
assert.ok(arrowsMesh.isMesh);
const label=group.getObjectByName("writer-block-osm-30-kmh-map-labels");
assert.ok(label.isInstancedMesh&&label.count===4);
const check=object=>{
 const box=new THREE.Box3().setFromObject(object);
 assert.ok([...box.min,...box.max].every(Number.isFinite),"Finite arrows and signs");
 assert.equal(object.userData.cityEvidence.physicalCollider,false);
};
for(const obj of group.children)check(obj);
const a=arrowsMesh.geometry.attributes.position;
for(let i=0;i<a.count;i++){
 const x=a.getX(i),y=a.getY(i),z=a.getZ(i);
 assert.ok([x,y,z].every(Number.isFinite));
 assert.ok(road.writerBlockContainsLocalPoint(x,z),"Direction arrow escaped single block");
 assert.ok(Math.hypot(x,z)>7.9,"Arrow intersects protected room");
 assert.ok(y>=-3&&y<=-2.65);
}
for(const p of plan.speeds){
 assert.ok(road.writerBlockContainsLocalPoint(p.x,p.z));
 assert.ok(Math.hypot(p.x,p.z)>7.9);
 assert.equal(p.actualSignLocation,false);
}
console.log("TEHRAN-OSM-ROAD-REGULATIONS-OK",JSON.stringify({
 ways:4,maxspeed30WayCount:4,oneway:2,explicitTwoWay:1,unknownDirection:1,
 directionalMapArrows:plan.arrows.length,diagramSpeedLabels:label.count,
 sourceCapture:source.capturedAt,sourceLicense:source.license,
 writerRoomPreserved:true,physicalTrafficChanges:0,actualSignsClaimed:0
}));
