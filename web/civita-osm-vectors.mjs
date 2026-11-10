/* MAYOR-067 — reversible OpenStreetMap vector intake; no renderer or hidden network.
 * Source: OpenStreetMap contributors, https://www.openstreetmap.org/copyright (ODbL 1.0).
 * XY polygons are source geometry, NOT certified elevations, floors or architecture.
 */
import {geoToCivita} from './civita-geo.mjs';
export const CIVITA_VECTOR_BBOX=Object.freeze({south:42.62695,west:12.11225,north:42.62824,east:12.11540});
export const OSM_ATTRIBUTION='© OpenStreetMap contributors (ODbL 1.0)';
export const OSM_QUERY=`[out:json][timeout:20];(way["building"](${CIVITA_VECTOR_BBOX.south},${CIVITA_VECTOR_BBOX.west},${CIVITA_VECTOR_BBOX.north},${CIVITA_VECTOR_BBOX.east});way["highway"~"^(footway|pedestrian|path|steps)$"](${CIVITA_VECTOR_BBOX.south},${CIVITA_VECTOR_BBOX.west},${CIVITA_VECTOR_BBOX.north},${CIVITA_VECTOR_BBOX.east}););out meta geom;`;
const MAX_ELEMENTS=650,MAX_POINTS=160,MAX_BUILDINGS=260,MAX_PATHS=180;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function getPoints(geometry){
 if(!Array.isArray(geometry)||geometry.length<2||geometry.length>MAX_POINTS)return null;
 const points=[];
 for(const p of geometry){
  if(!p||!finite(p.lat)||!finite(p.lon)||Math.abs(p.lat)>90||Math.abs(p.lon)>180)return null;
  if(p.lat<CIVITA_VECTOR_BBOX.south-.002||p.lat>CIVITA_VECTOR_BBOX.north+.002||p.lon<CIVITA_VECTOR_BBOX.west-.002||p.lon>CIVITA_VECTOR_BBOX.east+.002)return null;
  points.push({latitude:p.lat,longitude:p.lon,...geoToCivita(p.lat,p.lon)});
 }
 return points;
}
const same=(a,b)=>Math.abs(a.latitude-b.latitude)<1e-8&&Math.abs(a.longitude-b.longitude)<1e-8;
const area=p=>Math.abs(p.reduce((sum,q,i)=>i<p.length-1?sum+q.x*p[i+1].z-p[i+1].x*q.z:sum,0))/2;
function validHeight(v){
 if(typeof v!=='string'&&!finite(v))return null;
 const t=String(v).trim();if(!/^\d+(?:\.\d+)?\s*(?:m)?$/.test(t))return null;
 const n=parseFloat(t);return n>=1.5&&n<=70?n:null;
}
function validLevels(v){const n=Number(v);return Number.isInteger(n)&&n>=1&&n<=20?n:null;}
function intersects(a,b,c,d){const cross=(p,q,r)=>(q.x-p.x)*(r.z-p.z)-(q.z-p.z)*(r.x-p.x);const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);return x*y<0&&z*w<0;}
function isSimpleRing(points){
 for(let i=0;i<points.length-1;i++)for(let j=i+1;j<points.length-1;j++){
  if(Math.abs(i-j)<=1||(i===0&&j===points.length-2))continue;
  if(intersects(points[i],points[i+1],points[j],points[j+1]))return false;
 }
 return true;
}
export function parseCivitaVectors(payload){
 if(!payload||!Array.isArray(payload.elements)||payload.elements.length>MAX_ELEMENTS)throw new TypeError('Invalid or oversized OSM response');
 const ids=new Set(),buildings=[],paths=[];let rejected=0;
 for(const way of payload.elements){
  if(way?.type!=='way'||!Number.isSafeInteger(way.id)||way.id<1)continue;
  const id=`way/${way.id}`;if(ids.has(id)){rejected++;continue;}ids.add(id);
  const tags=way.tags||{};
  const building=typeof tags.building==='string'&&tags.building!=='no';
  const path=['footway','pedestrian','path','steps'].includes(tags.highway);
  if(!building&&!path)continue;
  const points=getPoints(way.geometry);if(!points){rejected++;continue;}
  const provenance={source_type:'way',source_id:way.id,source_url:`https://www.openstreetmap.org/way/${way.id}`,license:'ODbL-1.0',attribution:OSM_ATTRIBUTION,observed_at:typeof way.timestamp==='string'?way.timestamp:null,coordinates_crs:'EPSG:4326',height_m:null,levels:null,roof_shape:null,entrance:null,ground_elevation_m:null,quality_tier:'T1-footprint-only'};
  if(building){
   if(buildings.length>=MAX_BUILDINGS||points.length<4||!same(points[0],points.at(-1))||area(points)<1||!isSimpleRing(points)){rejected++;continue;}
   provenance.height_m=validHeight(tags.height);provenance.levels=validLevels(tags['building:levels']);provenance.roof_shape=tags['roof:shape']||null;
   const displayHeight=provenance.height_m??6;
   buildings.push({id,points,displayHeight,displayHeightIsProxy:provenance.height_m===null,provenance});
  }else{
   if(paths.length>=MAX_PATHS){rejected++;continue;}
   paths.push({id,points,highway:tags.highway,provenance});
  }
 }
 return {buildings,paths,rejected,source:OSM_ATTRIBUTION,license:'ODbL-1.0',sourceMode:'live Overpass, unverified until browser request completes',bounds:CIVITA_VECTOR_BBOX};
}
