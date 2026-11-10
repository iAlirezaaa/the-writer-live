/* MAYOR-067: source-backed OSM footprint massing only, not surveyed 3D architecture.
 * A six-metre unknown-height volume is a marked proxy, not a floor count.
 */
import {OSM_QUERY,parseCivitaVectors,OSM_ATTRIBUTION} from './civita-osm-vectors.mjs';
const REQUEST_URL='https://overpass-api.de/api/interpreter?data='+encodeURIComponent(OSM_QUERY);
export async function attachCivitaVectors(THREE,scene,{onStatus=()=>{},signal}={}){
 const layer=new THREE.Group();layer.name='civita-sourced-osm-provisional-buildings';
 layer.userData={source:OSM_ATTRIBUTION,sourceURL:'https://overpass-api.de/',heightProxies:true,terrainMeshMeasured:false,buildingsRealHeightsCertified:false,collision:false,authorHouseGeolocated:false};
 scene.add(layer);
 const walls=new THREE.MeshStandardMaterial({color:0xb59a78,roughness:.98,transparent:true,opacity:.65,depthWrite:false});
 const measuredWalls=new THREE.MeshStandardMaterial({color:0xbda180,roughness:.96,transparent:true,opacity:.83,depthWrite:false});
 const tops=new THREE.MeshStandardMaterial({color:0xb46e4e,roughness:1,transparent:true,opacity:.75,depthWrite:false});
 const roadMat=new THREE.LineBasicMaterial({color:0x395b66,depthTest:false});
 let timeout;const abort=new AbortController();if(signal)signal.addEventListener('abort',()=>abort.abort(),{once:true});
 try{
  onStatus('دریافت یک مجموعهٔ محدود دادهٔ برداری OSM…');
  timeout=setTimeout(()=>abort.abort(),23000);
  // Prefer the bounded, once-per-Pages-build OSM API snapshot. This avoids a
  // per-visitor Overpass query; if the optional file is absent, fall back to
  // exactly ONE live request, with no synthetic street/building geometry.
  const base=(typeof import.meta.url==='string'&&import.meta.url)
    || (typeof document!=='undefined'?document.baseURI:'https://example.invalid/web/civita-osm-render.js');
  const snapshotUrl=new URL('./data/civita-osm-snapshot.json',base).href;
  let raw,sourceMode,acquiredAt=null,sourceUrl=REQUEST_URL;
  try{
    const response=await fetch(snapshotUrl,{headers:{Accept:'application/json'},signal:abort.signal,cache:'default'});
    if(!response.ok)throw new Error('OSM snapshot HTTP '+response.status);
    raw=await response.text();
    if(raw.length>3_000_000)throw new Error('OSM snapshot payload too large');
    const source=JSON.parse(raw);
    if(source?.source?.license!=='ODbL-1.0'||!source.source.url?.includes('openstreetmap.org/api/0.6/map'))
      throw new Error('OSM snapshot provenance missing');
    const parsed=parseCivitaVectors(source);
    if(parsed.buildings.length+parsed.paths.length<1)throw new Error('OSM snapshot has no valid ways');
    acquiredAt=source.source.acquired_at??null;
    sourceUrl=source.source.url;
    sourceMode='static-licensed-snapshot';
  }catch(error){
    onStatus('فایل منبع محلی موجود نیست؛ یک تلاش محدود برای دریافت زندهٔ OSM…');
    const response=await fetch(REQUEST_URL,{headers:{Accept:'application/json'},signal:abort.signal,cache:'default'});
    if(!response.ok)throw new Error('OSM live HTTP '+response.status);
    raw=await response.text();
    if(raw.length>3_000_000)throw new Error('OSM live payload too large');
    sourceMode='live-overpass-fallback';
  }
  const data=parseCivitaVectors(JSON.parse(raw));
  layer.userData.sourceMode=sourceMode;
  layer.userData.sourceURL=sourceUrl;
  layer.userData.acquiredAt=acquiredAt;
  for(const b of data.buildings){
   const origin=b.points[0],outline=b.points.slice(0,-1).map(p=>new THREE.Vector2(p.x-origin.x,origin.z-p.z));
   const shape=new THREE.Shape(outline);
   const geo=new THREE.ExtrudeGeometry(shape,{depth:b.displayHeight,bevelEnabled:false,steps:1,curveSegments:1});
   geo.rotateX(-Math.PI/2);
   const mesh=new THREE.Mesh(geo,[tops,b.displayHeightIsProxy?walls:measuredWalls]);
   mesh.name='OSM '+b.id+' (height '+(b.displayHeightIsProxy?'proxy':'OSM tag')+')';
   mesh.position.set(origin.x,.18,origin.z);
   mesh.userData={...b.provenance,heightProxy:b.displayHeightIsProxy,displayHeightM:b.displayHeight,architecturalDetailVerified:false,physicalCollider:false};
   mesh.receiveShadow=false;mesh.castShadow=false;layer.add(mesh);
  }
  for(const p of data.paths){
   const pts=p.points.map(q=>new THREE.Vector3(q.x,.3,q.z));
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),roadMat);
   line.name='OSM '+p.id+' footpath centreline';
   line.userData={...p.provenance,roadWidthM:null,walkabilityVerified:false};layer.add(line);
  }
  layer.userData.buildingFootprintCount=data.buildings.length;
  layer.userData.footpathWayCount=data.paths.length;
  layer.userData.rejectedSourceCount=data.rejected;
  onStatus(`${data.buildings.length} ردپای ساختمان و ${data.paths.length} مسیر پیاده با شناسهٔ OSM · ${sourceMode==='static-licensed-snapshot'?'نسخهٔ منبع‌دار سایت':'دریافت زنده'} · ارتفاع‌های نامعلوم پروکسی ۶ متری‌اند`);
  return {layer,...data};
 }catch(error){onStatus('دادهٔ برداری در دسترس نیست؛ نمایش ساختمان‌های ساختگی ممنوع است ('+String(error.message||error).slice(0,65)+')');return {layer,error:String(error.message||error)};}
 finally{clearTimeout(timeout);}
}
