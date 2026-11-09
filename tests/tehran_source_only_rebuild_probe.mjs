/* MAYOR-038: load the ACTUAL default town entry point, ensure fictional
 * houses/roads/mountains are absent, and preserve the writer room separately.
 * Run: node --experimental-vm-modules tests/tehran_source_only_rebuild_probe.mjs [site-root]
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createContext, SourceTextModule } from "node:vm";

const root=resolve(process.argv[2]||".");
const web=resolve(root,"web");
const read=p=>readFileSync(resolve(root,p),"utf8");
const THREE=await import("data:text/javascript;base64,"+
  Buffer.from(read("web/vendor/three.module.js")).toString("base64"));
const ctx=createContext({console,Date,performance});
const seen=new Map();
const load=path=>{
  if(seen.has(path))return seen.get(path);
  const module=new SourceTextModule(readFileSync(path,"utf8"),{
    context:ctx,identifier:path
  });
  seen.set(path,module);
  return module;
};
const resolveDep=(specifier,parent)=>{
  assert.ok(specifier.startsWith("./"),"Unexpected remote map dependency "+specifier);
  return load(resolve(dirname(parent.identifier),specifier.split("?")[0]));
};
const module=load(resolve(web,"town.js"));
await module.link(resolveDep);
await module.evaluate();
const {buildTown,STREET_Y}=module.namespace;
assert.equal(STREET_Y,-3);
const scene=new THREE.Scene();
const originalRoom=new THREE.Group();
originalRoom.name="writer-interior-street-level";
scene.add(originalRoom);
const writerExterior=new THREE.Group();
writerExterior.name="writer-home-exterior-v2";
scene.add(writerExterior);
const canvasTex=(w,h,draw)=>{
  const g={direction:"rtl",fillStyle:""};
  for(const fn of ["fillRect","strokeRect","fillText","clearRect","measureText"])
    g[fn]=()=>fn==="measureText"?{width:100}:undefined;
  draw(g,w,h);
  return new THREE.Texture({width:w,height:h});
};
const clicks=[];
const town=buildTown({THREE,scene,canvasTex,clickable(m,panel,label){
  clicks.push(m);m.userData.panel=panel;m.userData.label=label;return m;
}});
assert.ok(town&&town.group instanceof THREE.Group,"Town entry point not built");
assert.equal(town.group.name,"town");
assert.equal(town.group.userData.cityBuild.urbanLayout,"clean-source-only-from-scratch");
assert.equal(town.group.userData.cityBuild.inferredLegacyBuildings,0);
assert.equal(town.group.userData.cityBuild.retainedLegacyCityMeshes,0);
assert.equal(town.group.userData.cityBuild.imaginaryMountainOrForestMeshes,0);
assert.equal(town.group.userData.cityBuild.realBuildingHeightsMeasured,false);
assert.equal(town.group.userData.cityBuild.authorRoomProtected,true);
assert.equal(town.group.children.length,5,"Exactly five licensed-map groups including two individually reconstructed building envelopes expected");
assert.deepEqual(town.group.children.map(c=>c.name),[
  "writer-block-source-aligned-streets",
  "writer-block-srtm30-topology",
  "writer-block-overture-building-reconstruction",
  "writer-block-building-01-georeferenced",
  "writer-block-building-02-georeferenced"
]);
assert.ok(scene.getObjectByName("writer-interior-street-level")===originalRoom,
  "Original author's room must survive rebuilt town");
assert.ok(scene.getObjectByName("writer-home-exterior-v2")===writerExterior,
  "Room access shell must remain owned outside the town");
assert.equal(originalRoom.parent,scene);
assert.equal(writerExterior.parent,scene);
assert.equal(town.districts,null);
assert.equal(town.growth,null);
assert.equal(town.trafficState().length,0,"No fictional cars in the clean map");
assert.doesNotThrow(()=>town.update(0,0,false,{cloudCover:70}));
assert.doesNotThrow(()=>town.update(1,20,true,{cloudCover:10}));
assert.equal(clicks.length,0,"No fake old-city clickable objects should survive");
for(const name of [
 "legacy-shopfront-interiors","city-road-union","city-districts",
 "civic-city-school","civic-police-station","civic-film-studio",
 "shared-forest-canopies","shared-residential-window-library",
 "writer-block-home-east-balcony-rail-v1"
])assert.equal(town.group.getObjectByName(name),undefined,
   "Old fictional city object reappeared: "+name);
const street=town.group.getObjectByName("writer-block-osm-4-street-pavement");
assert.ok(street?.isMesh);
assert.equal(street.userData.cityStreetEvidence.actualPavementWidthKnown,false);
const masses=town.group.getObjectByName("writer-block-overture-building-reconstruction");
assert.ok(masses);
assert.equal(masses.userData.citySurvey.originalRoofprints,4);
assert.equal(masses.userData.citySurvey.generatedVolumeCount,1);
assert.equal(masses.userData.citySurvey.independentlyModeledCount,2);
assert.equal(masses.userData.citySurvey.ignoredRoomCollisionCount,1);
const individuallyModeled=town.group.getObjectByName("writer-block-building-01-georeferenced");
assert.ok(individuallyModeled);
assert.equal(individuallyModeled.userData.cityBuildingEvidence.measuredHeightMeters,null);
assert.equal(individuallyModeled.userData.cityBuildingEvidence.physicalCollider,false);
const building02=town.group.getObjectByName("writer-block-building-02-georeferenced");
assert.ok(building02,"Second real source footprint must be an independent model");
assert.equal(building02.userData.cityBuildingEvidence.measuredFloors,null);
assert.equal(building02.userData.cityBuildingEvidence.verifiedShopUnits,null);
assert.equal(building02.userData.cityBuildingEvidence.guideRepresentsRealFloorCount,false);
assert.equal(building02.userData.cityBuildingEvidence.physicalCollider,false);
const terrain=town.group.getObjectByName("writer-block-srtm30-topology");
assert.ok(terrain);
assert.equal(terrain.getObjectByName("writer-block-srtm30-relief-inspection-only").visible,false);
const geometry=[];
town.group.traverse(o=>{if(o.isMesh||o.isLineSegments)geometry.push(o);});
assert.ok(geometry.length>=4 && geometry.length<17,
  "Build must be bounded by sourced geometry, not hundreds of old meshes");
for(const obj of geometry){
  const bb=new THREE.Box3().setFromObject(obj);
  assert.ok([...bb.min,...bb.max].every(Number.isFinite),obj.name+" NaN geometry");
}
assert.ok(read("web/world.js").includes("writerInteriorWorldRoot.add(baseWriterRoomShell);"));
assert.ok(read("web/world.js").includes("writerInteriorWorldRoot.add(expandedWriterRoomShell);"));
assert.ok(read("web/world.js").includes("const town = buildTown({ THREE, scene, clickable, canvasTex });"),
  "Normal world must load new source-only default without opting into legacy");
console.log("TEHRAN-SOURCE-ONLY-REBUILD-OK",JSON.stringify({
  name:town.group.name,sourceMapLayers:town.group.children.map(c=>c.name),
  visibleSourceObjects:geometry.length,realRoads:4,realMappedRoofprintCandidates:4,
  fictionalBuildings:0,fictionalStreets:0,fictionalCars:0,
  writerRoomPreserved:true,measuredBuildingHeights:0
}));
