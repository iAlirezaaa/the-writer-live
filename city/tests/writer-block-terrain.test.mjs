import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSamplingGrid,compileTerrain,GRID_WIDTH,GRID_DEPTH} from '../survey/acquire-writer-block-terrain.mjs';
const survey=JSON.parse(readFileSync(new URL('../survey/output/writer-block-survey.json',import.meta.url),'utf8'));
const sample=createSamplingGrid(survey);
const fake=()=>({status:'OK',results:sample.points.map((p,i)=>({
  dataset:'srtm30m',elevation:1200+i*.1,
  location:{lat:Number(p.lat.toFixed(8)),lng:Number(p.lon.toFixed(8))}
}))});
test('DEM sample grid matches ONLY road-bounded sourced writer-block neighborhood',()=>{
  assert.equal(sample.points.length,GRID_WIDTH*GRID_DEPTH+1);
  assert.equal(sample.points[0].role,'home-anchor');
  assert.equal(sample.points[0].lat,survey.homeAnchor.lat);
  assert.equal(sample.points[0].lon,survey.homeAnchor.lon);
  assert.ok(sample.bounds.xMin>-130&&sample.bounds.xMax<70);
  assert.ok(sample.bounds.zMin>-35&&sample.bounds.zMax<110);
  assert.ok(sample.points.every(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)));
  assert.throws(()=>createSamplingGrid({...survey,blockBoundary:{status:'UNVERIFIED'}}),/Unverified/);
});
test('SRTM source response must carry aligned values and date, no invented heights',()=>{
 const result=compileTerrain(fake(),survey,{capturedAt:'2026-11-09T10:00:00.000Z'});
 assert.equal(result.grid.heightsMetersEGM96.length,GRID_WIDTH*GRID_DEPTH);
 assert.equal(result.homeAnchor.lat,survey.homeAnchor.lat);
 assert.equal(result.homeAnchor.elevationMetersEGM96,1200);
 assert.equal(result.verticalDatum,'EGM96 geoid');
 assert.equal(result.nominalRasterResolutionMeters,30);
 assert.equal(result.providerDataset,'srtm30m');
 assert.equal(result.blockBoundary.ringLocalXZ.length,6);
 assert.equal(result.stats.sampleCount,64);
 assert.throws(()=>compileTerrain({...fake(),results:[]},survey,
   {capturedAt:'2026-11-09T10:00:00Z'}),/Incomplete/);
 const missing=fake();missing.results[7].elevation=null;
 assert.throws(()=>compileTerrain(missing,survey,{capturedAt:'2026-11-09T10:00:00Z'}),/invalid/);
 const swapped=fake();swapped.results[2].location.lat+=.3;
 assert.throws(()=>compileTerrain(swapped,survey,{capturedAt:'2026-11-09T10:00:00Z'}),/not aligned/);
});
