/* MAYOR-071 — Civita bridge: OSM alignment + published ENEA structural section.
 * This is a SCHEMATIC pier/deck elevation until a surveyed Lazio DTM gives
 * ground contact, absolute datum and deck entrance elevation.
 * Source route: OSM way 59997267, Ponte Alberto Sordi e Federico Fellini.
 */
import {geoToCivita,SANTA_MARIA_GATE} from './civita-geo.mjs';
export const CIVITA_BRIDGE_STRUCTURE=Object.freeze({
 study:'https://doi.org/10.1007/s13349-022-00628-7',
 osm_way_id:59997267,span_count:14,pier_count:13,
 typical_width_m:2.50,first_city_span_width_m:4.00,
 slab_depth_m:.15,beam_depth_m:.65,beam_pitch_m:.90,
 columns_diameter_m:.50,city_slopes:[.20,0,.06],
 columns_first_9:4,columns_last_4:2,
 authentic_deck_profile:true,absolute_height_verified:false,
 pier_footing_elevation_verified:false,railing_height_verified:false
});
function xy(p){return geoToCivita(p.lat,p.lon);}
function length(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
function distanceToGate(p){
 const a=geoToCivita(SANTA_MARIA_GATE.latitude,SANTA_MARIA_GATE.longitude);
 return length(a,p);
}
export function selectCivitaBridgeAlignment(data){
 if(data?.source?.license!=='ODbL-1.0'||!String(data.source.url||'').includes('openstreetmap.org/api/0.6/map'))
  throw new Error('Bridge route source and ODbL license missing');
 const candidates=Array.isArray(data.ways)?data.ways:[];
 const way=candidates.find(w=>w.type==='way'&&w.id===CIVITA_BRIDGE_STRUCTURE.osm_way_id);
 if(!way||way.tags?.bridge!=='yes'||!['pedestrian','footway'].includes(way.tags?.highway)||
    !Array.isArray(way.geometry)||way.geometry.length<2||way.geometry.length>300)
  throw new Error('Verified Civita bridge way missing');
 const points=way.geometry.map(p=>{
  if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||
     p.lat<42.624||p.lat>42.628||p.lon<12.1083||p.lon>12.1136)
   throw new Error('Bridge coordinates outside sourced OSM corridor');
  return {...xy(p),lat:p.lat,lon:p.lon};
 });
 let total=0;
 const cumulative=[0];
 for(let i=1;i<points.length;i++){
  const d=length(points[i-1],points[i]);
  if(d<.01||d>90)throw new Error('Implausible OSM bridge segment');
  total+=d;cumulative.push(total);
 }
 if(total<200||total>300)throw new Error('Verified bridge route length outside expected range: '+total);
 const da=distanceToGate(points[0]),db=distanceToGate(points.at(-1));
 if(Math.min(da,db)>110||Math.max(da,db)<170)
  throw new Error('OSM bridge does not connect expected Civita approach');
 // The published bridge gradient starts on the CIVITA end. Reverse OSM
 // orientation only as needed, without moving sourced XY coordinates.
 if(da>db)points.reverse();
 const lengths=[0];
 for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+length(points[i-1],points[i]));
 return {
   points,lengths,totalLengthM:lengths.at(-1),
   sourceId:'way/'+way.id,sourceURL:'https://www.openstreetmap.org/way/'+way.id,
   acquiredAt:data.source.acquired_at??null,osmTimestamp:way.timestamp??null,
   attributes:way.tags,
   routeXYSource:'OSM mapped geometry',
   absoluteHeightVerified:false,groundElevationVerified:false
 };
}
export function resampleCivitaBridge(alignment,spanCount=14){
 if(!Number.isInteger(spanCount)||spanCount<1||spanCount>30)throw new RangeError('span count');
 const result=[],total=alignment.totalLengthM;
 if(!Number.isFinite(total)||total<=0)throw new TypeError('bad bridge length');
 for(let i=0;i<=spanCount;i++){
  const d=total*i/spanCount;
  let j=1;
  while(j<alignment.lengths.length-1&&alignment.lengths[j]<d)j++;
  const before=alignment.lengths[j-1],after=alignment.lengths[j];
  const t=(d-before)/(after-before),a=alignment.points[j-1],b=alignment.points[j];
  result.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,progress:i/spanCount});
 }
 return result;
}
export function civitaBridgeProfileY(progress,lengthM){
 const s=progress*14,span=lengthM/14;
 // Measured *gradients* from ENEA paper, but local starting elevation
 // remains arbitrary until Regione Lazio DTM/road endpoint survey is linked.
 return -(Math.min(5,s)*.20*span)+Math.max(0,s-9)*.06*span;
}
export function buildCivitaBridge(THREE,parent,payload){
 if(!THREE?.Group||!parent?.add||!THREE?.BoxGeometry)throw new TypeError('Requires existing Three.js scene');
 const source=selectCivitaBridgeAlignment(payload);
 const stations=resampleCivitaBridge(source,14);
 for(const station of stations)station.y=.30+civitaBridgeProfileY(station.progress,source.totalLengthM);
 const group=new THREE.Group();group.name='civita-sourced-concrete-pedestrian-viaduct';
 group.userData={
  reference:CIVITA_BRIDGE_STRUCTURE.study,sourceID:source.sourceId,
  sourceURL:source.sourceURL,osmMappedCenterline:true,spanCount:14,pierCount:13,
  geometryApproximation:'surveyed paper dimensions on OSM mapped route',
  sourceAcquiredAt:source.acquiredAt,sourceObservedAt:source.osmTimestamp,
  absoluteElevationVerified:false,footingGroundContactVerified:false,
  pierHeightsIllustrative:true,deckGradesReferenceOnly:true,
  physicalCollider:false,writerAppearanceChanged:false
 };
 const concrete=new THREE.MeshStandardMaterial({color:0xa6a8a5,roughness:.91,depthTest:false,depthWrite:false});
 const beamMaterial=new THREE.MeshStandardMaterial({color:0x777d7d,roughness:1,depthTest:false,depthWrite:false});
 const railing=new THREE.MeshStandardMaterial({color:0x847c6c,metalness:.23,roughness:.67,depthTest:false,depthWrite:false});
 const geometries=[];
 const add=(name,geometry,material)=>{
  const mesh=new THREE.Mesh(geometry,material);mesh.name=name;
  mesh.castShadow=false;mesh.receiveShadow=false;
  mesh.renderOrder=14;mesh.userData.physicalCollider=false;
  group.add(mesh);geometries.push(geometry);return mesh;
 };
 const up=new THREE.Vector3(0,0,1);
 const side=(a,b)=>{const delta=new THREE.Vector3(b.x-a.x,0,b.z-a.z).normalize();return new THREE.Vector3(-delta.z,0,delta.x);};
 const link=(name,a,b,w,h,material,offsetY=0,offsetSide=0)=>{
  const axis=side(a,b),centre=new THREE.Vector3((a.x+b.x)/2,(a.y+b.y)/2+offsetY,(a.z+b.z)/2);
  centre.addScaledVector(axis,offsetSide);
  const dir=new THREE.Vector3(b.x-a.x,b.y-a.y,b.z-a.z),len=dir.length();
  const mesh=add(name,new THREE.BoxGeometry(w,h,len),material);
  mesh.position.copy(centre);mesh.quaternion.setFromUnitVectors(up,dir.normalize());
  return mesh;
 };
 for(let i=0;i<14;i++){
  const a=stations[i],b=stations[i+1],width=i===0?4:2.5,half=width/2;
  link('viaduct-slab-span-'+(i+1),a,b,width,.15,concrete,-.075);
  const beams=i===0?5:3;
  for(let k=0;k<beams;k++){
   const sideOff=(k-(beams-1)/2)*.90;
   link('prestressed-girder-'+(i+1)+'-'+k,a,b,.30,.65,beamMaterial,-.475,sideOff);
  }
  // Rail silhouettes are temporary: the paper specifies the parapets'
  // inclusion in the reported width, NOT actual rail height or post rhythm.
  for(const sign of [-1,1]){
   link('illustrative-rail-'+(i+1)+'-'+sign,
     {...a,y:a.y+1.12},{...b,y:b.y+1.12},.075,.085,railing,0,sign*(half-.05));
   const steps=Math.max(2,Math.ceil(source.totalLengthM/14/3));
   for(let j=0;j<steps;j++){
    const t=j/steps;
    const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=a.y+(b.y-a.y)*t;
    const n=side(a,b);
    const p=add('illustrative-railing-post-'+i+'-'+j+'-'+sign,
     new THREE.BoxGeometry(.07,1.12,.07),railing);
    p.position.set(x+n.x*sign*(half-.05),y+.56,z+n.z*sign*(half-.05));
   }
  }
 }
 for(let i=1;i<=13;i++){
  const p=stations[i],a=stations[i-1],b=stations[Math.min(14,i+1)];
  const axis=side(a,b),tangent=new THREE.Vector3(b.x-a.x,0,b.z-a.z).normalize();
  const large=i<=9,colCount=large?4:2;
  // ENEA reports range 11-15m for piers 1-5 and shorter later piers;
  // per-pier heights and base rock elevations are UNKNOWN. Chosen height is
  // purely a visible model-study proxy, never ground-contact geometry.
  const proxyHeight=i<=5?(i===4?15:12):5.5;
  const cap=add('reinforced-concrete-pier-cap-'+i,
    new THREE.BoxGeometry(2.80,.65,large?3.25:1.0),concrete);
  cap.position.set(p.x,p.y-.82,p.z);
  cap.quaternion.setFromUnitVectors(up,tangent);
  for(let k=0;k<colCount;k++){
   const lateral=large?(k%2===0?-.55:.55):(k===0?-.56:.56);
   const along=large?(k<2?-.70:.70):0;
   const column=add('concrete-round-pier-'+i+'-column-'+(k+1),
     new THREE.CylinderGeometry(.25,.25,proxyHeight,10),concrete);
   column.position.set(
    p.x+axis.x*lateral+tangent.x*along,
    p.y-1.15-proxyHeight/2,
    p.z+axis.z*lateral+tangent.z*along
   );
   column.userData.heightProxyM=proxyHeight;
  }
 }
 parent.add(group);
 return {group,source,stations,materials:[concrete,beamMaterial,railing],geometries};
}
export async function attachCivitaBridge(THREE,parent,{onStatus=()=>{}}={}){
 const sourceURL=new URL('./data/civita-bridge-corridor.json',import.meta.url);
 try{
  const response=await fetch(sourceURL,{cache:'default'});
  if(!response.ok)throw new Error('OSM bridge snapshot HTTP '+response.status);
  const raw=await response.text();if(raw.length>900_000)throw new Error('Bridge source oversized');
  const built=buildCivitaBridge(THREE,parent,JSON.parse(raw));
  onStatus('پل Civita: ۱۴ دهانه و ۱۳ پایه بر مسیر OSM ثبت شد؛ ارتفاع پایه‌ها هنوز پروکسی است');
  return built;
 }catch(e){
  onStatus('پل Civita: دادهٔ منبع‌دار کافی نیست ('+String(e.message).slice(0,75)+')');
  return {error:String(e.message),group:null};
 }
}
