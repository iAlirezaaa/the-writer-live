/* Terrain source-grid to Three.js mapped relief, no fabricated ground contact.
 * Offline fixture; actual AWS DEM raster is separately checked in Pages CI.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sampleCivitaTerrain,applyCivitaTerrainToMap,CIVITA_TERRAIN_ATTRIBUTION} from '../web/civita-terrain.js';
import {MAP_TILES,MAP_ZOOM,mapTileRect,tileLon,tileLat,CIVITA_ORIGIN,civitaToGeo,geoToCivita} from '../web/civita-geo.mjs';
const src=readFileSync(new URL('../web/vendor/three.module.js',import.meta.url),'utf8');
const THREE=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const bounds={west:tileLon(34972),east:tileLon(34974),north:tileLat(24173),south:tileLat(24174)};
const cols=97,rows=49;
const fake={
 source:{provider:'Mapzen Terrain Tiles (AWS Open Data)',ground_contact_verified:false,
  terrain_surveyed_in_field:false,attribution:CIVITA_TERRAIN_ATTRIBUTION},
 bounds,columns:cols,rows,
 origin_elevation_m:415.28,min_relative_m:-24,max_relative_m:0,
 relative_heights_m:Array.from({length:cols*rows},(_,i)=>-(Math.floor(i/cols))*.5)
};
assert.equal(fake.relative_heights_m.length,4753);
assert.equal(sampleCivitaTerrain(fake,bounds.north,bounds.west),0);
assert.ok(sampleCivitaTerrain(fake,bounds.south,bounds.east)<-23);
const local=geoToCivita(CIVITA_ORIGIN.latitude,CIVITA_ORIGIN.longitude);
assert.equal(local.x,0);assert.equal(local.z,0);
const reverted=civitaToGeo(local.x,local.z);
assert.ok(Math.abs(reverted.latitude-CIVITA_ORIGIN.latitude)<1e-8);
assert.ok(Math.abs(reverted.longitude-CIVITA_ORIGIN.longitude)<1e-8);
const scene=new THREE.Group(),writer=new THREE.Group();writer.name='writer-character-unchanged';scene.add(writer);
const tiles=MAP_TILES.map(([x,y])=>{
 const r=mapTileRect(x,y,MAP_ZOOM);
 const t=new THREE.Mesh(new THREE.PlaneGeometry(r.width,r.depth),new THREE.MeshBasicMaterial());
 t.position.set(r.x,-.12,r.z);t.rotation.x=-Math.PI/2;
 scene.add(t);return t;
});
const old=tiles.map(t=>t.geometry);
const result=applyCivitaTerrainToMap(THREE,tiles,fake,{subdivisions:16});
assert.equal(result.geometryCount,2);
assert.equal(result.verifiedGroundContact,false);
assert.equal(result.centerElevationM,415.28);
assert.ok(tiles.every((t,i)=>t.geometry!==old[i]));
assert.ok(tiles.every(t=>t.geometry.attributes.position.count===289));
assert.ok(tiles.every(t=>t.userData.terrainSurveyedAt5m===false));
assert.equal(writer.parent,scene);
assert.equal(writer.children.length,0);
const allHeights=tiles.flatMap(t=>Array.from({length:t.geometry.attributes.position.count},(_,i)=>t.geometry.attributes.position.getZ(i)));
assert.ok(Math.max(...allHeights)-Math.min(...allHeights)>2);
assert.throws(()=>applyCivitaTerrainToMap(THREE,tiles,{...fake,source:{provider:'unknown'}}));
assert.equal(sampleCivitaTerrain(fake,bounds.north+1,bounds.west),null);
console.log('CIVITA-TERRAIN-THREE-OK',JSON.stringify({
 rasterTiles:2,terrainVertices:allHeights.length,relativeElevationSpanM:(Math.max(...allHeights)-Math.min(...allHeights)).toFixed(1),
 cityWriterAppearanceUnchanged:writer.parent===scene,surveyed5m:false
}));
