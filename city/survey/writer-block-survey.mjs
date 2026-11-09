/**
 * Writer-block survey contracts. No rendering, networking or guessed parcels.
 * A WGS84 home anchor is not proof of a road-bounded block polygon.
 * Data license: © OpenStreetMap contributors, ODbL 1.0.
 */
export const WRITER_HOME = Object.freeze({lat:35.715361987616696,lon:51.3642455031707});
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors — Open Database License (ODbL) 1.0';
export const DEFAULT_RADIUS_METERS = 230;
const DEG = Math.PI / 180;
const M_LAT = 111132.92 - 559.82*Math.cos(2*WRITER_HOME.lat*DEG) + 1.175*Math.cos(4*WRITER_HOME.lat*DEG);
const M_LON = 111412.84*Math.cos(WRITER_HOME.lat*DEG) - 93.5*Math.cos(3*WRITER_HOME.lat*DEG);
export function toScene(lat,lon){
  if (![lat,lon].every(Number.isFinite)) throw new TypeError('Invalid geographic coordinate');
  return {x:(lon-WRITER_HOME.lon)*M_LON,z:(WRITER_HOME.lat-lat)*M_LAT};
}
export function toGeo(x,z){
  if (![x,z].every(Number.isFinite)) throw new TypeError('Invalid local coordinate');
  return {lat:WRITER_HOME.lat-z/M_LAT,lon:WRITER_HOME.lon+x/M_LON};
}
export function writerArea(radius=DEFAULT_RADIUS_METERS){
  if(!Number.isFinite(radius)||radius<50||radius>400) throw new RangeError('Survey radius must be 50–400m');
  return Object.freeze({south:WRITER_HOME.lat-radius/M_LAT,west:WRITER_HOME.lon-radius/M_LON,
    north:WRITER_HOME.lat+radius/M_LAT,east:WRITER_HOME.lon+radius/M_LON,radiusMeters:radius});
}
export function overpassQuery(area=writerArea()){
  const bbox=[area.south,area.west,area.north,area.east].map(v=>v.toFixed(8)).join(',');
  return '[out:json][timeout:35];(way["highway"]('+bbox+');way["building"]('+bbox+'););out geom;';
}
function inside(p,a){return p.lat>=a.south&&p.lat<=a.north&&p.lon>=a.west&&p.lon<=a.east;}
function validPoint(p){return p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180;}
function eq(a,b){return a.lat===b.lat&&a.lon===b.lon;}
function publicTags(tags,road){
  const keys=road?['highway','name','oneway','lanes','width','surface','sidewalk','maxspeed','footway','service']:
    ['building','building:levels','height','roof:shape','roof:levels'];
  return Object.fromEntries(keys.filter(k=>typeof tags[k]==='string').map(k=>[k,tags[k]]));
}
function pointToCoordinate(p){return [p.lon,p.lat];}
function local(p){const c=toScene(p.lat,p.lon);return [Number(c.x.toFixed(3)),Number(c.z.toFixed(3))];}
/** Full ways crossing the survey boundary are retained and flagged, not traced from proprietary imagery. */
export function compileSurvey(osm,{area=writerArea(),sourceUrl='https://overpass-api.de/api/interpreter',capturedAt}={}){
  if(!osm||!Array.isArray(osm.elements)||osm.version!==0.6) throw new TypeError('Expected Overpass JSON elements/version 0.6');
  if(!capturedAt||!Number.isFinite(Date.parse(capturedAt))) throw new TypeError('Explicit acquisition timestamp required');
  const features=[],seen=new Set();
  let incompleteWays=0,missingHeights=0,crossesSurveyBoundary=0;
  for(const e of osm.elements){
    if(e.type!=='way'||!Number.isSafeInteger(e.id)||e.id<=0||seen.has(e.id))continue;
    seen.add(e.id);
    const tags=e.tags||{};
    const kind=typeof tags.highway==='string'?'road':(typeof tags.building==='string'?'building':null);
    if(!kind)continue;
    const ps=e.geometry;
    if(!Array.isArray(ps)||ps.length<2||!ps.every(validPoint)){incompleteWays++;continue;}
    if(!ps.some(p=>inside(p,area)))continue;
    const complete=kind==='building'&&ps.length>=4&&eq(ps[0],ps.at(-1));
    if(kind==='building'&&!complete){incompleteWays++;continue;}
    const boundaryCrossed=ps.some(p=>!inside(p,area));
    if(boundaryCrossed)crossesSurveyBoundary++;
    if(kind==='building'&&!('height' in tags)&&!('building:levels' in tags))missingHeights++;
    features.push({type:'Feature',id:'osm:way:'+e.id,geometry:{
      type:kind==='building'?'Polygon':'LineString',
      coordinates:kind==='building'?[ps.map(pointToCoordinate)]:ps.map(pointToCoordinate)
    },properties:{sourceId:e.id,sourceType:'OSM way',kind,partialInArea:boundaryCrossed,
      localXZ:kind==='building'?[ps.map(local)]:ps.map(local),tags:publicTags(tags,kind==='road'),
      heightEvidence:kind==='building'?('height' in tags?'tagged-height':('building:levels' in tags?'tagged-levels':'unknown')):null,
      status:'mapped-unverified'}});
  }
  features.sort((a,b)=>a.properties.kind.localeCompare(b.properties.kind)||a.properties.sourceId-b.properties.sourceId);
  const totals={roads:features.filter(f=>f.properties.kind==='road').length,
    buildings:features.filter(f=>f.properties.kind==='building').length,
    incompleteWays,missingHeights,crossesSurveyBoundary};
  return {schemaVersion:1,geoSource:'OpenStreetMap Overpass',license:'ODbL-1.0',attribution:OSM_ATTRIBUTION,
    endpoint:sourceUrl,capturedAt,osmBaseTimestamp:osm.osm3s?.timestamp_osm_base||null,
    homeAnchor:{...WRITER_HOME,crs:'EPSG:4326',localX:'east',localZ:'south'},
    surveyArea:area,blockBoundary:{status:'UNVERIFIED',geometry:null,
      reason:'A road-bounded containing block has not yet been topologically measured and visually checked.'},
    features:{type:'FeatureCollection',features},totals};
}
