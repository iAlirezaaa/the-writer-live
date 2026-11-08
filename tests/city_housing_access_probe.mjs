/* Geometry gate for the eastern 432-person planned housing zone.
 * Checks actual Three.js pedestrian aprons, not metadata proximity.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const load=path=>import("data:text/javascript;base64,"+
 Buffer.from(readFileSync(resolve(root,path),"utf8")).toString("base64"));
const THREE=await load("web/vendor/three.module.js");
const urban=await load("web/urban-plan.js");
const growth=await load("web/city-growth.js");
const road=urban.ROAD_SEGMENTS.find(r=>r.id==="east-housing-link");
assert.ok(road && road.axis==="x" && road.width>0,"Missing east housing road");
const scene=new THREE.Scene();
const wrapper=new THREE.Group();scene.add(wrapper);
const registered=[...growth.CITY_GROWTH_CIVIC.map(x=>({id:x.id})),
 {id:"eastern-neighborhood"},{id:"forest-gate"}];
const makeCanvas=(w,h,draw)=>{
 const ctx={fillRect(){},strokeRect(){},fillText(){}};
 draw(ctx,w,h);
 return new THREE.Texture();
};
const kit=growth.buildCityGrowth({
 THREE,group:wrapper,streetY:-3,clickable:(o)=>o,
 canvasTex:makeCanvas,places:registered
});
scene.updateMatrixWorld(true);
assert.equal(growth.CITY_HOUSING_CAPACITY,432);
assert.equal(kit.stats.homes,12);
assert.equal(growth.auditCityGrowth(urban.ROAD_SEGMENTS).ok,true);
const paths=[];
for(const home of growth.CITY_GROWTH_HOMES){
 const mesh=scene.getObjectByName("housing-walk-"+home.id);
 assert.ok(mesh && mesh.isMesh,"Missing paved path: "+home.id);
 const footprint=new THREE.Box3().setFromObject(mesh);
 const sx=footprint.max.x-footprint.min.x;
 assert.ok(sx>=1.5,"Pedestrian path too narrow: "+home.id);
 assert.ok(footprint.min.y>=-3.05 && footprint.max.y<=-2.7,
  "Floating or buried pavement: "+home.id);
 assert.ok(footprint.min.x<=home.x && footprint.max.x>=home.x);
 assert.ok(home.x>=road.min && home.x<=road.max,"Path outside the linked street");
 const roadEdge=home.z===-16?road.at+road.width/2:road.at-road.width/2;
 const doorFace=home.z+(home.z===-16?-home.d/2:home.d/2);
 const continuous=home.z===-16?
  footprint.min.z<=roadEdge+.001 && footprint.max.z>=doorFace-.001:
  footprint.max.z>=roadEdge-.001 && footprint.min.z<=doorFace+.001;
 assert.ok(continuous,"Paved path does not bridge door and asphalt: "+home.id+
  " bounds="+JSON.stringify({min:footprint.min.z,max:footprint.max.z,roadEdge,doorFace}));
 paths.push({id:home.id,width:sx,length:Math.round((footprint.max.z-footprint.min.z)*100)/100});
}
assert.equal(paths.length,12);
console.log("HOUSING-ACCESS-OK "+JSON.stringify({
 homes:paths.length,capacity:growth.CITY_HOUSING_CAPACITY,
 minWidth:Math.min(...paths.map(p=>p.width)),accessRoad:road.id
}));
