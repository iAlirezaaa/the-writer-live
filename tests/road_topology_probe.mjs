/* Independent street topology gate: every road centerline must be paved and
 * one continuous asphalt region must be formed without overlapping patches.
 * Usage: node tests/road_topology_probe.mjs <site-root>
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const root=resolve(process.argv[2]||".");
const load=async path=>import("data:text/javascript;base64,"+
 Buffer.from(readFileSync(resolve(root,path),"utf8")).toString("base64"));
const urban=await load("web/urban-plan.js");
const road=await load("web/road-surface.js");
const union=road.calculateRoadUnion(urban.ROAD_SEGMENTS);
const cells=union.cells,eps=1e-7;
assert.equal(union.segments,urban.ROAD_SEGMENTS.length);
assert.ok(cells.length>0&&union.area>0,"Road network has no asphalt");
assert.ok(road.ROAD_PAINT_CENTER_OFFSET-.018/2>road.ROAD_SURFACE_OFFSET,
 "Road marking faces are buried under asphalt");

function covered(x,z) {
 return cells.some(([x0,x1,z0,z1])=>
   x>=x0-eps&&x<=x1+eps&&z>=z0-eps&&z<=z1+eps);
}
for(const s of urban.ROAD_SEGMENTS){
  const steps=Math.ceil((s.max-s.min)/.25);
  for(let i=0;i<=steps;i++){
    const along=s.min+(s.max-s.min)*i/steps;
    const x=s.axis==="x"?along:s.at,z=s.axis==="x"?s.at:along;
    assert.ok(covered(x,z),"Unpaved street centerline: "+s.id+" at "+along);
  }
}
// Adjacent rectangular cells must share a positive-length edge, not only a corner.
function adjacent(a,b){
 const xOverlap=Math.min(a[1],b[1])-Math.max(a[0],b[0]);
 const zOverlap=Math.min(a[3],b[3])-Math.max(a[2],b[2]);
 return (xOverlap>eps&&(Math.abs(a[3]-b[2])<eps||Math.abs(b[3]-a[2])<eps))
   ||(zOverlap>eps&&(Math.abs(a[1]-b[0])<eps||Math.abs(b[1]-a[0])<eps));
}
let examined=0;
const seen=new Set([0]),frontier=[0];
while(frontier.length){
 const i=frontier.pop();examined++;
 for(let j=0;j<cells.length;j++){
  if(!seen.has(j)&&adjacent(cells[i],cells[j])){seen.add(j);frontier.push(j);}
 }
}
assert.equal(seen.size,cells.length,
  "Road asphalt is split into disconnected islands");
for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++){
 const a=cells[i],b=cells[j];
 const ox=Math.min(a[1],b[1])-Math.max(a[0],b[0]);
 const oz=Math.min(a[3],b[3])-Math.max(a[2],b[2]);
 assert.ok(ox<=eps||oz<=eps,"Two city asphalt tiles overlap");
}
const declaredArea=urban.ROAD_SEGMENTS.reduce((sum,s)=>{
 const r=road.roadRect(s);return sum+(r.x1-r.x0)*(r.z1-r.z0);
},0);
assert.ok(union.area<=declaredArea+eps,"The road union exceeds declared parcels");
console.log("ROAD-TOPOLOGY-OK "+JSON.stringify({
 streets:union.segments,cells:cells.length,area:Math.round(union.area*10)/10,
 connectedCells:examined,paintAboveAsphalt:true
}));
