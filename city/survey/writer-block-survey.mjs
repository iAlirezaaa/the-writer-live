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
    surveyArea:area,blockBoundary:deriveContainingRoadFace(features)||
      {status:'UNVERIFIED',geometry:null,
       reason:'No containing road-centerline face was found; block boundaries require verification.'},
    features:{type:'FeatureCollection',features},totals};
}

/**
 * Official OSM Editing API (GET /api/0.6/map.json) supplies node references
 * instead of the Overpass way.geometry array. Resolve only complete ways;
 * missing nodes remain invalid rather than inventing vertices.
 */
export function normalizeOsmApiMap(osm){
  if(!osm||!Array.isArray(osm.elements)||Number(osm.version)!==0.6)
    throw new TypeError('Invalid OSM API JSON');
  const nodes=new Map(osm.elements.filter(e=>e.type==='node'&&
    Number.isSafeInteger(e.id)&&validPoint(e)).map(e=>[e.id,{lat:e.lat,lon:e.lon}]));
  const elements=[];
  for(const way of osm.elements){
    if(way.type!=='way'||!way.tags||!('highway' in way.tags||'building' in way.tags))continue;
    if(!Array.isArray(way.nodes)||way.nodes.length<2)continue;
    const geometry=way.nodes.map(id=>nodes.get(id));
    if(geometry.some(p=>!p))continue;
    elements.push({type:'way',id:way.id,tags:way.tags,geometry});
  }
  return {version:0.6,generator:osm.generator||'OpenStreetMap API',elements};
}

/** A map-derived *candidate*, not a cadastral or roadway-edge footprint.
 * Construct planar faces from shared OSM road nodes, then select the smallest
 * bounded positive-area face containing the WGS84 writer-home anchor.
 */
export function deriveContainingRoadFace(features){
  const highwayTypes=new Set(['residential','tertiary','secondary','primary',
    'unclassified','living_street','service','road']);
  const nodes=new Map(),halfEdges=[];
  const key=p=>p[0].toFixed(2)+','+p[1].toFixed(2);
  for(const f of features){
    if(f.properties?.kind!=='road'||!highwayTypes.has(f.properties.tags.highway))continue;
    const points=f.properties.localXZ;
    if(!Array.isArray(points))continue;
    for(let i=1;i<points.length;i++){
      const from=key(points[i-1]),to=key(points[i]);
      if(from===to)continue;
      if(!nodes.has(from))nodes.set(from,{p:points[i-1],out:[]});
      if(!nodes.has(to))nodes.set(to,{p:points[i],out:[]});
      const a=nodes.get(from).p,b=nodes.get(to).p;
      const ab={from,to,id:f.id,angle:Math.atan2(b[1]-a[1],b[0]-a[0])};
      const ba={from:to,to:from,id:f.id,angle:Math.atan2(a[1]-b[1],a[0]-b[0])};
      nodes.get(from).out.push(ab);nodes.get(to).out.push(ba);
      halfEdges.push(ab,ba);
    }
  }
  for(const n of nodes.values())n.out.sort((a,b)=>a.angle-b.angle);
  const seen=new Set(),candidates=[],sig=e=>e.from+'>'+e.to;
  const enclosesOrigin=poly=>{
    let yes=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[i],b=poly[j];
      if((a[1]>0)!==(b[1]>0)&&0<(b[0]-a[0])*(-a[1])/(b[1]-a[1])+a[0])yes=!yes;
    }
    return yes;
  };
  for(const start of halfEdges){
    if(seen.has(sig(start)))continue;
    let curr=start,closed=false;
    const polygon=[],sourceIds=new Set();
    for(let i=0;i<Math.min(2500,halfEdges.length+1);i++){
      const mark=sig(curr);
      if(seen.has(mark)){closed=mark===sig(start);break;}
      seen.add(mark);polygon.push(nodes.get(curr.from).p);sourceIds.add(curr.id);
      const adjacent=nodes.get(curr.to).out;
      const back=adjacent.findIndex(e=>e.to===curr.from);
      if(back<0)break;
      curr=adjacent[(back-1+adjacent.length)%adjacent.length];
    }
    if(!closed||polygon.length<3||!enclosesOrigin(polygon))continue;
    const area=polygon.reduce((sum,p,i)=>{
      const q=polygon[(i+1)%polygon.length];return sum+p[0]*q[1]-q[0]*p[1];
    },0)/2;
    if(area>1&&area<250000)candidates.push({area,polygon,sourceIds:[...sourceIds]});
  }
  if(!candidates.length)return null;
  candidates.sort((a,b)=>a.area-b.area);
  const chosen=candidates[0];
  return {status:'OSM_CENTERLINE_CANDIDATE',geometry:{type:'Polygon',
      coordinates:[[...chosen.polygon,chosen.polygon[0]].map(([x,z])=>{
        const p=toGeo(x,z);return [p.lon,p.lat];
      })]},
    localXZ:[...chosen.polygon,chosen.polygon[0]],
    areaSquareMeters:Math.round(chosen.area),
    roadWayIds:chosen.sourceIds,
    confidence:'topology-only; road centers, not curbs or cadastral plot edges',
    requiresSurvey:true};
}
