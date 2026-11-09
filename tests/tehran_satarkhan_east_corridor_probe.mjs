/* MAYOR-047: actual licensed OSM road geometry to Satarkhan main.
 * Run: node tests/tehran_satarkhan_east_corridor_probe.mjs [site-root]
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const read=p=>readFileSync(resolve(root,p),"utf8");
const THREE=await import("data:text/javascript;base64,"+
 Buffer.from(read("web/vendor/three.module.js")).toString("base64"));
const code=await import("data:text/javascript;base64,"+
 Buffer.from(read("web/writer-satarkhan-osm-corridor.js")).toString("base64"));
const source=JSON.parse(read("city/survey/output/writer-block-survey.json"));
assert.equal(source.capturedAt,code.SATARKHAN_CORRIDOR_SOURCE.capturedAt);
assert.equal(source.license,code.SATARKHAN_CORRIDOR_SOURCE.license);
assert.equal(source.blockBoundary.status,"OSM_CENTERLINE_CANDIDATE");
assert.equal(code.SATARKHAN_CORRIDOR_WAYS.length,6);
const roads=new Map(source.features.features.filter(f=>f.properties.kind==="road")
 .map(f=>[Number(f.id.split(":").at(-1)),f]));
for(const way of code.SATARKHAN_CORRIDOR_WAYS){
 const original=roads.get(way.wayId);
 assert.ok(original,"OSM source ID not in dated API acquisition: "+way.wayId);
 assert.equal(original.properties.tags.name,way.name);
 assert.equal(original.properties.tags.highway,way.highway);
 assert.equal(original.properties.tags.maxspeed??null,way.maxspeed);
 assert.equal(original.properties.tags.oneway??null,way.oneway);
 assert.deepEqual(way.localXZ,original.properties.localXZ.slice(
   way.sourceStart,way.sourceEnd+1),"OSM vertices must NEVER be guessed/shifted");
 assert.ok(way.localXZ.every(pt=>pt.length===2&&pt.every(Number.isFinite)));
}
const main=code.SATARKHAN_CORRIDOR_WAYS.find(w=>w.wayId===207742970);
assert.equal(main.highway,"primary");
assert.equal(main.name,"ستارخان");
assert.equal(main.maxspeed,"50");
const topology=code.inspectSatarkhanCorridorTopology();
assert.equal(topology.mainStreetConnected,true);
assert.equal(topology.parkPolygonPresent,false);
assert.equal(Object.values(topology.joints).filter(Boolean).length,5);
const scene=new THREE.Scene(),room=new THREE.Group();
room.name="writer-interior-street-level";
room.position.y=6.6;scene.add(room);
const canvasTex=(w,h,fn)=>{
 const ctx={clearRect(){},fillRect(){},fillText(){}};
 fn(ctx,w,h);return new THREE.Texture({width:w,height:h});
};
const {group,mesh}=code.buildSatarkhanEastRoadCorridor(THREE,scene,{
  streetY:-3,canvasTex
});
assert.equal(group.parent,scene);
assert.equal(scene.getObjectByName(room.name),room);
assert.equal(room.position.y,6.6);
assert.equal(group.userData.cityCorridorEvidence.streetCount,6);
assert.equal(group.userData.cityCorridorEvidence.mainStreetReached,true);
assert.equal(group.userData.cityCorridorEvidence.parkReached,false);
assert.equal(group.userData.cityCorridorEvidence.realRoadWidthsMeasured,false);
assert.equal(group.userData.cityCorridorEvidence.physicalCollider,false);
assert.equal(mesh.userData.cityCorridorEvidence.vehiclePathModified,false);
assert.equal(mesh.userData.cityCorridorEvidence.citizenRoutesModified,false);
assert.equal(mesh.userData.cityCorridorEvidence.writerRoomPreserved,true);
assert.equal(group.children.length,4,"One cheap multi-material road mesh plus three graphic street labels");
assert.ok(mesh.isMesh&&mesh.geometry.groups.length===3);
const position=mesh.geometry.getAttribute("position");
assert.ok(position.count>=100&&position.count<2000,"Bounded sourced polyline strip geometry");
for(let i=0;i<position.count;i++){
 const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
 assert.ok([x,y,z].every(Number.isFinite));
 assert.ok(x>12&&x<230&&z>-150&&z<61,"Road outside verified east-side phase");
 assert.ok(y>=-3&&y<=-2.65,"Road visual float or underground");
}
let count=0;
group.traverse(obj=>{
 if(!obj.isMesh)return;count++;
 const b=new THREE.Box3().setFromObject(obj);
 assert.ok([...b.min,...b.max].every(Number.isFinite));
 assert.equal(obj.userData.cityCorridorEvidence?.physicalCollider,false);
});
assert.equal(count,4);
console.log("TEHRAN-SATARKHAN-OSM-EAST-CORRIDOR-OK",JSON.stringify({
 sourceWays:6,roadNames:code.SATARKHAN_CORRIDOR_WAYS.map(w=>w.name),
 sourceJunctions:topology.joints,confirmedMainStreetWay:207742970,
 sourceSpeedKmh:50,visualRoadTriangles:position.count/3,
 drawableMeshes:count,writerThirdFloorUnchanged:true,
 actualWidthsMeasured:false,trafficCollisionChanged:false,
 parkSattarkhanPolygonFetched:false
}));
