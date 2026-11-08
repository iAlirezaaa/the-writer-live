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
const districts=await load(read("web/town-districts.js"));
const townSource=read("web/town.js").split("\n").filter(line=>!line.startsWith("import ")).join("\n").replace(/^export /gm,"");
const mockCars=()=>({
  trafficState(){return [];},update(){},setCrossingDemand(){}
});
const {buildTown,TOWN_BUILDINGS,STREET_Y}=
  new Function("buildCityDistricts","buildTownCars",townSource+
    ";return {buildTown,TOWN_BUILDINGS,STREET_Y};")(
      districts.buildCityDistricts,mockCars
    );
const plan=districts.auditCityPlan();
assert.equal(plan.blocks,12);
assert.equal(plan.venues,9);
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
const city=buildTown({THREE,scene,clickable,canvasTex:fakeCanvas});
scene.updateMatrixWorld(true);
assert.ok(scene.getObjectByName("town"));
const district=scene.getObjectByName("city-districts");
assert.ok(district,"Districts must actually be attached to the existing town");
assert.equal(city.districts.group,district);
assert.equal(city.districts.stats.blocks,12);
assert.equal(city.districts.stats.venues,9);
assert.ok(city.districts.stats.dynamicLights>=3);
const THREE_BOX=new THREE.Box3();
function bounds(object){object.updateWorldMatrix(true,true);return THREE_BOX.clone().setFromObject(object);}
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
assert.ok(publisherBox.max.y>15,"Publisher needs a genuinely tall tower");
const desk=publisher.getObjectByName("editorial-office-desk");
assert.ok(desk,"Editorial office must exist, not just a sign");
const deskPos=desk.getWorldPosition(new THREE.Vector3());
assert.ok(deskPos.y>7.0,"Editorial desk is not on an upper floor");
const bookstore=district.getObjectByName("bookstore-lofts");
assert.ok(bookstore&&bounds(bookstore).max.y>5.8);
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
assert.ok(world.includes('pos: [41, 53, 91]'),"City camera does not frame expanded layout");
assert.ok(world.includes('target: [-10, 9.6, 0]'),"Publisher camera misses the upper floor");
const stats={
  blocks:plan.blocks,styles:plan.styles,places:plan.venues,
  facadeInstances:instanceCount,publisherDeskWorldY:deskPos.y,
  cityLights:darkIntensity.length,intersections:plan.intersections.length
};
console.log("CITY-DISTRICTS-OK "+JSON.stringify(stats));
