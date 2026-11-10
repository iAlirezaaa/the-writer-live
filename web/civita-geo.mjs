/* CIVITA-001: WGS84 -> local tangent metres; X east, Z south. Preview only.
 * Origin: OpenStreetMap place node 1778014513 (reported via Mapcarta).
 * The local plane is not a DEM, surveyed terrain, or building footprint.
 */
export const CIVITA_ORIGIN = Object.freeze({ latitude:42.6277, longitude:12.1137, timezone:'Europe/Rome', source:'OpenStreetMap node 1778014513', datum:'EPSG:4326' });
export const SANTA_MARIA_GATE = Object.freeze({latitude:42.62741, longitude:12.11272, source:'OpenStreetMap node 1079071522'});
export const MAP_ZOOM=16;
export const MAP_TILES=Object.freeze([[34972,24173],[34973,24173]]);
const RAD=Math.PI/180;
const LAT_METERS=111132.92-559.82*Math.cos(2*CIVITA_ORIGIN.latitude*RAD)+1.175*Math.cos(4*CIVITA_ORIGIN.latitude*RAD);
const LON_METERS=111412.84*Math.cos(CIVITA_ORIGIN.latitude*RAD)-93.5*Math.cos(3*CIVITA_ORIGIN.latitude*RAD);
export function geoToCivita(latitude,longitude){
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)throw new TypeError('Invalid WGS84 coordinates');
  return {x:(longitude-CIVITA_ORIGIN.longitude)*LON_METERS,z:(CIVITA_ORIGIN.latitude-latitude)*LAT_METERS};
}
export function civitaToGeo(x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z))throw new TypeError('Invalid local coordinates');
  return {latitude:CIVITA_ORIGIN.latitude-z/LAT_METERS,longitude:CIVITA_ORIGIN.longitude+x/LON_METERS};
}
export function tileLon(x,zoom=MAP_ZOOM){return x/2**zoom*360-180;}
export function tileLat(y,zoom=MAP_ZOOM){return Math.atan(Math.sinh(Math.PI*(1-2*y/2**zoom)))/RAD;}
export function mapTileRect(x,y,zoom=MAP_ZOOM){
  if(!Number.isInteger(x)||!Number.isInteger(y)||!Number.isInteger(zoom)||zoom<0||zoom>19||x<0||y<0||x>=2**zoom||y>=2**zoom)throw new RangeError('Invalid map tile');
  const nw=geoToCivita(tileLat(y,zoom),tileLon(x,zoom));
  const se=geoToCivita(tileLat(y+1,zoom),tileLon(x+1,zoom));
  return {x:(nw.x+se.x)/2,z:(nw.z+se.z)/2,width:se.x-nw.x,depth:se.z-nw.z};
}
// Safe camera-target zone: includes the verified OSM bridge while remaining inside the two published tiles.
// These limits are VISUAL CAMERA CONTROLS, not surveyed village/cliff boundaries.
export const CAMERA_TARGET_LIMITS=Object.freeze({minX:-360,maxX:140,minZ:-45,maxZ:140});
export function clampCivitaTarget(x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z))throw new TypeError('Invalid camera target');
  return {x:Math.min(CAMERA_TARGET_LIMITS.maxX,Math.max(CAMERA_TARGET_LIMITS.minX,x)),z:Math.min(CAMERA_TARGET_LIMITS.maxZ,Math.max(CAMERA_TARGET_LIMITS.minZ,z))};
}
