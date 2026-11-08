/* City Layout V2 — deterministic planning contracts, independent of Three.js.
 * Keep actual circulation and building footprints separate from decoration.
 */
export const CITY_LAYOUT_VERSION="urban-plan-20261108-v2";
export const ROAD_SEGMENTS=Object.freeze([
 {id:"east-west-north",axis:"x",at:-8.5,min:-31.2,max:31.2,width:4},
 {id:"east-west-south",axis:"x",at:8.5,min:-27,max:27,width:4},
 {id:"residential-west",axis:"z",at:-25,min:-10.5,max:10.5,width:4},
 {id:"residential-east",axis:"z",at:25,min:-10.5,max:10.5,width:4},
 {id:"outer-west",axis:"z",at:-29,min:-42,max:1.5,width:4.3},
 {id:"outer-east",axis:"z",at:29,min:-42,max:1.5,width:4.3},
 {id:"central-south",axis:"x",at:-23,min:-31.2,max:31.2,width:4.15},
 {id:"outer-south",axis:"x",at:-40,min:-31.2,max:31.2,width:4.4}
]);
export const BUILDING_PARCELS=Object.freeze([
 {id:"writer",x:0,z:0,w:8,d:9,buildingW:4.8,buildingD:4.8,entry:{x:0,z:3},parking:0,green:true},
 {id:"publisher",x:-10,z:0,w:7.5,d:8,buildingW:6,buildingD:6,entry:{x:-10,z:3.3},parking:1,green:true},
 {id:"bookstore",x:10,z:0,w:7.5,d:8,buildingW:6,buildingD:6,entry:{x:10,z:3.3},parking:1,green:true},
 {id:"home-west",x:-19,z:0,w:7,d:8,buildingW:6,buildingD:5,entry:{x:-19,z:2.7},parking:1,green:true},
 {id:"home-east",x:19,z:0,w:7,d:8,buildingW:6,buildingD:5,entry:{x:19,z:2.7},parking:1,green:true},
 ...[-20,-12,-4,4,12,20].flatMap((x,i)=>[-18,-28].map((z,j)=>({
  id:"district-"+i+"-"+j,x,z,w:7.5,d:8,buildingW:5.7,buildingD:5.8,
  entry:{x,z:z+(j===0?3.2:3.2)},parking:0,green:true
 })))
]);
const near=(a,b,t=.08)=>Math.abs(a-b)<=t;
function overlap(a,b,clearance=0){
 return Math.min(a.x+a.buildingW/2,b.x+b.buildingW/2)-Math.max(a.x-a.buildingW/2,b.x-b.buildingW/2)>-clearance &&
 Math.min(a.z+a.buildingD/2,b.z+b.buildingD/2)-Math.max(a.z-a.buildingD/2,b.z-b.buildingD/2)>-clearance;
}
function intersect(a,b){
 if(a.axis===b.axis){
  if(!near(a.at,b.at,(a.width+b.width)/2))return false;
  return Math.max(a.min,b.min)<=Math.min(a.max,b.max);
 }
 const h=a.axis==="x"?a:b, v=a.axis==="z"?a:b;
 return v.at>=h.min-h.width/2 && v.at<=h.max+h.width/2 &&
 h.at>=v.min-v.width/2 && h.at<=v.max+v.width/2;
}
export function auditUrbanPlan(){
 const collisions=[],setbacks=[],roadDisconnections=[],unreachable=[];
 for(let i=0;i<BUILDING_PARCELS.length;i++){
  const a=BUILDING_PARCELS[i];
  if(a.buildingW>a.w-.6||a.buildingD>a.d-.6)setbacks.push(a.id);
  for(let j=i+1;j<BUILDING_PARCELS.length;j++)if(overlap(a,BUILDING_PARCELS[j],.35))collisions.push([a.id,BUILDING_PARCELS[j].id]);
 }
 const visited=new Set([ROAD_SEGMENTS[0].id]),queue=[ROAD_SEGMENTS[0]];
 while(queue.length){const r=queue.shift();for(const n of ROAD_SEGMENTS){if(!visited.has(n.id)&&intersect(r,n)){visited.add(n.id);queue.push(n);}}}
 for(const r of ROAD_SEGMENTS)if(!visited.has(r.id))roadDisconnections.push(r.id);
 for(const p of BUILDING_PARCELS){
  const reach=ROAD_SEGMENTS.some(r=>{
   const ex=p.entry.x,ez=p.entry.z;
   return r.axis==="x"?Math.abs(ez-r.at)<=7&&ex>=r.min-1&&ex<=r.max+1:
    Math.abs(ex-r.at)<=7&&ez>=r.min-1&&ez<=r.max+1;
  });
  if(!reach)unreachable.push(p.id);
 }
 return {ok:!collisions.length&&!setbacks.length&&!roadDisconnections.length&&!unreachable.length,
  collisions,setbacks,roadDisconnections,unreachable,parcels:BUILDING_PARCELS.length,roads:ROAD_SEGMENTS.length};
}
export function writerHouseLevel(accepted=0){
 const n=Math.max(0,Number(accepted)||0);
 return n>=40?4:n>=20?3:n>=10?2:n>=4?1:0;
}
export function writerHouseDimensions(level=0){
 const sizes=[[4.8,4.8],[5.4,5.1],[5.9,5.5],[6.5,5.9],[7,6.2]];
 return sizes[Math.max(0,Math.min(4,Math.floor(level)))]||sizes[0];
}
