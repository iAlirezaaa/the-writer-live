import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const data=JSON.parse(readFileSync(resolve(process.argv[2]||'_site/web/data/civita-terrain-grid.json'),'utf8'));
assert.equal(data.columns,97);assert.equal(data.rows,49);
assert.equal(data.relative_heights_m.length,97*49);
assert.equal(data.source.provider,'Mapzen Terrain Tiles (AWS Open Data)');
assert.match(data.source.attribution,/EU-DEM/);
assert.equal(data.source.terrain_surveyed_in_field,false);
assert.equal(data.source.ground_contact_verified,false);
assert.ok(data.origin_elevation_m>200&&data.origin_elevation_m<700);
assert.ok(data.relative_heights_m.every(h=>typeof h==='number'&&Number.isFinite(h)&&Math.abs(h)<500));
assert.ok(data.bounds.west<data.bounds.east&&data.bounds.south<data.bounds.north);
const m=Math.min(...data.relative_heights_m),M=Math.max(...data.relative_heights_m);
assert.equal(data.min_relative_m,m);assert.equal(data.max_relative_m,M);
assert.ok(M-m>2,'terrain without any relief should not replace documented 3D map');
console.log('CIVITA-TERRAIN-SOURCE-OK',JSON.stringify({
 sampleGrid:data.columns+'x'+data.rows,baseElevationM:data.origin_elevation_m,
 minRelativeM:m,maxRelativeM:M,surveyed:false,
 attribution:data.source.attribution
}));
