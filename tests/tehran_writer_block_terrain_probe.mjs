/* Real Three.js test for bounded, source-backed SRTM contours + hidden relief.
 * node tests/tehran_writer_block_terrain_probe.mjs [site-root]
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const read=p=>readFileSync(resolve(root,p),"utf8");
const asUrl=s=>"data:text/javascript;base64,"+Buffer.from(s).toString("base64");
const urbanSource=read("web/urban-plan.js");
const roadSource=read("web/writer-block-road-preview.js")
  .replace(/"\.\/urban-plan\.js\?v=[^"]+"/,JSON.stringify(asUrl(urbanSource)));
const dataSource=read("web/writer-block-terrain-data.js");
const terrainSource=read("web/writer-block-terrain.js")
  .replace(/"\.\/writer-block-road-preview\.js\?v=[^"]+"/,JSON.stringify(asUrl(roadSource)))
  .replace(/"\.\/writer-block-terrain-data\.js\?v=[^"]+"/,JSON.stringify(asUrl(dataSource)));
const terrain=await import(asUrl(terrainSource));
const roads=await import(asUrl(roadSource));
const d=(await import(asUrl(dataSource))).WRITER_BLOCK_DEM_SOURCE;
const THREE=await import(asUrl(read("web/vendor/three.module.js")));
assert.equal(terrain.validateWriterBlockDEM(),true);
assert.equal(d.grid.heightsMetersEGM96.length,63);
assert.equal(d.stats.sampleCount,64);
assert.equal(d.nominalRasterResolutionMeters,30);
assert.equal(d.verticalDatum,"EGM96 geoid");
assert.equal(d.homeAnchor.lat,35.715361987616696);
assert.equal(d.homeAnchor.lon,51.3642455031707);
const h=terrain.writerBlockTerrainHeight(0,0);
assert.ok(h>=d.stats.minimumMetersEGM96&&h<=d.stats.maximumMetersEGM96);
assert.equal(terrain.writerBlockTerrainHeight(1000,1000),null);
const tris=terrain.buildClippedTerrainTriangles();
assert.ok(tris.length>20);
const area=tris.reduce((sum,tri)=>sum+Math.abs(
  (tri[1].x-tri[0].x)*(tri[2].z-tri[0].z)-(tri[2].x-tri[0].x)*(tri[1].z-tri[0].z)
)/2,0);
assert.ok(Math.abs(area-roads.writerBlockRingArea())<.1,
  "DEM must clip exactly to the OSM candidate block");
for(const tri of tris){
 const x=(tri[0].x+tri[1].x+tri[2].x)/3,z=(tri[0].z+tri[1].z+tri[2].z)/3;
 assert.ok(roads.writerBlockContainsLocalPoint(x,z),"Triangle outside writer block");
}
const lines=terrain.buildWriterBlockContours();
assert.ok(lines.length>3,"Real source must create visible contours");
for(const line of lines){
 assert.ok(Math.abs(line.level/2-Math.round(line.level/2))<1e-8);
 assert.ok([line.q.x,line.q.z,line.r.x,line.r.z].every(Number.isFinite));
 const x=(line.q.x+line.r.x)/2,z=(line.q.z+line.r.z)/2;
 assert.ok(roads.writerBlockContainsLocalPoint(x,z),"Contour outside mapped writer block");
}
const parent=new THREE.Group();
const model=terrain.buildWriterBlockTerrain(THREE,parent,{streetY:-3});
assert.equal(parent.children.length,1);
assert.equal(model.group.children.length,2);
assert.equal(model.contours.visible,true);
assert.equal(model.relief.visible,false,"Unverified terrain MUST NOT replace physical ground");
assert.equal(model.contours.userData.physicalCollider,false);
assert.equal(model.relief.userData.physicalCollider,false);
assert.equal(model.group.userData.cityTerrainEvidence.blockLimited,true);
assert.equal(model.group.userData.cityTerrainEvidence.contourIntervalMeters,2);
assert.equal(model.group.userData.cityTerrainEvidence.nominalResolutionMeters,30);
assert.equal(model.relief.geometry.attributes.position.count,tris.length*3);
assert.equal(model.contours.geometry.attributes.position.count,lines.length*6);
for(const o of [model.relief,model.contours]){
 assert.equal(o.castShadow,false);
 assert.equal(o.receiveShadow,false);
 for(const v of o.geometry.attributes.position.array)
   assert.ok(Number.isFinite(v),"DEM mesh contains NaN/Infinity");
}
console.log("TEHRAN-WRITER-TERRAIN-OK",JSON.stringify({
  samples:d.stats.sampleCount,absoluteElevationRangeMeters:
    [d.stats.minimumMetersEGM96,d.stats.maximumMetersEGM96],
  clippedAreaSquareMeters:Number(area.toFixed(2)),triangles:model.triangleCount,
  contourSegments:model.contourSegments,altitudeAtHouseMeters:Number(h.toFixed(2)),
  physicalTerrainReplaced:false
}));
