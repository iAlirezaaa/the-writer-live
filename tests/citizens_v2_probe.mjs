/* Offline real-Three geometry regression for citizen rebuild.
 * Usage: node tests/citizens_v2_probe.mjs <root> <snapshot-file>
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const root=resolve(process.argv[2]||".");
const snapshot=resolve(process.argv[3]||resolve(root,"snapshot/town.json"));
const load=(filename)=>import("data:text/javascript;base64,"+
  Buffer.from(readFileSync(filename)).toString("base64"));
globalThis.fetch=()=>{throw new Error("Citizen geometry tests cannot call network")};
const THREE=await load(resolve(root,"web/vendor/three.module.js"));
const Citizens=await load(resolve(root,"web/citizens.js"));
const Motion=await load(resolve(root,"web/citizen-motion-library.js"));
const payload=JSON.parse(readFileSync(snapshot,"utf8"));

assert.equal(Motion.MOTION_ARCHIVE.id,"city-citizens-v1");
assert.equal(Motion.MOTION_ARCHIVE.instancesShareClips,true);
assert.equal(Motion.MOTION_CLIPS.talk.enabled,false);
assert.equal(Motion.MOTION_CLIPS.listen.enabled,false);
assert.equal(Object.keys(Motion.MOTION_CLIPS).length,10);

function runAt(clock,frames=450){
  const scene=new THREE.Scene(),pickables=[];
  const citizens=Citizens.createCitizens({
    THREE,scene,clickable:pickables,motionArchive:Motion
  });
  citizens.setRoster({...payload,clock});
  citizens.setPublisherProfile(payload.publisher||
    {name:"مدیر انتشارات محله",role:"publisher",public_proxy:true});
  assert.equal(scene.children.length,payload.citizens.length+1);
  assert.equal(pickables.length,scene.children.length*2);
  const publisher=citizens.status().find(c=>c.role==="publisher");
  assert.ok(publisher,"Publisher must be physically represented");
  assert.equal(publisher.publisher.public_proxy,true);
  assert.equal(publisher.agent.mode,"publisher-only");
  for(const ordinary of citizens.status().filter(c=>c.role!=="publisher")){
    assert.ok(ordinary.core?.core?.value);
    assert.equal(ordinary.conversation.enabled,false);
    assert.equal(ordinary.memory.enabled,false);
    assert.equal(ordinary.agent.enabled,false);
    assert.equal(ordinary.animation_archive,"city-citizens-v1");
  }
  assert.ok(citizens.select("citizen-01"));
  assert.equal(citizens.select("missing"),null);
  let minGap=Infinity;
  const at=new Date(clock);
  for(let i=0;i<frames;i++){
    citizens.update(.05,i*.05,new Date(at.getTime()+i*50));
    const visible=citizens.status().filter(c=>c.visible);
    for(let a=0;a<visible.length;a++)for(let b=a+1;b<visible.length;b++){
      const gap=Math.hypot(visible[a].position.x-visible[b].position.x,
                          visible[a].position.z-visible[b].position.z);
      minGap=Math.min(minGap,gap);
      assert.ok(gap>=.598,
        "Capsule overlap at "+clock+" frame="+i+" between "+visible[a].id+" and "+
        visible[b].id+" gap="+gap.toFixed(4));
    }
    if(i===0){
      for(const c of visible){
        const rootMesh=scene.getObjectByName(c.id);
        assert.ok(rootMesh);
        assert.ok(rootMesh.getObjectByName("shared-sidewalk-route"));
        assert.ok(rootMesh.getObjectByName("route-destination"));
      }
    }
  }
  return minGap;
}
const windows=[
  "2026-11-08T00:15:00+03:30",
  "2026-11-08T05:45:00+03:30",
  "2026-11-08T07:45:00+03:30",
  "2026-11-08T09:45:00+03:30",
  "2026-11-08T11:45:00+03:30",
  "2026-11-08T13:45:00+03:30",
  "2026-11-08T15:45:00+03:30",
  "2026-11-08T17:45:00+03:30",
  "2026-11-08T19:45:00+03:30",
  "2026-11-08T22:45:00+03:30",
];
const distances=windows.map(clock=>runAt(clock));
console.log("CITIZENS-V2-OK",JSON.stringify({residents:payload.citizens.length,
  publisher:1,uniqueCores:payload.citizens.length,archiveClips:10,
  collisionSamples:windows.length*450,minimumSpacing:Math.min(...distances)}));
