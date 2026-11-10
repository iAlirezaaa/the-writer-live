/* MAYOR-070: inspect a build-generated Civita source snapshot.
 * Exit nonzero when the file has no safe OSM vector features.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {parseCivitaVectors,CIVITA_VECTOR_BBOX} from '../../web/civita-osm-vectors.mjs';
const path=resolve(process.argv[2]||'_site/web/data/civita-osm-snapshot.json');
const payload=JSON.parse(readFileSync(path,'utf8'));
assert.equal(payload.source?.license,'ODbL-1.0');
assert.match(payload.source?.url||'',/^https:\/\/api\.openstreetmap\.org\/api\/0\.6\/map\?bbox=/);
assert.deepEqual(payload.source?.bbox_wsen,[
 CIVITA_VECTOR_BBOX.west,CIVITA_VECTOR_BBOX.south,CIVITA_VECTOR_BBOX.east,CIVITA_VECTOR_BBOX.north]);
const data=parseCivitaVectors(payload);
assert.ok(data.buildings.length+data.paths.length>0,'No valid OSM ways may be published as local source');
assert.ok(payload.elements.length<=650);
assert.ok(data.buildings.every(b=>/^way\/\d+$/.test(b.id)&&b.provenance.license==='ODbL-1.0'));
assert.ok(data.paths.every(p=>/^way\/\d+$/.test(p.id)));
console.log('CIVITA-STATIC-SOURCE-OK',JSON.stringify({
 ways:payload.elements.length,buildings:data.buildings.length,footpaths:data.paths.length,
 rejected:data.rejected,acquiredAt:payload.source.acquired_at,
 heightsUnverified:data.buildings.filter(b=>b.displayHeightIsProxy).length,
 license:'ODbL-1.0'
}));
