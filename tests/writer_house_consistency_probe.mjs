/* Shared writer-home acceptance: pure spatial contract plus renderer wiring. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const read=p=>readFileSync(resolve(root,p),"utf8");
const plan=await import("data:text/javascript;base64,"+
  Buffer.from(read("web/urban-plan.js")).toString("base64"));
const home=plan.WRITER_HOME_BLUEPRINT;
assert.deepEqual(plan.writerHouseDimensions(0),[6,6],
  "Stage zero must match the author's actual furnished 6x6 room");
assert.equal(home.room.height,3.2);
assert.equal(home.facade.door.x,-1.2);
assert.equal(home.facade.door.width,.86);
assert.deepEqual(home.facade.rearWindow,{x0:-1.6,x1:.4,y0:1,y1:2.5});
const writer=plan.BUILDING_PARCELS.find(p=>p.id==="writer");
assert.equal(writer.buildingW,home.room.width);
assert.equal(writer.buildingD,home.room.depth);
for(let level=0;level<=4;level++){
 const [w,d]=plan.writerHouseDimensions(level);
 assert.ok(w<=writer.w-.6 && d<=writer.d-.6,"Home expansion exceeds writer parcel");
 assert.ok(w>=home.room.width && d>=home.room.depth,"Stage shrinks the home");
}
const world=read("web/world.js");
for(const contract of [
 "WRITER_HOME_BLUEPRINT", "const WIN = WRITER_HOME_BLUEPRINT.facade.rearWindow;",
 "baseWriterRoomShell", "expandedWriterRoomShell",
 "rebuildWriterExterior(level=0)","rebuildWriterInteriorShell(level=0)",
 "setWriterSceneMode","if(o.userData.writerExterior){setView(\"building\");return;}",
 "if(o.userData.returnToTown){setView(\"town\");return;}",
 "legacyWriterArchitecture.visible=false"
]){
 assert.ok(world.includes(contract),"Missing matched home contract: "+contract);
}
assert.ok(world.includes('let view = "town"'),"City should open on exteriors");
const district=read("web/town-districts.js");
for(const contract of ["publisher-street-door","bookstore-street-door",
 "B(pw,base-.12,pd,towerWall","B(5.75,bookstoreBase-.09,5.8,bookstoreWall"]){
 assert.ok(district.includes(contract),"Floating building has no ground floor: "+contract);
}
console.log("WRITER-HOME-CONSISTENCY-OK "+JSON.stringify({
 footprint:plan.writerHouseDimensions(0),height:home.room.height,
 stages:home.floorStages.length,
 rearWindow:home.facade.rearWindow,
 entry:home.facade.door.x,
 support:["publisher-tower","bookstore-lofts"]
}));
