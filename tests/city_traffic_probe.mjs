/* Public/CI crosswalk physics: real vendored Three.js, no DOM/network.
 * Usage: node tests/city_traffic_probe.mjs <site-root> <town-json>
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const root=resolve(process.argv[2]||".");
const snapshot=resolve(process.argv[3]||resolve(root,"snapshot/town.json"));
const load=(path)=>import("data:text/javascript;base64,"+
  Buffer.from(readFileSync(resolve(root,path))).toString("base64"));
globalThis.fetch=()=>{throw new Error("Network access forbidden in traffic probe");};
const THREE=await load("web/vendor/three.module.js");
const Citizens=await load("web/citizens.js");
const Motion=await load("web/citizen-motion-library.js");
const Fleet=await load("web/town-cars.js");
const payload=JSON.parse(readFileSync(snapshot,"utf8"));
const start="2026-11-08T00:01:00+03:30";

// Cars approaching a crossing must stop before their front bumpers reach it.
// Already committed cars clear the crossing rather than stopping inside.
const streets=new THREE.Group();
const cars=Fleet.buildTownCars({THREE,city:streets,streetY:-3});
assert.equal(cars.vehicles.length,12);
assert.equal(typeof cars.setCrossingDemand,"function");
assert.equal(typeof cars.trafficState,"function");
cars.update(1,0);
cars.setCrossingDemand(true);
for(let frame=1;frame<2000;frame++)cars.update(1,frame*.05);
for(const car of cars.trafficState().filter(x=>x.z>0)){
  assert.ok(Math.abs(car.x)>=car.halfLength+2.095,
    "Car failed to yield at x="+car.x+" lane="+car.lane);
}
const stopped=cars.vehicles.filter(x=>x.lane.z>0).map(x=>x.progress);
cars.setCrossingDemand(false);
for(let frame=2000;frame<2400;frame++)cars.update(1,frame*.05);
const moving=cars.vehicles.filter(x=>x.lane.z>0).map(x=>x.progress);
assert.ok(moving.some((p,i)=>Math.abs(p-stopped[i])>.5),
  "Vehicles must resume when crossing demand ends.");

// A resident requesting the road crossing should eventually get a turn.
// The collision monitor checks both vehicle positions and the final crossing.
const walkScene=new THREE.Scene();
const walkers=Citizens.createCitizens({
  THREE,scene:walkScene,clickable:[],motionArchive:Motion
});
const source=payload.citizens[0];
const row={...source,routine:[
  {start:0,place:"home-west",activity:"sleep"},
  {start:1,place:"garden",activity:"read"},
]};
walkers.setRoster({...payload,citizens:[row],clock:"2026-11-08T00:00:30+03:30"});
const street=new THREE.Group(),cityFleet=Fleet.buildTownCars({THREE,city:street,streetY:-3});
cityFleet.update(1,0);
const startMs=Date.parse(start);
let requestFrames=0,crossedFrames=0,waitFrames=0,minCarGap=Infinity;
for(let frame=1;frame<=2800;frame++){
  const t=frame*.05,now=new Date(startMs+t*1000);
  walkers.update(.05,t,now,cityFleet.trafficState());
  const demand=walkers.crossingDemand();
  cityFleet.setCrossingDemand(demand);
  cityFleet.update(1,t);
  if(demand)requestFrames++;
  const state=walkers.status()[0],p=state.position;
  if(state.waitingForCrossing)waitFrames++;
  if(Math.abs(p.x)<.1 && p.z>5.72 && p.z<11.28){
    crossedFrames++;
    for(const car of cityFleet.trafficState().filter(x=>x.z>0)){
      const gap=Math.abs(car.x)-car.halfLength;
      minCarGap=Math.min(minCarGap,gap);
      assert.ok(gap>1.85,
        "Vehicle/pedestrian crosswalk collision at frame "+frame+
        " car "+car.lane+" x="+car.x+" gap="+gap.toFixed(3));
    }
  }
}
const finished=walkers.status()[0];
assert.ok(requestFrames>30,"No crosswalk reservation/demand was produced");
assert.ok(crossedFrames>40,"Citizen never traversed crossing");
assert.equal(finished.place,"garden","Walk never reached destination");
assert.equal(finished.activity,"read","Walker did not resume authored activity");
assert.equal(finished.route.length,0,"Route was left incomplete");
assert.equal(walkers.crossingDemand(),false,"Crosswalk still reserved after arrival");

// Swept-capsule regression: a large legal step cannot pass THROUGH a standing
// resident even when the ending position would have cleared them.
const twoScene=new THREE.Scene();
const pair=Citizens.createCitizens({
  THREE,scene:twoScene,clickable:[],motionArchive:Motion
});
const pairRows=[
  {...payload.citizens[0],routine:[
    {start:0,place:"home-west",activity:"sleep"},
    {start:1,place:"garden",activity:"read"}]},
  {...payload.citizens[1],routine:[
    {start:0,place:"publisher",activity:"work"}]},
];
pair.setRoster({...payload,citizens:pairRows,clock:"2026-11-08T00:00:00+03:30"});
const movingBody=twoScene.getObjectByName(pairRows[0].id);
const blockingBody=twoScene.getObjectByName(pairRows[1].id);
movingBody.position.set(0,Citizens.FEET_Y,5.7);
blockingBody.position.set(0,Citizens.FEET_Y,6.80);
pair.update(1,1,new Date(start),[]);
const a=pair.status()[0].position,b=pair.status()[1].position;
const gap=Math.hypot(a.x-b.x,a.z-b.z);
assert.ok(gap>=.608,"Swept capsule penetrated stationary body: "+gap);
assert.ok(a.z>5.7&&a.z<6.4,"The moving body should advance only to the contact boundary");

console.log("CITY-TRAFFIC-OK "+JSON.stringify({
  stoppedCars:stopped.length,
  requestFrames,crossedFrames,waitFrames,
  minimumClearance:minCarGap,
  sweptPersonGap:gap
}));
