/* MAYOR-072: OPTIONAL 3D terrain from source-derived open Mapzen Terrarium grid.
 * This is coarse visual EU-DEM/USGS relief, NOT Regione Lazio 5m DTM and not
 * a survey of Civita's friable cliff. Preserve exact OSM horizontal features.
 */
import {civitaToGeo} from './civita-geo.mjs';
export const CIVITA_TERRAIN_ATTRIBUTION='Mapzen Terrain Tiles / EU-DEM (Copernicus European Union), SRTM/USGS where applicable';
export const CIVITA_TERRAIN_CREDIT='https://github.com/tilezen/joerd/blob/master/docs/attribution.md';
const validatedGrids=new WeakSet();
function checked(grid){
 if(grid&&typeof grid==='object'&&validatedGrids.has(grid))return grid;
 if(grid?.source?.provider!=='Mapzen Terrain Tiles (AWS Open Data)'||
    grid?.source?.ground_contact_verified!==false||
    grid.columns!==97||grid.rows!==49||
    !Array.isArray(grid.relative_heights_m)||
    grid.relative_heights_m.length!==97*49||
    !Number.isFinite(grid.origin_elevation_m)||grid.origin_elevation_m<200||grid.origin_elevation_m>700)
  throw new TypeError('Missing, unverified or malformed Civita sourced height grid');
 const b=grid.bounds;
 if(!b||![b.west,b.east,b.north,b.south].every(Number.isFinite)||
   b.east<=b.west||b.north<=b.south||
   !grid.relative_heights_m.every(h=>typeof h==='number'&&Number.isFinite(h)&&Math.abs(h)<500))
  throw new TypeError('Invalid EU-DEM elevation grid bounds/data');
 validatedGrids.add(grid);
 return grid;
}
export function sampleCivitaTerrain(grid,latitude,longitude){
 checked(grid);
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return null;
 const b=grid.bounds;
 const x=(longitude-b.west)/(b.east-b.west)*(grid.columns-1);
 const y=(b.north-latitude)/(b.north-b.south)*(grid.rows-1);
 if(x<-.0002||x>grid.columns-1+.0002||y<-.0002||y>grid.rows-1+.0002)return null;
 const xx=Math.max(0,Math.min(grid.columns-1,x)),yy=Math.max(0,Math.min(grid.rows-1,y));
 const i=Math.min(grid.columns-2,Math.floor(xx)),j=Math.min(grid.rows-2,Math.floor(yy));
 const u=xx-i,v=yy-j,w=grid.columns,arr=grid.relative_heights_m;
 const a=arr[j*w+i],b0=arr[j*w+i+1],c=arr[(j+1)*w+i],d=arr[(j+1)*w+i+1];
 return (1-v)*((1-u)*a+u*b0)+v*((1-u)*c+u*d);
}
export function applyCivitaTerrainToMap(THREE,tiles,grid,{subdivisions=36}={}){
 checked(grid);
 if(!THREE?.PlaneGeometry||!Array.isArray(tiles)||tiles.length!==2||
     !Number.isInteger(subdivisions)||subdivisions<4||subdivisions>70)
  throw new TypeError('Terrain mesh needs two source tiles and bounded segments');
 const heightAtLocal=(x,z)=>{
  const ll=civitaToGeo(x,z);
  return sampleCivitaTerrain(grid,ll.latitude,ll.longitude);
 };
 // Validate ALL vertices before touching existing geometry. If any georeference
 // is incomplete, preserve the old flat scene for safe rollback.
 const pending=[];
 for(const tile of tiles){
  if(!tile?.geometry?.parameters||!tile?.position)throw new Error('Missing raster tile');
  const rect=tile.geometry.parameters;
  const geo=new THREE.PlaneGeometry(rect.width,rect.height,subdivisions,subdivisions);
  const attr=geo.attributes.position;
  for(let i=0;i<attr.count;i++){
   const wx=tile.position.x+attr.getX(i);
   const wz=tile.position.z-attr.getY(i); // plane rotated x = -90deg in world
   const h=heightAtLocal(wx,wz);
   if(!Number.isFinite(h)){geo.dispose();for(const v of pending)v.geometry.dispose();throw new Error('DEM does not cover basemap vertex');}
   attr.setZ(i,h);
  }
  attr.needsUpdate=true;geo.computeVertexNormals();
  pending.push({tile,geometry:geo});
 }
 for(const {tile,geometry} of pending){
  tile.geometry.dispose();tile.geometry=geometry;
  tile.userData.terrainSource='Mapzen Terrain Tiles / EU-DEM, source-approximate';
  tile.userData.verticalGroundContactVerified=false;
  tile.userData.terrainSurveyedAt5m=false;
 }
 return {heightAtLocal,source:grid.source,gridSize:[grid.columns,grid.rows],
  centerElevationM:grid.origin_elevation_m,
  minRelativeM:grid.min_relative_m,maxRelativeM:grid.max_relative_m,
  geometryCount:tiles.length,verifiedGroundContact:false};
}
export async function loadCivitaTerrain(THREE,tiles,{onStatus=()=>{}}={}){
 try{
  const url=new URL('./data/civita-terrain-grid.json',import.meta.url);
  const response=await fetch(url,{cache:'default'});
  if(!response.ok)throw new Error('Terrain source HTTP '+response.status);
  const raw=await response.text();
  if(raw.length>200_000)throw new Error('Terrain source too large');
  const grid=JSON.parse(raw);
  const relief=applyCivitaTerrainToMap(THREE,tiles,grid);
  onStatus('تضاریس سه‌بعدی از مدل ارتفاعی باز EU-DEM نمایش داده شد؛ دقت دره‌ها محدود است');
  return relief;
 }catch(error){
  onStatus('دادهٔ ارتفاعی معتبر موجود نیست؛ نمایش تخت امن باقی ماند: '+String(error.message).slice(0,80));
  return {error:String(error.message)};
 }
}
