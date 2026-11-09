/* MAYOR-039: real Three.js geometry for SECOND sourced map polygon.
 * Root: node tests/tehran_writer_block_building_02_probe.mjs [site-root]
 * Floor bands and shop status MUST remain undocumented, never guessed.
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
const builder=uri(read("web/writer-block-building-02.js")
  .replace(/"\.\/writer-block-building-data\.js\?v=[^"]+"/,JSON.stringify(data))
  .replace(/"\.\/writer-block-buildings\.js\?v=[^"]+"/,JSON.stringify(bulk))
  .replace(/"\.\/writer-block-road-preview\.js\?v=[^"]+"/,JSON.stringify(road)));
const THREE=await import(uri(read("web/vendor/three.module.js")));
const model=await import(builder),osm=await import(road),preview=await import(bulk);
const original=JSON.parse(read("city/survey/output/writer-block-overture-buildings.json"));
const source=original.buildings.find(b=>b.id===model.BUILDING_02_ID);
assert.ok(source,"Second building must have a recorded source ID");
assert.equal(source.ringsLocalXZ.length,1);
assert.equal(source.ringsLocalXZ[0].length,16);
assert.equal(source.areaSquareMeters,1035.58);
assert.equal(source.heightMetersSource,null);
assert.equal(source.numberFloorsSource,null);

const plan=model.planWriterBlockBuilding02();
assert.equal(plan.sourceId,source.id);
assert.ok(Math.abs(plan.areaSquareMeters-source.areaSquareMeters)<.08);
assert.equal(plan.measuredHeightMeters,null);
assert.equal(plan.measuredFloors,null);
assert.equal(plan.verifiedShopUnits,null);
assert.equal(plan.shopNames,null);
assert.equal(plan.sourcedEntranceLocations,null);
assert.equal(plan.guideRepresentsRealFloorCount,false);
assert.equal(plan.physicalCollider,false);
assert.equal(plan.writerRoomPreserved,true);
assert.equal(plan.sourceLicense,"ODbL-1.0");
assert.equal(plan.perimeterXZ.length,16);
for(let i=0;i<16;i++)assert.deepEqual(
  [plan.perimeterXZ[i].x,plan.perimeterXZ[i].z],source.ringsLocalXZ[0][i],
  "Source map polygon must never be distorted");
for(const p of plan.perimeterXZ)
  assert.ok(osm.writerBlockContainsLocalPoint(p.x,p.z),
    "Map footprint must remain inside one approved block");

const scene=new THREE.Scene();
const home=new THREE.Group();home.name="writer-interior-street-level";scene.add(home);
const result=model.buildWriterBlockBuilding02(THREE,scene,{streetY:-3});
assert.equal(scene.children.length,2);
assert.ok(scene.getObjectByName("writer-interior-street-level")===home);
assert.equal(result.group.name,"writer-block-building-02-georeferenced");
assert.equal(result.group.children.length,2,"One mass plus one shared level/roof line object");
assert.equal(result.mass.isMesh,true);
assert.equal(result.guides.isLineSegments,true);
assert.equal(result.mass.userData.cityBuildingEvidence.actualFacadeKnown,false);
assert.equal(result.mass.userData.cityBuildingEvidence.verifiedStoreys,0);
assert.equal(result.mass.userData.cityBuildingEvidence.noFakeShopfronts,true);
assert.equal(result.mass.userData.cityBuildingEvidence.physicalCollider,false);
assert.equal(result.guides.userData.cityEvidence.actuallyMeasuredFloors,null);
assert.equal(result.guides.userData.cityEvidence.actualShops,null);
assert.equal(result.guides.userData.cityEvidence.linesAreMetreRulersOnly,true);
const bounds=new THREE.Box3().setFromObject(result.mass);
assert.ok(Math.abs(bounds.min.y+3)<.0001);
assert.ok(Math.abs(bounds.max.y-3)<.0001);
const upper=result.guides.geometry.getAttribute("position");
assert.equal(upper.count,(plan.perimeterXZ.length-1)*4);
const a=result.mass.geometry.getAttribute("position");
assert.ok(a.count>60&&a.count<1800,"Reasonably low-poly geographic shell");
for(const coords of [a,upper]){
  for(let i=0;i<coords.count;i++){
    const [x,y,z]=[coords.getX(i),coords.getY(i),coords.getZ(i)];
    assert.ok([x,y,z].every(Number.isFinite));
    assert.ok(osm.writerBlockContainsLocalPoint(x,z),"3D source material exceeded block");
    assert.ok(Math.abs(x)>4||Math.abs(z)>4,"Author's room reserve must be empty");
    assert.ok(y>=-3.001&&y<3.1);
  }
}
const bulkMap=preview.buildWriterBlockBuildingMasses(THREE,new THREE.Group(),{streetY:-3});
assert.equal(bulkMap.group.userData.citySurvey.originalRoofprints,4);
assert.equal(bulkMap.group.userData.citySurvey.generatedVolumeCount,1);
assert.equal(bulkMap.group.userData.citySurvey.independentlyModeledCount,2);
assert.equal(bulkMap.group.userData.citySurvey.totalDistinctSourceVolumeCount,3);
assert.ok(!bulkMap.volume.userData.modeledSourceIds.includes(source.id),
  "Second building must NOT render twice");
assert.equal(bulkMap.group.userData.citySurvey.ignoredRoomCollisionCount,1);
assert.match(read("web/town-tehran-rebuild.js"),/buildWriterBlockBuilding02\(THREE,group,\{streetY\}\)/);
result.mass.geometry.dispose();
for(const material of result.mass.material)material.dispose();
result.guides.geometry.dispose();result.guides.material.dispose();
bulkMap.volume.geometry.dispose();bulkMap.volume.material.dispose();
bulkMap.outline.geometry.dispose();bulkMap.outline.material.dispose();
console.log("TEHRAN-BUILDING-02-FLOOR-EVIDENCE-OK",JSON.stringify({
  sourceId:source.id,footprintSqm:plan.areaSquareMeters,
  sourceVertices:15,sourcedFloors:null,sourcedShops:null,
  illustrativeEnvelopeMeters:6,illustrativeMidlineMeters:3,
  duplicatedSourceVolumes:0,writerRoomPreserved:true
}));
