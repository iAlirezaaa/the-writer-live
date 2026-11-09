/* MAYOR-033: real Three.js test of one authored home-east facade detail.
 * Run: node tests/tehran_writer_block_balcony_probe.mjs [site-root]
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const read=path=>readFileSync(resolve(root,path),"utf8");
const asUrl=source=>"data:text/javascript;base64,"+Buffer.from(source).toString("base64");
const THREE=await import(asUrl(read("web/vendor/three.module.js")));
const balcony=await import(asUrl(read("web/writer-block-balcony.js")));
const urban=await import(asUrl(read("web/urban-plan.js")));
const roadPreviewSource=read("web/writer-block-road-preview.js")
  .replace(/"\.\/urban-plan\.js\?v=[^"]+"/,JSON.stringify(asUrl(read("web/urban-plan.js"))));
const road=await import(asUrl(roadPreviewSource));
const house={key:"home-east",x:19,z:0,w:5,d:5};
assert.equal(road.writerBlockContainsLocalPoint(house.x,house.z),true);
const plan=balcony.balconyAttachmentPlan(house,-3);
assert.ok(plan.slabFrontZ-plan.zFront>.01);
assert.ok(plan.zBack-plan.facadeZ>0);
assert.ok(plan.topY-plan.slabTopY>.8&&plan.topY-plan.slabTopY<1);
const group=new THREE.Group(),mesh=balcony.buildWriterBlockBalcony(THREE,group,{house,streetY:-3});
assert.equal(group.children.length,1,"Facade detail must use one draw call");
assert.equal(mesh.isMesh,true);
assert.equal(mesh.name,"writer-block-home-east-balcony-rail-v1");
assert.equal(mesh.geometry.type,"BufferGeometry");
assert.equal(mesh.material.type,"MeshStandardMaterial");
assert.equal(mesh.userData.cityConstructionEvidence.surveyedTehranBuilding,false);
assert.equal(mesh.userData.cityConstructionEvidence.physicalCollider,false);
assert.equal(mesh.userData.cityConstructionEvidence.navigationUnchanged,true);
assert.equal(mesh.userData.cityConstructionEvidence.attachedToFacade,true);
assert.equal(mesh.userData.cityConstructionEvidence.supportedByOriginalSlab,true);
assert.equal(mesh.userData.cityConstructionEvidence.memberCount*36,mesh.geometry.attributes.position.count);
assert.ok(mesh.geometry.attributes.position.count>=350);
const box=new THREE.Box3().setFromObject(mesh);
assert.ok(box.min.x>16.7&&box.max.x<18.2,"Balcony extends outside original house bay");
assert.ok(box.min.z>=2.48&&box.max.z<=3.2,"Balcony must mount into house slab/front wall");
assert.ok(box.min.y>-1&&box.max.y<.5,"Rail attached above existing upper-level slab");
assert.ok(Math.abs(box.min.y-plan.slabTopY)<.015,"No air gap under railing feet");
assert.ok(Math.abs(box.max.y-(plan.y+.88+.01))<.15);
assert.ok(box.min.y>(-3+2.3),"Handrail must remain above pedestrian head clearance");
assert.ok(box.max.z-plan.slabFrontZ<.09,"Front railing stays on the real balcony slab");
for(const x of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(x));
const positions=mesh.geometry.attributes.position;
for(let i=0;i<positions.count;i++){
  assert.ok(road.writerBlockContainsLocalPoint(positions.getX(i),positions.getZ(i)),
    "Any balcony component outside strictly scoped writer block");
}
assert.ok(urban.auditUrbanPlan().ok,"Existing building lots and road topology unchanged");
assert.ok(!read("web/writer-block-balcony.js").includes("ROUTE_SEGMENTS"),
  "Never change resident path routes from facade builder");
assert.ok(read("web/town.js").includes('if (b.key === "home-east") buildWriterBlockBalcony'),
  "Facade detail must only be wired once to east existing house");
mesh.geometry.dispose();mesh.material.dispose();
console.log("TEHRAN-BALCONY-CONSTRUCTION-OK",JSON.stringify({
  owner:house.key,evidenceLevel:mesh.userData.cityConstructionEvidence.evidenceLevel,
  drawCalls:group.children.length,metalMembers:mesh.userData.cityConstructionEvidence.memberCount,
  vertices:positions.count,
  bounds:{min:box.min.toArray(),max:box.max.toArray()},physicalCollider:false
}));
