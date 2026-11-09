/* MAYOR-041: source geometry and independent third footprint regression.
 * node tests/tehran_writer_block_building_03_probe.mjs [root]
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const read=p=>readFileSync(resolve(root,p),"utf8");
const uri=s=>"data:text/javascript;base64,"+Buffer.from(s).toString("base64");
const urban=uri(read("web/urban-plan.js"));
const road=uri(read("web/writer-block-road-preview.js")
 .replace(/"\.\/urban-plan\.js\?v=[^"]+"/,JSON.stringify(urban)));
const data=uri(read("web/writer-block-building-data.js"));
const bulk=uri(read("web/writer-block-buildings.js")
 .replace(/"\.\/writer-block-building-data\.js\?v=[^"]+"/,JSON.stringify(data))
 .replace(/"\.\/writer-block-road-preview\.js\?v=[^"]+"/,JSON.stringify(road)));
const builder=uri(read("web/writer-block-building-03.js")
 .replace(/"\.\/writer-block-building-data\.js\?v=[^"]+"/,JSON.stringify(data))
 .replace(/"\.\/writer-block-buildings\.js\?v=[^"]+"/,JSON.stringify(bulk))
 .replace(/"\.\/writer-block-road-preview\.js\?v=[^"]+"/,JSON.stringify(road)));
const THREE=await import(uri(read("web/vendor/three.module.js")));
const model=await import(builder),osm=await import(road),preview=await import(bulk);
const survey=JSON.parse(read("city/survey/output/writer-block-overture-buildings.json"));
const source=survey.buildings.find(b=>b.id===model.BUILDING_03_ID);
assert.ok(source);
assert.equal(source.ringsLocalXZ.length,1);
assert.equal(source.ringsLocalXZ[0].length,32);
assert.equal(source.areaSquareMeters,2505.89);
assert.equal(source.heightMetersSource,null);
assert.equal(source.numberFloorsSource,null);
const plan=model.planWriterBlockBuilding03();
assert.equal(plan.sourceId,source.id);
assert.ok(Math.abs(plan.areaSquareMeters-source.areaSquareMeters)<.08);
assert.equal(plan.measuredHeightMeters,null);
assert.equal(plan.measuredFloors,null);
assert.equal(plan.verifiedUnits,null);
assert.equal(plan.verifiedShopUnits,null);
assert.equal(plan.scaleGuideIsRealFloor,false);
assert.equal(plan.physicalCollider,false);
assert.equal(plan.writerRoomPreserved,true);
assert.equal(plan.sourceLicense,"ODbL-1.0");
for(let i=0;i<32;i++)assert.deepEqual(
 [plan.perimeterXZ[i].x,plan.perimeterXZ[i].z],source.ringsLocalXZ[0][i]);
for(const p of plan.perimeterXZ)
 assert.ok(osm.writerBlockContainsLocalPoint(p.x,p.z));
const scene=new THREE.Scene(),home=new THREE.Group();
home.name="writer-interior-street-level";scene.add(home);
const result=model.buildWriterBlockBuilding03(THREE,scene,{streetY:-3});
assert.equal(scene.children.length,2);
assert.equal(scene.getObjectByName(home.name),home);
assert.equal(result.group.children.length,2);
assert.equal(result.mass.isMesh,true);
assert.equal(result.guides.isLineSegments,true);
assert.equal(result.mass.userData.cityBuildingEvidence.noFakeShopfronts,true);
assert.equal(result.mass.userData.cityBuildingEvidence.physicalCollider,false);
assert.equal(result.guides.userData.cityEvidence.linesAreMetreRulersOnly,true);
const bounds=new THREE.Box3().setFromObject(result.mass);
assert.ok(Math.abs(bounds.min.y+3)<.0001);
assert.ok(Math.abs(bounds.max.y-3)<.0001);
const attr=result.mass.geometry.getAttribute("position");
assert.ok(attr.count>100&&attr.count<2000);
for(const obj of [result.mass,result.guides]){
 const a=obj.geometry.getAttribute("position");
 for(let i=0;i<a.count;i++){
  const x=a.getX(i),y=a.getY(i),z=a.getZ(i);
  assert.ok([x,y,z].every(Number.isFinite));
  assert.ok(osm.writerBlockContainsLocalPoint(x,z));
  assert.ok(Math.abs(x)>4||Math.abs(z)>4,"Protected writer room reserve");
  assert.ok(y>=-3.001&&y<3.1);
 }
}
const bulkMap=preview.buildWriterBlockBuildingMasses(THREE,new THREE.Group(),{streetY:-3});
assert.equal(bulkMap.group.userData.citySurvey.generatedVolumeCount,0);
assert.equal(bulkMap.group.children.length,1,"Only the evidence outline remains in the bulk group");
assert.equal(bulkMap.volume.parent,null,"Empty geometry must never be attached to the scene");
assert.equal(bulkMap.group.userData.citySurvey.independentlyModeledCount,3);
assert.equal(bulkMap.group.userData.citySurvey.totalDistinctSourceVolumeCount,3);
assert.equal(bulkMap.group.userData.citySurvey.ignoredRoomCollisionCount,1);
assert.ok(!bulkMap.volume.userData.modeledSourceIds.includes(source.id));
assert.match(read("web/town-tehran-rebuild.js"),/buildWriterBlockBuilding03\(THREE,group,\{streetY\}\)/);
console.log("TEHRAN-BUILDING-03-SOURCE-PROXY-OK",JSON.stringify({
 sourceId:source.id,areaSquareMeters:plan.areaSquareMeters,vertices:31,
 verifiedFloors:null,verifiedUnits:null,proxyHeightMeters:6,
 duplicatedSourceVolumes:0,writerRoomPreserved:true
}));
