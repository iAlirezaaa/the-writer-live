/* MAYOR-046 — owner-defined third-floor apartment around *preserved* writer room.
 * node --experimental-vm-modules tests/tehran_writer_apartment_third_floor_probe.mjs [site-root]
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const read=p=>readFileSync(resolve(root,p),"utf8");
const THREE=await import("data:text/javascript;base64,"+
 Buffer.from(read("web/vendor/three.module.js")).toString("base64"));
const apartment=await import("data:text/javascript;base64,"+
 Buffer.from(read("web/writer-apartment-third-floor.js")).toString("base64"));
const geo=await import("data:text/javascript;base64,"+
 Buffer.from(read("web/urban-plan.js")).toString("base64"));
const writer=read("web/world.js");
assert.equal(apartment.WRITER_APARTMENT_FLOOR_INDEX,3);
assert.equal(apartment.WRITER_APARTMENT_STOREY_HEIGHT,3.2);
assert.ok(Math.abs(apartment.WRITER_APARTMENT_LEVEL_OFFSET-9.6)<1e-8);
assert.ok(Math.abs(apartment.apartmentFloorElevation(-3)-6.6)<1e-8);
assert.equal(apartment.WRITER_APARTMENT_EVIDENCE.type,"OWNER_AUTHORED_SCENARIO");
assert.equal(apartment.WRITER_APARTMENT_EVIDENCE.sourceBuildingFloorsVerified,false);
assert.equal(apartment.WRITER_APARTMENT_EVIDENCE.apartmentUnitCountVerified,false);
assert.equal(apartment.WRITER_APARTMENT_EVIDENCE.physicalCollider,false);
assert.equal(apartment.WRITER_APARTMENT_EVIDENCE.roomRebuiltOrDeleted,false);
assert.equal(apartment.WRITER_APARTMENT_EVIDENCE.anchorWGS84.lat,
  35.715361987616696);
assert.equal(apartment.WRITER_APARTMENT_EVIDENCE.anchorWGS84.lon,
  51.3642455031707);
assert.equal(geo.WRITER_HOME_BLUEPRINT.room.height,3.2);
assert.deepEqual(geo.writerHouseDimensions(0),[6,6]);
// The old room and its expansion shell must remain owned by the original
// world root. Only the parent's vertical translation may change.
for(const code of [
  'const writerInteriorWorldRoot = new THREE.Group();',
  'writerInteriorWorldRoot.position.y = apartmentFloorElevation(STREET_Y);',
  'writerInteriorWorldRoot.add(baseWriterRoomShell);',
  'writerInteriorWorldRoot.add(expandedWriterRoomShell);',
  'for (const node of interiorSceneObjects) writerInteriorWorldRoot.add(node);',
  'writerExterior.position.y = WRITER_APARTMENT_LEVEL_OFFSET;',
  'const apartment=buildWriterApartmentLowerStoreys(THREE,writerExterior,',
  'camGoal.pos.y += writerInteriorWorldRoot.position.y;',
  'camGoal.target.y += writerInteriorWorldRoot.position.y;',
  'camGoal.target.set(character.position.x, 1.1 + writerInteriorWorldRoot.position.y, character.position.z);',
  'if(o.userData.writerExterior){setView("building");return;}',
  'if(o.userData.returnToTown){setView("town");return;}'
])assert.ok(writer.includes(code),"Protected room/camera/navigation contract missing: "+code);
assert.ok(!writer.includes('writerInteriorWorldRoot.position.y = STREET_Y;'),
  "Room must no longer sit at street level");
// There must be no fictitious new residential storey assertion in the source
// Overture manifest. The floor choice here is explicitly user-authored.
const src=JSON.parse(read("city/buildings/manifest.json"));
assert.ok(src.buildings.every(b=>b.heightMetersSource===null));
const scene=new THREE.Scene(),parent=new THREE.Group();
parent.position.y=apartment.WRITER_APARTMENT_LEVEL_OFFSET;
scene.add(parent);
const built=apartment.buildWriterApartmentLowerStoreys(THREE,parent,{
 streetY:-3,roomWidth:6,roomDepth:6
});
assert.equal(built.simulatedStoreys,4);
assert.equal(built.group.parent,parent);
assert.equal(built.group.userData.cityApartmentEvidence.sourceBuildingFloorsVerified,false);
assert.equal(built.group.userData.cityApartmentEvidence.physicalCollider,false);
assert.equal(built.group.userData.cityApartmentEvidence.roomRebuiltOrDeleted,false);
assert.equal(built.group.userData.cityApartmentEvidence.accessVisualOnly,true);
const frames=Array.from({length:3},(_,i)=>built.group.getObjectByName(
 "writer-apartment-level-"+i+"-floor"));
assert.ok(frames.every(x=>x?.isMesh),"Three lower floors need real scene geometry");
const lobby=built.group.getObjectByName("writer-apartment-street-lobby");
const shaft=built.group.getObjectByName("writer-apartment-stair-shaft");
const landing=built.group.getObjectByName("writer-apartment-third-floor-access-landing");
assert.ok(lobby?.isMesh && shaft?.isMesh && landing?.isMesh,"Third-floor entrance access missing");
scene.updateMatrixWorld(true);
const box=new THREE.Box3().setFromObject(built.group);
assert.ok(Math.abs(box.min.y-(-3))<=.15,"Ground floor does not touch street");
assert.ok(Math.abs(box.max.y-6.6)<=.20,"Third-floor support is detached");
assert.ok(box.max.x<5 && box.min.x>-5 && box.max.z<6&&box.min.z>-5,
  "Proxy spread beyond protected origin courtyard");
let meshes=0;
built.group.traverse(o=>{
 if(!o.isMesh)return;meshes++;
 assert.equal(o.userData.cityApartmentEvidence.physicalCollider,false);
 const bbox=new THREE.Box3().setFromObject(o);
 assert.ok([...bbox.min,...bbox.max].every(Number.isFinite));
});
assert.ok(meshes>=35&&meshes<100,"Bounded simple apartment LOD");
console.log("TEHRAN-WRITER-APARTMENT-FLOOR3-OK",JSON.stringify({
 ownerScenario:true,thirdFloorElevation:apartment.apartmentFloorElevation(-3),
 floorsBelowRoom:3,schematicFloorsTotal:4,meshCount:meshes,
 groundWorldElevation:box.min.y,topSupportElevation:box.max.y,
 writerRoomPreserved:true,originalRoomLogicEdited:false,
 sourceFloorsVerified:false,physicalCollisionChanges:0
}));
