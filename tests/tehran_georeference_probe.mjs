import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const source=readFileSync(resolve(root,"web/urban-plan.js"),"utf8");
const plan=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
const {TEHRAN_GEO_ORIGIN:o,cityLocalToGeo:toGeo,geoToCityLocal:toLocal,auditUrbanPlan}=plan;
assert.equal(o.latitude,35.715361987616696);
assert.equal(o.longitude,51.3642455031707);
assert.equal(o.timezone,"Asia/Tehran");
assert.deepEqual(toGeo(0,0),{latitude:o.latitude,longitude:o.longitude});
for(const [x,z] of [[0,0],[100,0],[0,100],[-150,-150],[400,250]]){
  const pos=toLocal(...Object.values(toGeo(x,z)));
  assert.ok(Math.abs(pos.x-x)<.00001&&Math.abs(pos.z-z)<.00001,"Georeference roundtrip "+x+","+z);
}
assert.ok(toGeo(0,-100).latitude>o.latitude,"North must be -Z");
assert.ok(toGeo(100,0).longitude>o.longitude,"East must be +X");
assert.ok(auditUrbanPlan().ok,"Existing urban-plan audit must remain valid");
console.log("TEHRAN-GEOREFERENCE-OK");
