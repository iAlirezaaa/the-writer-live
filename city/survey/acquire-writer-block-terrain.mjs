#!/usr/bin/env node
/**
 * Bounded real-world SRTMGL1 V3 height sampling for the single writer block.
 * Datasource: NASA/USGS Shuttle Radar Topography Mission via OpenTopoData srtm30m;
 * WGS84 latitude/longitude and EGM96 heights in metres (~30 m raster).
 * Only DEM evidence is produced; never moves live town/house/citizen coordinates.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { toGeo, toScene, WRITER_HOME } from './writer-block-survey.mjs';

export const GRID_WIDTH=9,GRID_DEPTH=7;
export const SOURCE_URL='https://api.opentopodata.org/v1/srtm30m';
const ROOT='city/survey/output/';
export function createSamplingGrid(survey){
  const boundary=survey?.blockBoundary;
  if(boundary?.status!=='OSM_CENTERLINE_CANDIDATE'||boundary.localXZ?.length!==6)
    throw new TypeError('Unverified writer block: terrain download forbidden');
  if(survey.homeAnchor?.lat!==WRITER_HOME.lat||survey.homeAnchor?.lon!==WRITER_HOME.lon)
    throw new TypeError('WGS84 home anchor changed');
  const xs=boundary.localXZ.slice(0,-1).map(v=>v[0]);
  const zs=boundary.localXZ.slice(0,-1).map(v=>v[1]);
  const bounds={xMin:Math.min(...xs),xMax:Math.max(...xs),
    zMin:Math.min(...zs),zMax:Math.max(...zs)};
  if(bounds.xMax-bounds.xMin>300||bounds.zMax-bounds.zMin>300)
    throw new RangeError('Outside approved writer-block source bounds');
  const points=[{x:0,z:0,...toGeo(0,0),role:'home-anchor'}];
  for(let iz=0;iz<GRID_DEPTH;iz++){
    const z=bounds.zMin+(bounds.zMax-bounds.zMin)*iz/(GRID_DEPTH-1);
    for(let ix=0;ix<GRID_WIDTH;ix++){
      const x=bounds.xMin+(bounds.xMax-bounds.xMin)*ix/(GRID_WIDTH-1);
      points.push({x:Number(x.toFixed(3)),z:Number(z.toFixed(3)),...toGeo(x,z),
        role:'sample'});
    }
  }
  return {bounds,points};
}
export function compileTerrain(response,survey,{capturedAt,apiEndpoint=SOURCE_URL}={}){
  const grid=createSamplingGrid(survey);
  if(!Number.isFinite(Date.parse(capturedAt)))
    throw new TypeError('Capture time required');
  if(response?.status!=='OK'||response.results?.length!==grid.points.length)
    throw new TypeError('Incomplete SRTM30 elevation response');
  const values=[];
  for(let i=0;i<grid.points.length;i++){
    const p=grid.points[i],r=response.results[i],h=r?.elevation;
    if(r?.dataset!=='srtm30m'||!Number.isFinite(h)||h < -500||h > 9000)
      throw new TypeError('Missing or invalid srtm30m elevation at '+i);
    if(!r?.location||!Number.isFinite(r.location.lat)||!Number.isFinite(r.location.lng)||
       Math.abs(r.location.lat-p.lat)>0.00001||Math.abs(r.location.lng-p.lon)>0.00001)
      throw new TypeError('DEM coordinates not aligned at '+i);
    values.push(h);
  }
  const gridHeights=values.slice(1);
  if(!Number.isFinite(values[0]))throw new Error('Home reference missing');
  const result={
    schemaVersion:1,kind:'SRTM30M_APPROXIMATE_TERRAIN',sourceDataset:'NASA SRTMGL1 V3',
    providerDataset:'srtm30m',provider:'OpenTopoData',apiEndpoint,
    sourceInfo:'https://www.usgs.gov/centers/eros/science/usgs-eros-archive-digital-elevation-shuttle-radar-topography-mission-srtm',
    providerDocs:'https://www.opentopodata.org/datasets/srtm/',
    licenseNotes:'NASA/USGS public access; respect OpenTopoData API usage limits, cite NASA/USGS/OpenTopoData. Not cadastral or engineering-grade.',
    captureTime:capturedAt,sourceAcquisitionPeriod:'2000-02 (SRTM mission)',
    crs:'EPSG:4326',verticalDatum:'EGM96 geoid',unit:'m',
    nominalRasterResolutionMeters:30,interpolation:'bilinear',
    horizontalUncertainty:'SRTM 1 arc-second raster, not parcel-grade GPS',
    verticalUncertainty:'Radar/DSM-like first-return effects; not verified ground or building height',
    workScope:'writer-block-only; bounding rectangle samples for clipping to OSM road-bounded candidate',
    homeAnchor:{lat:WRITER_HOME.lat,lon:WRITER_HOME.lon,
      elevationMetersEGM96:values[0]},
    blockBoundary:{status:survey.blockBoundary.status,
      ringLocalXZ:survey.blockBoundary.localXZ,
      osmWayIds:survey.blockBoundary.roadWayIds,
      osmSourceCapturedAt:survey.capturedAt,
      osmLicense:survey.license},
    grid:{width:GRID_WIDTH,depth:GRID_DEPTH,bounds:grid.bounds,
      heightsMetersEGM96:gridHeights},
    stats:{sampleCount:gridHeights.length+1,
      minimumMetersEGM96:Math.min(...values),maximumMetersEGM96:Math.max(...values),
      minMaxDeltaMeters:Math.max(...values)-Math.min(...values)}
  };
  return result;
}
export async function acquireTerrain({surveyPath=ROOT+'writer-block-survey.json',
  outputPath=ROOT+'writer-block-dem-srtm30m.json'}={}){
  const survey=JSON.parse(await readFile(resolve(surveyPath),'utf8'));
  const {points}=createSamplingGrid(survey);
  const locations=points.map(p=>p.lat.toFixed(8)+','+p.lon.toFixed(8)).join('|');
  const url=SOURCE_URL+'?'+new URLSearchParams({locations,interpolation:'bilinear'});
  const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),25000);
  let response;
  try{
    response=await fetch(url,{signal:ctrl.signal,headers:{Accept:'application/json',
      'User-Agent':'TheWriterTehranTopography/0.1 (single-block source survey)'}});
    if(!response.ok)throw new Error('DEM API HTTP '+response.status);
  }finally{clearTimeout(timeout);}
  const text=await response.text();
  if(text.length>100000)throw new RangeError('Unexpected oversized DEM payload');
  const result=compileTerrain(JSON.parse(text),survey,
    {capturedAt:new Date().toISOString()});
  const out=resolve(outputPath);await mkdir(dirname(out),{recursive:true});
  await writeFile(out,JSON.stringify(result,null,2)+'\n','utf8');
  console.log('WRITER-BLOCK-DEM-SOURCE-OK',JSON.stringify(result.stats),out);
  return result;
}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href){
  await acquireTerrain({outputPath:process.argv[2]||ROOT+'writer-block-dem-srtm30m.json'});
}
