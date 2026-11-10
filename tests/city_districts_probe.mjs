/* Architecture acceptance gate: real vendored Three.js geometry, no browser.
 * Run: node tests/city_districts_probe.mjs <site-root>
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const read=path=>readFileSync(resolve(root,path),"utf8");
const load=text=>import("data:text/javascript;base64,"+Buffer.from(text).toString("base64"));
const THREE=await load(read("web/vendor/three.module.js"));
const urban=await load(read("web/urban-plan.js"));
const roads=await load(read("web/road-surface.js"));
const districtSource=read("web/town-districts.js").split("\n").filter(line=>!line.startsWith("import ")).join("\n").replace(/^export /gm,"");
const districts=new Function("auditUrbanPlan","ROAD_PAINT_CENTER_OFFSET",districtSource+";return {buildCityDistricts,auditCityPlan,CITY_BLOCKS,CITY_PLACE_CATALOG};")(urban.auditUrbanPlan,roads.ROAD_PAINT_CENTER_OFFSET);
const growthSource=read("web/city-growth.js").replace(/^export /gm,"");
const growth=new Function(growthSource+";return {buildCityGrowth,auditCityGrowth,CITY_HOUSING_CAPACITY};")();
const growthAudit=growth.auditCityGrowth(urban.ROAD_SEGMENTS);
assert.equal(growthAudit.ok,true,JSON.stringify(growthAudit));
assert.ok(growth.CITY_HOUSING_CAPACITY>=400);
const previewSource=read("web/writer-block-road-preview.js").split("\n").filter(line=>!line.startsWith("import ")).join("\n").replace(/^export /gm,"");
const preview=new Function("geoToCityLocal",previewSource+
  ";return {buildWriterBlockRoadPreview,writerBlockLocalRing,writerBlockContainsLocalPoint,writerBlockRingArea,WRITER_BLOCK_ROAD_EVIDENCE};")(urban.geoToCityLocal);
const terrainDataSource=read("web/writer-block-terrain-data.js").replace(/^export /gm,"");
const terrainData=new Function(terrainDataSource+";return WRITER_BLOCK_DEM_SOURCE;")();
const terrainSource=read("web/writer-block-terrain.js").replace(/^import [\s\S]*?;$/gm,"").replace(/^export /gm,"");
const terrain=new Function("writerBlockLocalRing","writerBlockContainsLocalPoint","WRITER_BLOCK_DEM_SOURCE",terrainSource+
  ";return {buildWriterBlockTerrain};")(preview.writerBlockLocalRing,preview.writerBlockContainsLocalPoint,terrainData);
const balconySource=read("web/writer-block-balcony.js").replace(/^export /gm,"");
const balcony=new Function(balconySource+";return {buildWriterBlockBalcony};")();
const buildingDataSource=read("web/writer-block-building-data.js").replace(/^export /gm,"");
const buildingData=new Function(buildingDataSource+";return WRITER_BLOCK_BUILDING_SOURCE;")();
const realBuildingSource=read("web/writer-block-buildings.js").split("\n").filter(line=>!line.startsWith("import ")).join("\n").replace(/^export /gm,"");
const realBuildings=new Function("WRITER_BLOCK_BUILDING_SOURCE","writerBlockContainsLocalPoint",realBuildingSource+
  ";return {buildWriterBlockBuildingMasses,validateWriterBuildingSurvey,touchesWriterRoom};")(buildingData,preview.writerBlockContainsLocalPoint);
const individualSource=read("web/writer-block-building-01.js").split("\n").filter(line=>!line.startsWith("import ")).join("\n").replace(/^export /gm,"");
const individual=new Function("WRITER_BLOCK_BUILDING_SOURCE","validateWriterBuildingSurvey","touchesWriterRoom","writerBlockContainsLocalPoint",individualSource+
  ";return {buildWriterBlockBuilding01};")(buildingData,realBuildings.validateWriterBuildingSurvey,realBuildings.touchesWriterRoom,preview.writerBlockContainsLocalPoint);
const streetFrameSource=read("web/writer-block-street-frame.js").replace(/^import [\s\S]*?;$/gm,"").replace(/^export /gm,"");
const streetFrame=new Function("writerBlockLocalRing","writerBlockRingArea","writerBlockContainsLocalPoint","WRITER_BLOCK_ROAD_EVIDENCE",streetFrameSource+
  ";return {buildWriterBlockStreetFrame};")(preview.writerBlockLocalRing,preview.writerBlockRingArea,preview.writerBlockContainsLocalPoint,preview.WRITER_BLOCK_ROAD_EVIDENCE);
const townSource=read("web/town.js").split("\n").filter(line=>!line.startsWith("import ")).join("\n").replace(/^export /gm,"");
const mockCars=()=>({
  trafficState(){return [];},update(){},setCrossingDemand(){}
});
const {buildTown,TOWN_BUILDINGS,STREET_Y}=
  new Function("buildCityDistricts","buildTownCars","ROAD_SEGMENTS","buildSeamlessRoadSurface","ROAD_PAINT_CENTER_OFFSET","buildCityGrowth","buildWriterBlockRoadPreview","buildWriterBlockTerrain","buildWriterBlockBalcony","buildWriterBlockBuildingMasses","buildWriterBlockStreetFrame","buildWriterBlockBuilding01",townSource+
    ";return {buildTown,TOWN_BUILDINGS,STREET_Y};")(
      districts.buildCityDistricts,mockCars,urban.ROAD_SEGMENTS,roads.buildSeamlessRoadSurface,roads.ROAD_PAINT_CENTER_OFFSET,growth.buildCityGrowth,preview.buildWriterBlockRoadPreview,terrain.buildWriterBlockTerrain,balcony.buildWriterBlockBalcony,realBuildings.buildWriterBlockBuildingMasses,streetFrame.buildWriterBlockStreetFrame,individual.buildWriterBlockBuilding01
    );
const plan=districts.auditCityPlan();
assert.equal(plan.blocks,12);
assert.equal(plan.venues,15);
assert.equal(plan.intersections.length,0);
assert.ok(plan.styles>=6);
assert.equal(plan.writerRoomUntouched,true);
const scene=new THREE.Scene(),clicked=[];
const clickable=(mesh,panel,label)=>{
  mesh.userData.panel=panel;mesh.userData.label=label;clicked.push(mesh);return mesh;
};
const fakeCanvas=(w,h,draw)=>{
  const g={direction:"rtl"};
  for(const name of ["fillRect","strokeRect","fillText"])g[name]=()=>{};
  draw(g,w,h);
  return new THREE.Texture({width:w,height:h});
};
const city=buildTown({THREE,scene,clickable,canvasTex:fakeCanvas,mapMode:"legacy"});
scene.updateMatrixWorld(true);
assert.ok(scene.getObjectByName("town"));
const osmPreview=scene.getObjectByName("writer-block-osm-centerline-preview");
assert.ok(osmPreview&&osmPreview.userData.cityMapEvidence.physicalCollider===false,
  "Sourced OSM ground trace must be visible without adding a physics obstacle");
const realTerrain=scene.getObjectByName("writer-block-srtm30-topology");
assert.ok(realTerrain&&realTerrain.userData.cityTerrainEvidence?.noPhysicalCollision,
  "Real DEM topography overlay must remain noncolliding");
assert.equal(scene.getObjectByName("writer-block-srtm30-relief-inspection-only")?.visible,false);
assert.equal(scene.getObjectByName("writer-block-srtm30-contours")?.visible,true);
const balconyRail=scene.getObjectByName("writer-block-home-east-balcony-rail-v1");
assert.ok(balconyRail&&balconyRail.userData.cityConstructionEvidence.physicalCollider===false,
  "Single supported east-home balcony must remain noncolliding");
assert.equal(balconyRail.userData.cityConstructionEvidence.surveyedTehranBuilding,false);
const mapBuildings=scene.getObjectByName("writer-block-overture-building-reconstruction");
assert.ok(mapBuildings,"Real geographic 2D building footprints must appear in scene");
assert.equal(mapBuildings.userData.citySurvey.originalRoofprints,4);
assert.equal(mapBuildings.userData.citySurvey.generatedVolumeCount,1);
assert.equal(mapBuildings.userData.citySurvey.independentlyModeledCount,2);
const singleBuilding=scene.getObjectByName("writer-block-building-01-georeferenced");
assert.ok(singleBuilding,"First individual roofprint model must exist in town");
assert.equal(singleBuilding.userData.cityBuildingEvidence.physicalCollider,false);
assert.equal(singleBuilding.userData.cityBuildingEvidence.measuredHeightMeters,null);
assert.equal(singleBuilding.children.length,2);
assert.equal(mapBuildings.userData.citySurvey.ignoredRoomCollisionCount,1);
assert.equal(mapBuildings.userData.citySurvey.protectedWriterRoom,true);
assert.equal(mapBuildings.userData.citySurvey.physicalCollider,false);
assert.equal(mapBuildings.children.length,2,"One volume mesh and one noncolliding footprint outline");
const streetFrameMesh=scene.getObjectByName("writer-block-osm-4-street-pavement");
assert.ok(streetFrameMesh&&streetFrameMesh.userData.cityStreetEvidence?.physicalCollider===false,
  "Four sourced streets need visible paved shapes without adding traffic colliders");
assert.equal(streetFrameMesh.userData.cityStreetEvidence.actualPavementWidthKnown,false,
  "Visual road widths must remain explicitly schematic");
const streetFrameGroup=scene.getObjectByName("writer-block-source-aligned-streets");
assert.ok(streetFrameGroup&&streetFrameGroup.children.length===5,"Four OSM street labels missing");
const roadUnion=scene.getObjectByName("city-road-union");
assert.ok(roadUnion&&roadUnion.isMesh,"The town lost its unified asphalt road surface");
assert.equal(roadUnion.userData.urbanSurface.segments,urban.ROAD_SEGMENTS.length,
  "Not all authored streets are part of the same road material/mesh");
const roadPositions=roadUnion.geometry.attributes.position;
assert.equal(roadPositions.count,roadUnion.userData.urbanSurface.pieces*6,
  "The city road is no longer the disjoint tessellation of road union");
for(let i=0;i<roadPositions.count;i++){
 assert.ok(Math.abs(roadPositions.getY(i)-(STREET_Y-.02))<1e-6,
  "The unified asphalt is at an inconsistent road elevation");
}
// Original town-center markings are not hidden under the asphalt union.
const mainPaint=city.group.children.filter(obj=>{
 if(!obj.isMesh||obj.geometry?.type!=="BoxGeometry")return false;
 const p=obj.geometry.parameters;
 return Math.abs(p.width-1.25)<.0001&&Math.abs(p.depth-.07)<.0001;
});
assert.ok(mainPaint.length>=20,"Original town street dashes disappeared");
for(const line of mainPaint){
 const bottom=line.position.y-line.geometry.parameters.height/2;
 assert.ok(bottom>STREET_Y+roads.ROAD_SURFACE_OFFSET,
  "Main street paint was buried under the unified asphalt");
}
const roadNormals=roadUnion.geometry.attributes.normal;
for(let i=0;i<roadNormals.count;i++)
 assert.ok(roadNormals.getY(i)>.99,
   "An asphalt face is not oriented skyward");

const district=scene.getObjectByName("city-districts");
assert.ok(district,"Districts must actually be attached to the existing town");
assert.equal(city.districts.group,district);
assert.equal(city.districts.stats.blocks,12);
assert.equal(city.districts.stats.venues,15);
assert.equal(city.growth.stats.capacity,432);
assert.ok(scene.getObjectByName("civic-city-school"));
assert.ok(scene.getObjectByName("civic-police-station"));
assert.ok(scene.getObjectByName("civic-screenplay-office"));
assert.ok(scene.getObjectByName("civic-film-studio"));
assert.ok(scene.getObjectByName("shared-forest-canopies")?.isInstancedMesh);
assert.ok(scene.getObjectByName("shared-residential-window-library")?.isInstancedMesh);
assert.ok(city.districts.stats.dynamicLights>=3);
const districtPaint=district.children.filter(obj=>obj.isMesh&&obj.geometry?.type==="BoxGeometry"&&
  obj.material?.color?.getHex()===0xdfd9c0 &&
  obj.geometry.parameters.width>=.07&&obj.geometry.parameters.width<=1.5);
assert.ok(districtPaint.length>=10,"District lane lines disappeared");
for(const line of districtPaint){
 if(line.geometry.parameters.height>.025)continue; // parking stalls are taller
 const bottom=line.position.y-line.geometry.parameters.height/2;
 assert.ok(bottom>STREET_Y+roads.ROAD_SURFACE_OFFSET,
   "District lane paint was buried under the continuous asphalt");
}

const THREE_BOX=new THREE.Box3();
function bounds(object){object.updateWorldMatrix(true,true);return THREE_BOX.clone().setFromObject(object);}
const surfaceAt=(x,z,minWidth,minDepth)=>{
 return district.children.some(obj=>{
   if(!obj.isMesh||obj.geometry?.type!=="BoxGeometry")return false;
   const box=bounds(obj),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
   return Math.abs(center.x-x)<.12&&Math.abs(center.z-z)<.12
     &&size.x>=minWidth&&size.z>=minDepth
     &&box.min.y>=STREET_Y-.20&&box.max.y<=STREET_Y+.3;
 });
};
const roadCells=roads.calculateRoadUnion(urban.ROAD_SEGMENTS).cells;
function isPavedByUnion(x,z){
 return roadCells.some(([x0,x1,z0,z1])=>
   x>=x0-1e-6 && x<=x1+1e-6 && z>=z0-1e-6 && z<=z1+1e-6);
}
for(const [x,z] of [[0,-24.5],[-29,-20],[29,-20],[0,-40],[0,-8.5],
  [-25,0],[25,0],[0,8.5]]){
 assert.ok(isPavedByUnion(x,z),"Street absent from the unified asphalt: "+x+","+z);
}
const fakeRoadPatches=district.children.filter(obj=>obj.isMesh&&
  obj.geometry?.type==="BoxGeometry"&&obj.material?.color?.getHex()===0x404b50&&
  (obj.geometry.parameters.width>30||obj.geometry.parameters.depth>30));
assert.equal(fakeRoadPatches.length,0,"Duplicate standalone asphalt street plates reintroduce patchwork");
for(const x of [-35,35]){
 assert.ok(surfaceAt(x,-32,4.7,7.9),"Missing shared parking asphalt at "+x);
}
for(const block of districts.CITY_BLOCKS){
 const z=block.z===-18?-13.02:-26.75;
 assert.ok(surfaceAt(block.x,z,1.30,1.05),
   "District entrance is missing a continuous paved walk: "+block.id);
}

let facades=0,instanceCount=0;
for(const b of districts.CITY_BLOCKS){
  const group=district.getObjectByName("building-"+b.id);
  assert.ok(group,"Missing designed block: "+b.id);
  const box=bounds(group);
  const width=box.max.x-box.min.x;
  const depth=box.max.z-box.min.z;
  assert.ok(width<=b.w+2 && width>=b.w-1,"Building width drift "+b.id);
  assert.ok(depth<=b.d+3 && depth>=b.d-1,"Building depth drift "+b.id);
  assert.ok(box.min.y>=STREET_Y-.2,"Building sinks under ground "+b.id);
  const models=[];
  group.traverse(obj=>{if(obj.isInstancedMesh&&obj.name==="facade-window-instances")models.push(obj);});
  assert.equal(models.length,1,"Each building must have one shared facade window batch");
  facades++;instanceCount+=models[0].count;
}
assert.equal(facades,12);
assert.ok(instanceCount>200,"Expected instanced multi-floor windows");
const publisher=district.getObjectByName("publisher-tower");
assert.ok(publisher);
const publisherBox=bounds(publisher);
function assertGrounded(name,group,doorName) {
 const solids=group.children.filter(mesh=>mesh.isMesh&&mesh.geometry?.type==="BoxGeometry")
   .map(bounds);
 const grounded=solids.some(box=>{
   const sz=box.getSize(new THREE.Vector3());
   return box.min.y<=STREET_Y+.2 && box.max.y>=STREET_Y+2.9
     && sz.x>5 && sz.z>5;
 });
 assert.ok(grounded,name+" has no physical street-level ground storey");
 const door=group.getObjectByName(doorName);
 assert.ok(door,name+" street entrance missing");
 const doorBounds=bounds(door);
 assert.ok(doorBounds.min.y<=STREET_Y+.15,name+" entrance floats above pavement");
}
assertGrounded("publisher",publisher,"publisher-street-door");
assert.ok(publisherBox.max.y>15,"Publisher needs a genuinely tall tower");
const desk=publisher.getObjectByName("editorial-office-desk");
assert.ok(desk,"Editorial office must exist, not just a sign");
const deskPos=desk.getWorldPosition(new THREE.Vector3());
assert.ok(deskPos.y>7.0,"Editorial desk is not on an upper floor");
const bookstore=district.getObjectByName("bookstore-lofts");
assert.ok(bookstore&&bounds(bookstore).max.y>5.8);
assertGrounded("bookstore",bookstore,"bookstore-street-door");
const westNeighbour=TOWN_BUILDINGS.find(b=>b.key==="home-west");
const eastNeighbour=TOWN_BUILDINGS.find(b=>b.key==="home-east");
assert.ok(publisherBox.min.x-(westNeighbour.x+westNeighbour.w/2)>=3,
  "Western homes intrude into publisher tower's minimum free setback");
assert.ok((eastNeighbour.x-eastNeighbour.w/2)-bounds(bookstore).max.x>=3,
  "Eastern homes intrude into bookstore's minimum free setback");
for(const name of ["art-gallery","central-square"]){
  assert.ok(district.getObjectByName(name),"Public scene missing: "+name);
}
for(const place of districts.CITY_PLACE_CATALOG){
  const picks=clicked.filter(mesh=>mesh.userData.placeId===place.id);
  assert.ok(picks.length>=1,"Place has no clickable access: "+place.id);
  for(const pick of picks){
    assert.ok(pick.userData.placeDetails===place,
      "Clickable metadata must point to canonical catalog entry");
    assert.equal(pick.userData.panel,place.id==="publishing-tower"?"p-publish":"p-town");
    assert.equal(pick.userData.view,place.id==="publishing-tower"?"publisher":"town");
  }
}
const oldBuildingKeys=TOWN_BUILDINGS.map(x=>x.key);
assert.deepEqual(oldBuildingKeys,["publisher","bookstore","home-west","home-east"],
  "Existing pedestrian home/shop anchors must remain unchanged");
const room=new THREE.Box3(new THREE.Vector3(-3.3,-.4,-3.3),
  new THREE.Vector3(3.3,9,3.3));
const forbidden=["publisher-tower","bookstore-lofts",...districts.CITY_BLOCKS.map(b=>"building-"+b.id),"art-gallery","central-square"];
for(const name of forbidden){
  const b=bounds(district.getObjectByName(name));
  assert.ok(!b.intersectsBox(room),"New architecture overlaps the writer's room: "+name);
}
city.update(0,1,false);
const darkIntensity=[];
district.traverse(node=>{if(node.isPointLight)darkIntensity.push(node.intensity);});
assert.ok(darkIntensity.some(i=>i>1),"District has no evening activity lighting");
const water=district.getObjectByName("central-square").getObjectByName("fountain-jet");
assert.ok(water,"Fountain water animation is missing");
const p=water.getWorldPosition(new THREE.Vector3()).clone();
city.update(1,15,false);
scene.updateMatrixWorld(true);
const daylight=[];
district.traverse(node=>{if(node.isPointLight)daylight.push(node.intensity);});
assert.ok(daylight.every(i=>i<=.00001),"Daylight should not waste dynamic urban point lights");
const q=water.getWorldPosition(new THREE.Vector3());
assert.ok(p.distanceTo(q)>1e-4,"Fountain movement is static");
const world=read("web/world.js");
const html=read(root.endsWith("_site")?"index.html":"web/index.html");
const objects=read("web/objects.js");
assert.ok(world.includes("CITY_PLACE_CATALOG"),"World does not expose the city explorer");
assert.ok(world.includes("renderCityPlaces()"),"City guide never gets rendered");
assert.ok(world.includes('import { buildTown, nightLighting, STREET_Y }'),"Canonical city elevation import is missing");
assert.ok(html.includes('id="town-places"'),"City locations cannot be discovered");
assert.ok(objects.includes("mesh.userData.placeDetails"),"3D venue click card is missing");
// MAYOR-059: the old imaginary-district camera must not force the REAL OSM
// city to stay outside the visible frustum. Verify geographic coverage instead.
const cityView=world.split("\n").find(line=>
  line.trimStart().startsWith("town:")&&line.includes("pos: [")&&line.includes("target: ["));
assert.ok(cityView,"Default town overview camera missing");
const parseCameraVector=(label)=>{
  const tail=cityView.split(label+"[")[1];
  return tail?tail.split("]")[0].split(",").map(Number):[];
};
const cameraPos=parseCameraVector("pos: "),targetPos=parseCameraVector("target: ");
assert.ok(cameraPos.length===3&&targetPos.length===3&&
  [...cameraPos,...targetPos].every(Number.isFinite)&&
  cameraPos[1]>80&&cameraPos[2]>130&&
  targetPos[0]>=-55&&targetPos[0]<=0&&targetPos[2]>=0&&targetPos[2]<=60,
  "City camera must show the sourced Tehran block instead of an obsolete city grid");
assert.ok(world.includes('target: [-10, 9.6, 0]'),"Publisher camera misses the upper floor");
const stats={
  blocks:plan.blocks,styles:plan.styles,places:plan.venues,housingCapacity:growth.CITY_HOUSING_CAPACITY,
  facadeInstances:instanceCount,publisherDeskWorldY:deskPos.y,
  cityLights:darkIntensity.length,intersections:plan.intersections.length
};
console.log("CITY-DISTRICTS-OK "+JSON.stringify(stats));
