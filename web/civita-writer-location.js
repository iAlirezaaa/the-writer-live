/* MAYOR-075 — Author-house placement derived from official Civita Institute site
 * plan (building D) and a candidate actual OSM polygon, NOT invented coordinates.
 * Official plans: https://www.civitainstitute.org/files/1127.pdf and /1128.pdf.
 * The OSM way itself is NOT labelled 'Lo Studio'; this is a working crosswalk,
 * not independent cadastral confirmation. Full 1:1 architectural accuracy not claimed.
 */
import {geoToCivita,civitaToGeo} from './civita-geo.mjs';
export const CIVITA_LO_STUDIO_MATCH=Object.freeze({
 name:'Lo Studio',officialPlanKey:'D',
 officialSource:'https://www.civitainstitute.org/files/1128.pdf',
 overviewSource:'https://www.civitainstitute.org/files/1127.pdf',
 officialHouseSource:'https://www.civitainstitute.org/496/lo-studio.html',
 osmWayId:464102189,neighborsForTopology:[464102203,464102204,464102185],
 association:'site-plan-correlated candidate — OSM does not name building',
 cadastralMatchVerified:false,measuredExteriorVerified:false,
 originalWriterAppearancePreserved:true
});
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function areaCentroid(points){
 let a=0,cx=0,cz=0;
 for(let i=0;i<points.length-1;i++){
  const p=points[i],q=points[i+1],d=p.x*q.z-q.x*p.z;
  a+=d;cx+=(p.x+q.x)*d;cz+=(p.z+q.z)*d;
 }
 a/=2;
 if(Math.abs(a)<1)throw new Error('Invalid Lo Studio candidate footprint area');
 return {areaM2:Math.abs(a),x:cx/(6*a),z:cz/(6*a)};
}
function inside(point,poly){
 let flag=false;
 for(let i=0,j=poly.length-2;i<poly.length-1;j=i++){
  const a=poly[i],b=poly[j];
  if(((a.z>point.z)!==(b.z>point.z))&&
     point.x<(b.x-a.x)*(point.z-a.z)/(b.z-a.z)+a.x)flag=!flag;
 }
 return flag;
}
function fits(x,z,yaw,ring,width=6.55,depth=6.65){
 const c=Math.cos(yaw),s=Math.sin(yaw);
 // Check the complete four sides, not just corners. A concave original OSM
 // footprint must not swallow an overlapping rectangular author room.
 for(const sign of [-1,1]){
  for(let i=0;i<=16;i++){
   const t=i/16;
   const points=[
    [sign*width/2,(t*2-1)*depth/2],
    [(t*2-1)*width/2,sign*depth/2]
   ];
   for(const [xx,zz] of points){
    const world={x:x+xx*c+zz*s,z:z-xx*s+zz*c};
    if(!inside(world,ring))return false;
   }
  }
 }
 return true;
}
function centerOf(way){
 const arr=way.geometry?.slice(0,-1);
 if(!arr?.length)return null;
 const sum=arr.reduce((acc,p)=>({lat:acc.lat+p.lat,lon:acc.lon+p.lon}),{lat:0,lon:0});
 return {lat:sum.lat/arr.length,lon:sum.lon/arr.length};
}
export function locateCivitaWriterParcel(snapshot){
 if(snapshot?.source?.license!=='ODbL-1.0'||
    !snapshot.source.url?.startsWith('https://api.openstreetmap.org/api/0.6/map?')||
    !Array.isArray(snapshot.elements)||snapshot.elements.length>650)
  throw new Error('Missing licensed and bounded OSM building data');
 const main=snapshot.elements.filter(e=>e?.type==='way'&&e.id===CIVITA_LO_STUDIO_MATCH.osmWayId);
 if(main.length!==1||main[0].tags?.building==='no'||!main[0].tags?.building||
    !Array.isArray(main[0].geometry)||main[0].geometry.length!==10)
  throw new Error('Official-plan candidate parcel OSM identity was not found or has changed');
 const poly=main[0].geometry.map(p=>{
  if(!finite(p.lat)||!finite(p.lon)||p.lat<42.6279||p.lat>42.62820||
      p.lon<12.1144||p.lon>12.11505)throw new Error('OSM parcel escaped Institute block');
  return {...geoToCivita(p.lat,p.lon),latitude:p.lat,longitude:p.lon};
 });
 if(Math.hypot(poly[0].x-poly.at(-1).x,poly[0].z-poly.at(-1).z)>.01)
  throw new Error('Unclosed OSM Lo Studio candidate boundary');
 const center=areaCentroid(poly);
 if(center.areaM2<75||center.areaM2>95||
    center.x<75||center.x>95||center.z> -30||center.z< -52)
  throw new Error('Institute site-plan candidate shape no longer matches');
 // Correlated map topology. These are nearby *source IDs*, NOT claimed
 // formal names for Il Nuovo, Ruderino or Sala Grande.
 const neighborCoords=[];
 for(const id of CIVITA_LO_STUDIO_MATCH.neighborsForTopology){
  const w=snapshot.elements.find(e=>e?.type==='way'&&e.id===id&&e.tags?.building);
  const v=w&&centerOf(w);if(!v)throw new Error('Institute block neighbor missing: '+id);
  const pt=geoToCivita(v.lat,v.lon);
  if(Math.hypot(pt.x-center.x,pt.z-center.z)>35)
   throw new Error('Institute neighbor is too far from candidate parcel');
  neighborCoords.push({id,x:pt.x,z:pt.z});
 }
 const [nw0,nw1,east]=neighborCoords;
 if(!(nw0.x<center.x&&nw1.x<center.x&&east.x>center.x))
  throw new Error('Institute plan topology is inconsistent with proposed parcel');
 // Source polygon's longest facade edge is a NE/SW axis; the entrance study
 // faces the eastern Via Provvidenza side, but the actual door is NOT surveyed.
 const axis={x:poly[5].x-poly[3].x,z:poly[5].z-poly[3].z};
 const yaw=Math.atan2(-axis.z,axis.x);
 if(yaw<1.6||yaw>2.3)throw new Error('OSM parcel facade orientation drift');
 let best=null;
 for(let i=-12;i<=12;i++)for(let j=-12;j<=12;j++){
  const dx=i*.25,dz=j*.25,x=center.x+dx,z=center.z+dz;
  if(!fits(x,z,yaw,poly))continue;
  const score=dx*dx+dz*dz;
  if(!best||score<best.score)best={score,x,z,offsetM:[dx,dz]};
 }
 if(!best)throw new Error('Preserved 6x6m writer room cannot safely fit candidate outline');
 const geo=civitaToGeo(best.x,best.z);
 return Object.freeze({
  ...CIVITA_LO_STUDIO_MATCH,
  x:best.x,z:best.z,latitude:geo.latitude,longitude:geo.longitude,
  yawRadians:yaw,footprintAreaM2:center.areaM2,
  sourceWay:'way/'+main[0].id,osmTimestamp:main[0].timestamp??null,
  snapshotAcquiredAt:snapshot.source.acquired_at??null,
  roomFitCheckedM:[6.55,6.65],footprintInteriorClear:true,
  groundElevationM:null,absoluteGroundVerified:false,
  uncertainty:'candidate site-plan/OSM crosswalk; verify cadastral parcel and doorway before 1:1 claim'
 });
}
export async function loadCivitaWriterParcel(){
 const src=new URL('./data/civita-osm-snapshot.json',import.meta.url);
 const dem=new URL('./data/civita-terrain-grid.json',import.meta.url);
 const [a,b]=await Promise.all([fetch(src,{cache:'default'}),fetch(dem,{cache:'default'})]);
 if(!a.ok||!b.ok)throw new Error('Writer parcel requires source OSM geometry and DEM');
 const [raw,terrain]=await Promise.all([a.json(),b.json()]);
 const result=locateCivitaWriterParcel(raw);
 if(terrain?.source?.provider!=='Mapzen Terrain Tiles (AWS Open Data)'||
    terrain.source?.ground_contact_verified!==false)throw new Error('Missing provenance for relative ground level');
 const {sampleCivitaTerrain}=await import('./civita-terrain.js');
 const ground=sampleCivitaTerrain(terrain,result.latitude,result.longitude);
 if(!finite(ground)||Math.abs(ground)>150)
  throw new Error('Writer parcel has no valid source-relative ground height');
 return Object.freeze({...result,groundRelativeM:ground,groundSource:'Mapzen / EU-DEM model (not cadastral surveyed)'});
}
