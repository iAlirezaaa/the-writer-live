/* MAYOR-057: read-only spatial index for LICENSED WGS84 city GeoJSON.
 * No meshes, speculative elevations, citizen paths or network fetches.
 * Usage:
 *   node city/survey/tehran-geotile-index.mjs --input city/survey/output/writer-block-survey.json --out city/survey/output/writer-block-tiles-z17.json --zoom 17
 * The generated index references immutable feature IDs; it does not clip,
 * duplicate, extrude, transform or imply that features are real buildings.
 */
import {readFileSync, writeFileSync, mkdirSync} from "node:fs";
import {dirname, resolve} from "node:path";

const MAX_MERCATOR_LAT=85.05112878;
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
export function lonLatTile(lon,lat,zoom=17){
  assert(Number.isInteger(zoom)&&zoom>=8&&zoom<=19,"Unsupported tile zoom");
  assert(Number.isFinite(lon)&&lon>=-180&&lon<=180&&
    Number.isFinite(lat)&&lat>=-MAX_MERCATOR_LAT&&lat<=MAX_MERCATOR_LAT,
    "Invalid EPSG:4326 coordinate for Web Mercator");
  const n=2**zoom,rad=lat*Math.PI/180;
  return {
    x:Math.min(n-1,Math.max(0,Math.floor((lon+180)/360*n))),
    y:Math.min(n-1,Math.max(0,Math.floor((1-Math.asinh(Math.tan(rad))/Math.PI)/2*n)))
  };
}
function featureBounds(feature){
  const {geometry}=feature;
  assert(geometry&&["Point","MultiPoint","LineString","MultiLineString","Polygon","MultiPolygon"].includes(geometry.type),
    "Unsupported/missing geometry for "+feature.id);
  let west=Infinity,south=Infinity,east=-Infinity,north=-Infinity,count=0;
  function visit(coords){
    assert(Array.isArray(coords)&&coords.length>0,"Empty geometry "+feature.id);
    if(typeof coords[0]==="number"){
      const [lon,lat]=coords;
      lonLatTile(lon,lat,17); // validate EPSG:4326 and Mercator latitude
      west=Math.min(west,lon);east=Math.max(east,lon);
      south=Math.min(south,lat);north=Math.max(north,lat);count++;
      return;
    }
    for(const part of coords)visit(part);
  }
  visit(geometry.coordinates);
  assert(count>0,"Geometry without coordinates "+feature.id);
  return {west,south,east,north};
}
export function makeTehranTileIndex(snapshot,{zoom=17,maxTilesPerFeature=64}={}){
  assert(snapshot&&typeof snapshot==="object","Missing source snapshot");
  assert(snapshot.features?.type==="FeatureCollection"&&Array.isArray(snapshot.features.features),
    "Expected source-backed FeatureCollection");
  assert(typeof snapshot.geoSource==="string"&&snapshot.geoSource.trim(),
    "Missing identifiable source");
  assert(typeof snapshot.license==="string"&&snapshot.license.trim()&&
    typeof snapshot.attribution==="string"&&snapshot.attribution.trim(),
    "Missing license and attribution");
  assert(typeof snapshot.capturedAt==="string"&&
    Number.isFinite(Date.parse(snapshot.capturedAt)),
    "Missing valid acquisition timestamp");
  assert(!snapshot.homeAnchor?.crs||snapshot.homeAnchor.crs==="EPSG:4326",
    "Only WGS84 input accepted; transform other CRSs upstream");
  assert(Number.isInteger(zoom)&&zoom>=8&&zoom<=19,"Unsupported tile zoom");
  assert(Number.isInteger(maxTilesPerFeature)&&maxTilesPerFeature>=1,
    "Invalid maxTilesPerFeature");
  const ids=new Set(),tiles=new Map(),global={west:Infinity,south:Infinity,east:-Infinity,north:-Infinity};
  for(const feature of snapshot.features.features){
    assert(feature?.type==="Feature"&&
      (typeof feature.id==="string"&&feature.id.trim()||Number.isSafeInteger(feature.id)),
      "Feature missing stable source ID");
    const id=String(feature.id);
    assert(!ids.has(id),"Duplicate feature ID: "+id);ids.add(id);
    const b=featureBounds(feature);
    for(const edge of ["west","south"])global[edge]=Math.min(global[edge],b[edge]);
    for(const edge of ["east","north"])global[edge]=Math.max(global[edge],b[edge]);
    const a=lonLatTile(b.west,b.north,zoom),c=lonLatTile(b.east,b.south,zoom);
    const coverage=(c.x-a.x+1)*(c.y-a.y+1);
    assert(coverage<=maxTilesPerFeature,
      "Unsplit feature spans too many tiles: "+id+" ("+coverage+"); clip upstream before citywide indexing");
    for(let y=a.y;y<=c.y;y++)for(let x=a.x;x<=c.x;x++){
      const key=`${zoom}/${x}/${y}`;
      if(!tiles.has(key))tiles.set(key,[]);
      tiles.get(key).push(id);
    }
  }
  const ordered=Object.fromEntries([...tiles].sort(([a],[b])=>a.localeCompare(b))
    .map(([key,values])=>[key,values.sort()]));
  return {
    schemaVersion:1,mode:"provenance-metadata-only",projection:"EPSG:3857 tile grid; original feature coordinates remain EPSG:4326",
    zoom,source:snapshot.geoSource,license:snapshot.license,attribution:snapshot.attribution,
    capturedAt:snapshot.capturedAt,featureCount:ids.size,tileCount:tiles.size,
    bbox:ids.size?global:null,tiles:ordered,
    limitations:[
      "Whole unsplit features are indexed by bounding-box overlap (not geometric clipping).",
      "Feature IDs may occur in multiple tiles; any renderer must deduplicate by original source ID.",
      "No new heights, floors, facades, entrances, true road widths or real-world completeness claims.",
      "Source-license obligations must be checked before publishing source features or GLB exports."
    ]
  };
}
function cli(args){
  const option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
  const input=option("--input",null),out=option("--out",null),zoom=Number(option("--zoom","17"));
  if(!input||!out)throw new Error("Usage: --input snapshot.json --out index.json [--zoom 17]");
  const result=makeTehranTileIndex(JSON.parse(readFileSync(resolve(input),"utf8")),{zoom});
  mkdirSync(dirname(resolve(out)),{recursive:true});
  writeFileSync(resolve(out),JSON.stringify(result,null,2)+"\n");
  process.stdout.write(JSON.stringify({features:result.featureCount,tiles:result.tileCount,output:out})+"\n");
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname){
  try{cli(process.argv.slice(2));}catch(error){console.error(error.message);process.exitCode=1;}
}
