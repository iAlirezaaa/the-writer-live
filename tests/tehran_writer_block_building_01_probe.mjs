/* MAYOR-037: first source-map building built individually, no invented floors.
 * node tests/tehran_writer_block_building_01_probe.mjs [site-root]
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const read=p=>readFileSync(resolve(root,p),"utf8");
const uri=s=>"data:text/javascript;base64,"+Buffer.from(s).toString("base64");
const u=uri(read("web/urban-plan.js"));
const road=uri(read("web/writer-block-road-preview.js").replace(
  /"\.\/urban-plan\.js\?v=[^"]+"/,JSON.stringify(u)));
const data=uri(read("web/writer-block-building-data.js"));
const bulkSource=read("web/writer-block-buildings.js")
  .replace(/"\.\/writer-block-building-data\.js\?v=[^"]+"/,JSON.stringify(data))
  .replace(/"\.\/writer-block-road-preview\.js\?v=[^"]+"/,JSON.stringify(road));
const bulk=uri(bulkSource);
const src=read("web/writer-block-building-01.js")
  .replace(/"\.\/writer-block-building-data\.js\?v=[^"]+"/,JSON.stringify(data))
  .replace(/"\.\/writer-block-buildings\.js\?v=[^"]+"/,JSON.stringify(bulk))
  .replace(/"\.\/writer-block-road-preview\.js\?v=[^"]+"/,JSON.stringify(road));
const model=await import(uri(src));
const preview=await import(bulk),osm=await import(road);
const THREE=await import(uri(read("web/vendor/three.module.js")));
const captured=JSON.parse(read("city/survey/output/writer-block-overture-buildings.json"));
const sourceId="3d7b8239-b1e0-48bc-8868-ae4a4d392586";
assert.equal(model.BUILDING_01_SOURCE_ID,sourceId);
assert.equal(model.BUILDING_01_VISUAL_HEIGHT_METERS,6);
const sourced=captured.buildings.find(b=>b.id===sourceId);
assert.ok(sourced&&sourced.heightMetersSource===null);
assert.ok(sourced.numberFloorsSource===null);
assert.equal(sourced.areaSquareMeters,965.73);
const plan=model.planWriterBlockBuilding01();
assert.equal(plan.sourceId,sourceId);
assert.equal(plan.sourceFootprintAreaSqm,sourced.areaSquareMeters);
assert.equal(plan.polygon.length,sourced.ringsLocalXZ[0].length);
for(let i=0;i<plan.polygon.length;i++){
  assert.equal(plan.polygon[i].x,sourced.ringsLocalXZ[0][i][0]);
  assert.equal(plan.polygon[i].z,sourced.ringsLocalXZ[0][i][1]);
}
assert.ok(Math.abs(plan.footprintAreaSqm-965.73)<.03);
assert.equal(plan.sourceLicense,"ODbL-1.0");
assert.equal(plan.measuredHeightMeters,null);
assert.equal(plan.quality,"T1-PLAN-EVIDENCED; T2/T3-UNKNOWN");
assert.equal(plan.roomPreserved,true);
assert.equal(plan.physicalCollider,false);
assert.equal(plan.sourceMayMergeRealBuildings,true);
for(const p of plan.polygon)assert.equal(osm.writerBlockContainsLocalPoint(p.x,p.z),true);

const parent=new THREE.Group(),result=model.buildWriterBlockBuilding01(THREE,parent,{streetY:-3});
assert.equal(parent.children.length,1);
assert.equal(result.group.children.length,2);
assert.equal(result.mass.isMesh,true);
assert.equal(result.roofOutline.isLineSegments,true);
assert.equal(result.mass.userData.cityBuildingEvidence.sourceId,sourceId);
assert.equal(result.group.userData.cityBuildingEvidence.sourceVertices,6);
assert.equal(result.mass.userData.cityBuildingEvidence.actualBuildingHeightKnown,false);
assert.equal(result.mass.userData.cityBuildingEvidence.actualRoofTypeKnown,false);
assert.equal(result.mass.userData.cityBuildingEvidence.noNavigationOrCollisionChanges,true);
assert.equal(result.mass.userData.cityBuildingEvidence.noWindowsOrEntrancesInferred,true);
assert.equal(result.mass.material.length,2);
assert.equal(result.mass.material[0].transparent,false);
assert.equal(result.mass.userData.cityBuildingEvidence.actualFootprintFromMap,true);
const box=new THREE.Box3().setFromObject(result.mass);
assert.ok(Math.abs(box.min.y+3)<1e-4,"Ground contact must be on existing street datum");
assert.ok(Math.abs(box.max.y-3)<1e-4,"Symbolic 6m not real height");
const geometry=result.mass.geometry;
const attr=geometry.getAttribute("position");
assert.ok(attr.count>60&&attr.count<2500);
for(let i=0;i<attr.count;i++){
 const x=attr.getX(i),y=attr.getY(i),z=attr.getZ(i);
 assert.ok([x,y,z].every(Number.isFinite),"No invalid source mesh vertices");
 assert.ok(osm.writerBlockContainsLocalPoint(x,z),"One building escaped OSM writer block");
 assert.ok(!(Math.abs(x)<4&&Math.abs(z)<4),"Room reserve violated");
}
for(let i=0;i<result.roofOutline.geometry.attributes.position.count;i++){
 const p=result.roofOutline.geometry.attributes.position;
 assert.ok(osm.writerBlockContainsLocalPoint(p.getX(i),p.getZ(i)));
}
// Old merged translucent ghost must not duplicate the new physically connected shell.
const oldGroup=new THREE.Group(),ghost=preview.buildWriterBlockBuildingMasses(THREE,oldGroup,{streetY:-3});
assert.equal(ghost.group.userData.citySurvey.generatedVolumeCount,2);
assert.equal(ghost.group.userData.citySurvey.independentlyModeledCount,1);
assert.deepEqual(ghost.group.userData.citySurvey.individuallyModeledSourceIds,[sourceId]);
assert.equal(ghost.group.userData.citySurvey.totalDistinctSourceVolumeCount,3);
assert.ok(!ghost.volume.userData.modeledSourceIds.includes(sourceId));
assert.equal(ghost.group.userData.citySurvey.ignoredRoomCollisionCount,1);
assert.match(read("web/town.js"),/buildWriterBlockBuilding01\(THREE,group,\{streetY:STREET_Y\}\)/);
geometry.dispose();
for(const m of result.mass.material)m.dispose();
result.roofOutline.geometry.dispose();
result.roofOutline.material.dispose();
console.log("TEHRAN-BUILDING-BY-BUILDING-01-OK",JSON.stringify({
  id:sourceId,areaSqm:plan.footprintAreaSqm,sourceVertices:6,
  realHeightMeters:null,illustrativeHeightMeters:6,
  protectedRoom:true,sourceVolumeDuplicates:0,
  meshVertices:attr.count,drawObjects:result.group.children.length
}));
