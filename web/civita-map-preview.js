/* Civita di Bagnoregio map, Phase 0: geo-registered OSM raster UNDERLAY in Three.js.
 * Not a geometric reconstruction; no invented buildings, floors, cliff heights or routes.
 * OSM tile policy: only two initial view tiles, no bulk prefetch/offline/caching overrides.
 */
import * as THREE from 'three';
import {attachCivitaVectors} from './civita-osm-render.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CIVITA_ORIGIN,SANTA_MARIA_GATE,MAP_ZOOM,MAP_TILES,mapTileRect,geoToCivita,clampCivitaTarget} from './civita-geo.mjs';
const canvas=document.getElementById('civita-canvas');
const status=document.getElementById('map-status');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xb2b8ad);
// Neutral preview lighting; geo altitude, material roughness and facade shapes
// are still unverified. Lighting changes no physical map/house state.
scene.add(new THREE.AmbientLight(0xf4eddf,1.35));
const mapSun=new THREE.DirectionalLight(0xffe3bb,1.85);
mapSun.position.set(-80,120,45);scene.add(mapSun);
const camera=new THREE.PerspectiveCamera(38,1,0.5,600);
camera.position.set(-80,105,130);
const controls=new OrbitControls(camera,canvas);
controls.target.set(-35,0,0);
controls.enableDamping=true;
controls.screenSpacePanning=false;
controls.minDistance=28;
controls.maxDistance=118;
controls.minPolarAngle=0.2;
controls.maxPolarAngle=1.04;
controls.enablePan=true;
const mapGroup=new THREE.Group();mapGroup.name='civita-osm-basemap-phase0';scene.add(mapGroup);
mapGroup.userData={origin:CIVITA_ORIGIN,source:'OpenStreetMap standard raster tiles',license:'ODbL; OSMF tile usage policy',geometryConfidence:'2D raster reference only',terrainElevationsMeasured:false,buildingCountModeled:0};
const loader=new THREE.TextureLoader();loader.setCrossOrigin('anonymous');
let loaded=0,failed=0,vectorStatus='برداشت برداری هنوز بارگذاری نشده';
function showStatus(){status.textContent=`نقشهٔ Civita · ${loaded} کاشی بارگذاری‌شده${failed?' · '+failed+' کاشی ناموفق':''} · ${vectorStatus}`;}
for(const [tx,ty] of MAP_TILES){
 const rect=mapTileRect(tx,ty);
 const material=new THREE.MeshBasicMaterial({color:0xd8d2bc,side:THREE.DoubleSide});
 const tile=new THREE.Mesh(new THREE.PlaneGeometry(rect.width,rect.depth),material);
 tile.name=`osm-${MAP_ZOOM}-${tx}-${ty}`;
 tile.rotation.x=-Math.PI/2;tile.position.set(rect.x,-.06,rect.z);
 tile.userData={provider:'OpenStreetMap',z:MAP_ZOOM,x:tx,y:ty,verifiedBuildings:false};
 mapGroup.add(tile);
 // Browser cache / referrer use default OSMF-compliant behavior.
 loader.load(`https://tile.openstreetmap.org/${MAP_ZOOM}/${tx}/${ty}.png`,tex=>{
   tex.colorSpace=THREE.SRGBColorSpace;
   material.map=tex;material.needsUpdate=true;loaded++;showStatus();
 },undefined,()=>{failed++;showStatus();});
}
function marker(name,loc,color){
 const p=geoToCivita(loc.latitude,loc.longitude);
 const g=new THREE.Group();g.name=name;g.position.set(p.x,.12,p.z);
 const ring=new THREE.Mesh(new THREE.RingGeometry(2.1,2.7,24),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,depthTest:false}));
 ring.rotation.x=-Math.PI/2;ring.position.y=.04;g.add(ring);
 const pin=new THREE.Mesh(new THREE.SphereGeometry(1.1,10,7),new THREE.MeshBasicMaterial({color,depthTest:false}));pin.position.y=1.6;g.add(pin);
 mapGroup.add(g);
 return p;
}
marker('OSM village center — not a building location',CIVITA_ORIGIN,0x25628e);
marker('Porta di Santa Maria, OSM node 1079071522',SANTA_MARIA_GATE,0xa14e28);
// Camera clamp never changes or removes the separate writer scene in the main project.
function clampOrbitTarget(){
  const wanted=clampCivitaTarget(controls.target.x,controls.target.z);
  const dx=wanted.x-controls.target.x,dz=wanted.z-controls.target.z;
  if(dx||dz){controls.target.x=wanted.x;controls.target.z=wanted.z;camera.position.x+=dx;camera.position.z+=dz;}
}
function resize(){const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize,{passive:true});
resize();showStatus();
let last=0;
function animate(t){requestAnimationFrame(animate);if(t-last<16)return;last=t;controls.update();clampOrbitTarget();renderer.render(scene,camera);}
requestAnimationFrame(animate);

// This model layer belongs ONLY to the isolated city preview, not the protected author room.
attachCivitaVectors(THREE,scene,{onStatus:message=>{vectorStatus=message;showStatus();}});
