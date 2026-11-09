// MAYOR-018: read-only geographic regression checks; no renderer dependency.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../../web/urban-plan.js', import.meta.url), 'utf8');
const plan = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const { TEHRAN_GEO_ORIGIN: origin, cityLocalToGeo, geoToCityLocal, auditUrbanPlan } = plan;
assert.equal(origin.datum, 'WGS84');
assert.equal(origin.timezone, 'Asia/Tehran');
assert.equal(origin.latitude, 35.715361987616696);
assert.equal(origin.longitude, 51.3642455031707);
assert.deepEqual(geoToCityLocal(origin.latitude, origin.longitude), { x: 0, z: 0 });
for (const [x, z] of [[0,0],[100,0],[-100,0],[0,100],[0,-100],[750,-900]]) {
  const geo = cityLocalToGeo(x,z);
  const back = geoToCityLocal(geo.latitude,geo.longitude);
  assert.ok(Math.abs(back.x-x)<0.02 && Math.abs(back.z-z)<0.02, 'roundtrip '+x+','+z);
}
assert.ok(cityLocalToGeo(100,0).longitude>origin.longitude, 'east increases longitude');
assert.ok(cityLocalToGeo(0,-100).latitude>origin.latitude, 'north increases latitude');
assert.throws(()=>geoToCityLocal(NaN,origin.longitude),TypeError);
assert.throws(()=>cityLocalToGeo(Infinity,0),TypeError);
const audit = auditUrbanPlan();
assert.equal(typeof audit.ok,'boolean');
console.log(JSON.stringify({ geoContract:'PASS', urbanAudit:audit },null,2));
if(!audit.ok) console.warn('Existing urban layout audit reports issues; no geometry was changed.');
