/* MAYOR-034: real Overture roofprint extrusion (not actual verified heights).
 * node tests/tehran_writer_block_buildings_probe.mjs [site-root]
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const read=p=>readFileSync(resolve(root,p),"utf8");
const url=s=>"data:text/javascript;base64,"+Buffer.from(s).toString("base64");
const urban=read("web/urban-plan.js");
const road=read("web/writer-block-road-preview.js").replace(
  /"\.\/urban-plan\.js\?v=[^"]+"/,JSON.stringify(url(urban)));
const data=read("web/writer-block-building-data.js");
const code=read("web/writer-block-buildings.js").replace(
  /"\.\/writer-block-building-data\.js\?v=[^"]+"/,JSON.stringify(url(data))).replace(
  /"\.\/writer-block-road-preview\.js\?v=[^"]+"/,JSON.stringify(url(road)));
const THREE=await import(url(read("web/vendor/three.module.js")));
const source=(await import(url(data))).WRITER_BLOCK_BUILDING_SOURCE;
const survey=await import(url(code));
const osm=await import(url(road));
const stored=JSON.parse(read("city/survey/output/writer-block-overture-buildings.json"));
assert.deepEqual(source,stored,"Browser input must EXACTLY match captured open-data extract");
assert.equal(survey.validateWriterBuildingSurvey(),true);
assert.equal(source.counts.inBlock,4);
assert.equal(source.counts.knownSourceHeight,0,"Unknown source heights must remain unknown");
assert.equal(source.license,"ODbL-1.0");
assert.match(source.release,/NOT verified/);
const plan=survey.writerBlockBuildingPlan();
assert.equal(plan.length,4);
assert.equal(plan.filter(p=>p.protectedWriterRoom).length,1);
assert.equal(plan.filter(p=>!p.protectedWriterRoom).length,3);
assert.ok(plan.every(b=>b.symbolicOnly&&b.sourceHeightMeters===null));
assert.ok(plan.some(p=>p.protectedWriterRoom&&p.footprintRings.some(r=>survey.touchesWriterRoom(r))));
assert.ok(plan.reduce((sum,b)=>sum+b.surfaceAreaMeters2,0)>5000);

const parent=new THREE.Group(),result=survey.buildWriterBlockBuildingMasses(THREE,parent,{streetY:-3});
assert.equal(parent.children.length,1);
assert.equal(result.group.children.length,2);
assert.equal(result.group.name,"writer-block-overture-building-reconstruction");
assert.equal(result.group.userData.citySurvey.originalRoofprints,4);
assert.equal(result.group.userData.citySurvey.generatedVolumeCount,1);
assert.equal(result.group.userData.citySurvey.independentlyModeledCount,2);
assert.equal(result.group.userData.citySurvey.totalDistinctSourceVolumeCount,3);
assert.deepEqual(result.group.userData.citySurvey.individuallyModeledSourceIds,["3d2290d6-c533-4c11-b2c0-079f0ee2e29e","3d7b8239-b1e0-48bc-8868-ae4a4d392586"]);
assert.equal(result.group.userData.citySurvey.ignoredRoomCollisionCount,1);
assert.equal(result.group.userData.citySurvey.protectedWriterRoom,true);
assert.equal(result.group.userData.citySurvey.physicalCollider,false);
assert.equal(result.group.userData.citySurvey.sourceHeightKnownCount,0);
assert.equal(result.group.userData.citySurvey.renderedHeightUnverified,true);
assert.equal(result.volume.userData.physicalCollider,false);
assert.equal(result.volume.geometry.getAttribute("position").count%3,0);
assert.equal(result.volume.material.transparent,true);
assert.equal(result.volume.castShadow,false);
assert.ok(result.volume.geometry.getAttribute("position").count>100);
assert.ok(result.volume.geometry.getAttribute("position").count<30000);
assert.equal(result.outline.isLineSegments,true);
assert.equal(result.outline.userData.protectedSourceIds.length,1);
assert.equal(result.outline.geometry.attributes.position.count%2,0);
const b=new THREE.Box3().setFromObject(result.volume);
assert.ok(b.min.y>=-3.01&&b.max.y<=3.01,"Unknown heights are only 6m display proxies");
for(const a of [result.volume.geometry.attributes.position,result.outline.geometry.attributes.position]){
  for(let i=0;i<a.count;i++){
    const x=a.getX(i),y=a.getY(i),z=a.getZ(i);
    assert.ok([x,y,z].every(Number.isFinite));
    assert.ok(osm.writerBlockContainsLocalPoint(x,z),
      "Footprints must remain STRICTLY in one sourced writer block");
    if(a===result.volume.geometry.attributes.position)
      assert.ok(!(Math.abs(x)<4&&Math.abs(z)<4),
        "A proxy volume must never cover the protected writer's room");
  }
}
assert.match(read("web/town.js"),/buildWriterBlockBuildingMasses\(THREE,group,\{streetY:STREET_Y\}\)/);
assert.equal((await import(url(urban))).auditUrbanPlan().ok,true);
result.volume.geometry.dispose();
result.volume.material.dispose();
result.outline.geometry.dispose();
result.outline.material.dispose();
console.log("TEHRAN-REAL-BUILDING-ROOFPRINTS-OK",JSON.stringify({
  footprints:source.counts.inBlock,symbolic3DMasses:1,individuallyReconstructedPlans:2,writerRoomProtected:true,
  unknownHeights:4,renderMeshes:1,renderOutlines:1,
  inputSourceBlobBytes:read("city/survey/output/writer-block-overture-buildings.json").length,
  vertices:result.volume.geometry.attributes.position.count,
  boundHeightMeters:b.max.y-b.min.y,
  areaSquareMeters:plan.reduce((s,b)=>s+b.surfaceAreaMeters2,0)
}));
