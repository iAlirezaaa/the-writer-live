/* Regression: the author home must move only to sourced Civita polygon, not
 * the old arbitrary origin. Building label D is official site-plan evidence;
 * the OSM way association remains provisional cadastral matching.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {locateCivitaWriterParcel,CIVITA_LO_STUDIO_MATCH} from '../web/civita-writer-location.js';
import {buildCivitaWriterExterior} from '../web/civita-writer-house.js';
const root=resolve(process.argv[2]||'.');
const snapshot=JSON.parse(readFileSync(resolve(root,'web/data/civita-osm-snapshot.json'),'utf8'));
const site=locateCivitaWriterParcel(snapshot);
assert.equal(site.sourceWay,'way/464102189');
assert.equal(site.officialPlanKey,'D');
assert.equal(site.cadastralMatchVerified,false);
assert.equal(site.footprintInteriorClear,true);
assert.ok(site.footprintAreaM2>75&&site.footprintAreaM2<95);
assert.ok(site.x>75&&site.x<95&&site.z< -30&&site.z> -52);
assert.ok(Math.abs(site.yawRadians-1.960)<.1);
assert.ok(site.latitude>42.628&&site.longitude>12.1146);
assert.equal(site.roomFitCheckedM[0],6.55);
const modified=JSON.parse(JSON.stringify(snapshot));
modified.elements=modified.elements.filter(e=>e.id!==CIVITA_LO_STUDIO_MATCH.osmWayId);
assert.throws(()=>locateCivitaWriterParcel(modified),'no fallback house must appear');
assert.throws(()=>locateCivitaWriterParcel({...snapshot,source:{...snapshot.source,license:'NO'}}));
const missing=JSON.parse(JSON.stringify(snapshot));
missing.elements=missing.elements.filter(e=>e.id!==464102185);
assert.throws(()=>locateCivitaWriterParcel(missing),'plan neighbors required');
const lib=readFileSync(resolve(root,'web/vendor/three.module.js'),'utf8');
const THREE=await import('data:text/javascript;base64,'+Buffer.from(lib).toString('base64'));
const world=new THREE.Scene();
const room=new THREE.Group();room.name='writer-interior-street-level';
const appearance=new THREE.Mesh(new THREE.BoxGeometry(.5,1.8,.5));appearance.name='WRITER-IDENTITY-UNTOUCHED';room.add(appearance);world.add(room);
const exterior=new THREE.Group();world.add(exterior);
const beforeAppearanceGeometry=appearance.geometry;
room.position.set(site.x,.2,site.z);room.rotation.y=site.yawRadians;
exterior.position.set(site.x,3.2,site.z);exterior.rotation.y=site.yawRadians;
const shell=buildCivitaWriterExterior(THREE,exterior,{roomWidth:6,roomDepth:6,streetY:-3,parentOffsetY:3.2});
room.updateMatrixWorld(true);exterior.updateMatrixWorld(true);
const p=room.localToWorld(new THREE.Vector3(1,1,2));
assert.ok(p.distanceTo(new THREE.Vector3(1,1,2))>25,'local room/camera moves to real sourced parcel');
assert.equal(room.children[0],appearance);
assert.equal(appearance.geometry,beforeAppearanceGeometry);
assert.equal(exterior.children[0],shell.group);
const worldCode=readFileSync(resolve(root,'web/world.js'),'utf8');
assert.match(worldCode,/loadCivitaWriterParcel\(/);
assert.match(worldCode,/town\.setWriterPlacement/);
assert.match(worldCode,/writerInteriorWorldRoot\.matrixWorld/);
assert.match(worldCode,/writerExterior\.visible=outdoors && Boolean\(writerParcelSite\)/);
console.log('CIVITA-REAL-WRITER-PARCEL-CANDIDATE-OK',JSON.stringify({
 officialPlan:'D',osmWay:site.sourceWay,roomFootprintFit:true,
 relativeMapX:Math.round(site.x),relativeMapZ:Math.round(site.z),
 buildingM2:Math.round(site.footprintAreaM2),
 writerAppearancePreserved:true,cadastralVerification:false
}));
