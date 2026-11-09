/* MAYOR-049 — sourced Sixth Daryan map position vs clearly hypothetical
 * 10.7m local street section, continuous accessible widths and parallel parking.
 * node tests/tehran_sixth_daryan_street_section_probe.mjs [root]
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const read=p=>readFileSync(resolve(root,p),"utf8");
const importText=p=>import("data:text/javascript;base64,"+
  Buffer.from(read(p)).toString("base64"));
const [THREE,road,roofs]=await Promise.all([
  importText("web/vendor/three.module.js"),
  importText("web/writer-satarkhan-osm-corridor.js"),
  importText("web/writer-block-building-data.js")
]);
const snapshot=JSON.parse(read("city/survey/output/writer-block-survey.json"));
const source=snapshot.features.features.find(f=>f.id==="osm:way:92200441");
assert.ok(source,"Sourced sixth Daryan road ID missing");
assert.equal(source.properties.tags.name,"ششم دریان نو");
assert.equal(source.properties.tags.highway,"residential");
assert.equal(source.properties.tags.maxspeed,"30");
assert.equal(source.properties.tags.oneway??null,null,
  "Unknown OSM oneway must not be claimed bidirectional on street sign");
assert.equal(source.properties.tags.width??null,null,
  "No measured width in this OSM capture");
assert.equal(source.properties.tags["parking:right"]??null,null,
  "Parking legality is not sourced");
const plan=road.planSixthDaryanIllustrativeSection();
const p=road.SIXTH_DARYAN_DESIGN_PROFILE;
const original=road.SATARKHAN_CORRIDOR_WAYS.find(w=>w.wayId===92200441);
assert.deepEqual(original.localXZ,source.properties.localXZ.slice(
 original.sourceStart,original.sourceEnd+1));
assert.deepEqual(plan.sourcePolyline,original.localXZ);
assert.equal(p.kind,"DESIGN_HYPOTHESIS_NOT_SURVEY");
assert.equal(p.actualRightOfWayMeters,null);
assert.equal(p.actualCarriagewayWidthMeters,null);
assert.equal(p.parkingPermissionVerified,false);
assert.equal(p.onewaySourceTag,null);
assert.equal(plan.actualParkingPermitted,null);
assert.equal(plan.directionOfRealTrafficKnown,false);
assert.equal(plan.twoMovingEnvelopesAlwaysClear,true);
assert.equal(plan.sidewalksContinuous,true);
assert.ok(p.eachMovingEnvelopeMeters>=p.guidelineMinimums.movingLane);
assert.ok(p.parkingRightWidthMeters>=p.guidelineMinimums.parallelParking);
assert.ok(p.footpathEachSideMeters>=p.guidelineMinimums.clearSidewalk);
const widths=[plan.travel[1]-plan.travel[0],
 plan.parking[1]-plan.parking[0],
 plan.sidewalkR[1]-plan.sidewalkR[0],
 plan.sidewalkL[1]-plan.sidewalkL[0]];
for(const width of widths)assert.ok(width>1);
assert.ok(Math.abs(widths.reduce((a,b)=>a+b,0)-p.fullConceptSectionMeters)<1e-9);
assert.ok(Math.abs(p.fullConceptSectionMeters-10.7)<1e-9);
assert.equal(p.movingZoneMeters,5.6);
assert.equal(plan.slots.length,7);
assert.equal(plan.parkedCars.length,5);
assert.ok(plan.parkingClearanceMeters>=.19,
  "Cars intrude on moving lane or unobstructed sidewalk");
for(let i=0;i<plan.slots.length;i++){
 const slot=plan.slots[i],t=slot.distanceFromWayStart;
 assert.ok(t-slot.lengthMeters/2>=p.minimumEndSetbackMeters,
   "Parked car can block local street entry/exit");
 assert.ok(t+slot.lengthMeters/2<=plan.lengthMeters-p.minimumEndSetbackMeters);
 if(i>0)assert.ok(t-plan.slots[i-1].distanceFromWayStart>=15);
}
function pointInRing(point,ring){
 let inside=false;
 for(let i=0,j=ring.length-2;i<ring.length-1;j=i++){
   const a=ring[i],b=ring[j];
   if((a[1]>point.z)!==(b[1]>point.z)&&
     point.x<(b[0]-a[0])*(point.z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
// Existing FOUR Overture ML footprint candidates must not be buried under
// this new hypothetical road width; source ML roofs are not actual parcels.
assert.equal(roofs.WRITER_BLOCK_BUILDING_SOURCE.buildings.length,4);
for(let t=0;t<=plan.lengthMeters;t+=2){
 for(const offset of [-6.4,-4.9,-2.8,0,2.8,4.3]){
   const pt=plan.toPoint(t,offset);
   for(const b of roofs.WRITER_BLOCK_BUILDING_SOURCE.buildings)
     for(const ring of b.ringsLocalXZ)
       assert.equal(pointInRing(pt,ring),false,
         "Tentative sidewalk/carriageway overlaps known mapped roofprint "+b.id);
 }
}
const scene=new THREE.Scene(),writer=new THREE.Group();
writer.name="writer-interior-street-level";writer.position.y=6.6;
scene.add(writer);
const makeTex=(w,h,draw)=>{
 const ctx={clearRect(){},fillRect(){},fillText(){}};
 draw(ctx,w,h);return new THREE.Texture({width:w,height:h});
};
const {group,topology}=road.buildSatarkhanEastRoadCorridor(
 THREE,scene,{streetY:-3,canvasTex:makeTex});
const section=group.getObjectByName("sixth-daryan-concept-pedestrian-parking-cross-section");
assert.ok(section);
assert.equal(scene.getObjectByName(writer.name),writer);
assert.equal(writer.position.y,6.6);
assert.equal(topology.mainStreetConnected,true);
assert.equal(group.children.length,6,"Existing 5 objects plus 1 cross-section group");
assert.equal(section.children.length,3);
const secMeta=section.userData.cityStreetEvidence;
assert.equal(secMeta.sourceOSMWay,92200441);
assert.equal(secMeta.kind,"ILLUSTRATIVE_FIT_REQUIRES_CADASTRAL_SURVEY");
assert.equal(secMeta.actualOnewayKnown,false);
assert.equal(secMeta.parkingZoneWidthMeters,2.1);
assert.equal(secMeta.clearFootpathEachSideMeters,1.5);
assert.equal(secMeta.unverifiedRightOfWay,true);
assert.equal(secMeta.physicalCollider,false);
assert.equal(secMeta.existingVehicleRoutesChanged,false);
assert.equal(secMeta.citizensRoutesChanged,false);
assert.equal(secMeta.writerRoomPreserved,true);
const surface=section.getObjectByName("sixth-daryan-separated-travel-parking-sidewalks");
const markings=section.getObjectByName("illustrative-parallel-parking-bay-dividers");
const cars=section.getObjectByName("illustrative-parked-cars-only");
assert.equal(surface.geometry.groups.length,6,"Separate car, parking, sidewalks and curb strips");
assert.equal(markings.geometry.getAttribute("position").count,14*6);
assert.equal(cars.children.length,3);
const body=cars.getObjectByName("parked-car-bodies");
const cabin=cars.getObjectByName("parked-car-cabins");
const wheels=cars.getObjectByName("parked-car-wheels-proxy");
assert.equal(body.count,5);
assert.equal(cabin.count,5);
assert.equal(wheels.count,20);
const matrix=new THREE.Matrix4(),center=new THREE.Vector3();
for(let i=0;i<body.count;i++){
 body.getMatrixAt(i,matrix);center.setFromMatrixPosition(matrix);
 const [x,z]=plan.sourcePolyline[0],dx=center.x-x,dz=center.z-z;
 const normal=dx*plan.longitudinal.nx+dz*plan.longitudinal.nz;
 const length=dx*plan.longitudinal.ux+dz*plan.longitudinal.uz;
 assert.ok(Math.abs(normal-plan.parkingOffset)<.001,
   "Parked car does not remain inside dedicated parking strip");
 assert.ok(length>p.minimumEndSetbackMeters&&length<plan.lengthMeters-p.minimumEndSetbackMeters);
}
let meshes=0,invalid=[];
group.traverse(obj=>{
 if(!obj.isMesh)return;meshes++;
 const bbox=new THREE.Box3().setFromObject(obj);
 if(![...bbox.min,...bbox.max].every(Number.isFinite))invalid.push(obj.name);
 if(obj.userData.cityStreetEvidence)
   assert.equal(obj.userData.cityStreetEvidence.physicalCollider,false);
});
assert.deepEqual(invalid,[],"All city width/parking scene bounds must be finite");
assert.ok(meshes<=13,"Design must keep instanced draw-call count bounded");
assert.equal(road.SATARKHAN_OPPOSING_PRIMARY.wayId,1232461345);
console.log("TEHRAN-SIXTH-DARYAN-COMPLETE-STREET-OK",JSON.stringify({
 osmWayId:92200441,sourceLineLengthMetres:plan.lengthMeters,
 assumedWidthMetres:p.fullConceptSectionMeters,
 minTravelEnvelopeMetres:p.eachMovingEnvelopeMeters,
 parkingZoneMetres:p.parkingRightWidthMeters,
 sidewalkEachSideMetres:p.footpathEachSideMeters,
 parkedCars:body.count,emptyBays:plan.slots.length-body.count,
 clearanceToLiveLaneAndSidewalkMetres:plan.parkingClearanceMeters,
 nearIntersectionClearanceMetres:p.minimumEndSetbackMeters,
 existingMappedRoofprintCandidates:4,actualBuildingCountKnown:false,
 actualWidthsMeasured:false,actualParkingPermissionKnown:false,
 sourceOnly:true,thirdFloorWriterPreserved:true,
 trafficRoutesUnchanged:true,nonFiniteBounds:invalid.length
}));
