/* Source contract on the actual build-time OSM bridge way.
 * No guesses: required OSM way 59997267 must exist and be >200 m.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {selectCivitaBridgeAlignment,CIVITA_BRIDGE_STRUCTURE,resampleCivitaBridge} from '../../web/civita-bridge.js';
const path=resolve(process.argv[2]||'_site/web/data/civita-bridge-corridor.json');
const source=JSON.parse(readFileSync(path,'utf8'));
const route=selectCivitaBridgeAlignment(source);
assert.equal(route.sourceId,'way/59997267');
assert.ok(route.totalLengthM>200&&route.totalLengthM<300);
assert.equal(route.attributes.bridge,'yes');
assert.ok(route.attributes.name.includes('Sordi')||route.attributes.name.includes('Fellini'));
assert.equal(CIVITA_BRIDGE_STRUCTURE.span_count,14);
assert.equal(CIVITA_BRIDGE_STRUCTURE.pier_count,13);
assert.equal(resampleCivitaBridge(route).length,15);
assert.equal(route.absoluteHeightVerified,false);
assert.equal(route.groundElevationVerified,false);
console.log('CIVITA-BRIDGE-SOURCE-VALID',JSON.stringify({
 osmWay:route.sourceId,mappedMeters:Math.round(route.totalLengthM),
 spans:CIVITA_BRIDGE_STRUCTURE.span_count,piers:CIVITA_BRIDGE_STRUCTURE.pier_count,
 sourceDate:route.osmTimestamp,sourceAcquiredAt:route.acquiredAt,
 datumAndFootingUnverified:true
}));
