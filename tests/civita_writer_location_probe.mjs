/* Regression: the author home must move only to sourced Civita polygon, not
 * the old arbitrary origin. Building label D is official site-plan evidence;
 * the OSM way association remains provisional cadastral matching.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {locateCivitaWriterParcel,CIVITA_LO_STUDIO_MATCH} from '../web/civita-writer-location.js';
import {buildCivitaWriterExterior,CIVITA_WRITER_HOUSE_EVIDENCE} from '../web/civita-writer-house.js';
import {geoToCivita} from '../web/civita-geo.mjs';
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
/* MAYOR-076: verify actual object carries source-provenance without fabricating
 * a cadastral-certified lot, a surveyed threshold or a traversable opening.
 * The institute documents an upper door; its geometry is still unknown. */
const arch=CIVITA_WRITER_HOUSE_EVIDENCE;
assert.equal(arch.officialPlanLotKey,'D');
assert.equal(arch.neighborPropertyPlanKey,'E');
assert.equal(arch.officialPlanNotToScale,true);
assert.equal(arch.candidateOsmWayId,464102189);
assert.equal(arch.cadastralParcelVerified,false);
assert.equal(arch.secondFloorConnectionToIlNuovoDocumented,true);
assert.equal(arch.secondFloorConnectionModeled,false);
for(const unknown of [
 'secondFloorConnectingDoorCoordinatesM','facadeMeasuredWidthM',
 'entranceMeasuredWidthM','entranceMeasuredHeightM',
 'entranceThresholdSurveyedElevationM','thresholdVerticalDatum'
])assert.equal(arch[unknown],null,unknown+' must not be guessed');
assert.equal(arch.protectedWriterAppearance,true);
assert.equal(shell.group.userData.cityArchitectureEvidence.officialPlanLotKey,'D');
assert.ok(!shell.group.children.some(o=>/il[-_ ]?nuovo/i.test(o.name)),
 'Do not fabricate an upstairs corridor or door without permitted measurements');
room.updateMatrixWorld(true);exterior.updateMatrixWorld(true);
const p=room.localToWorld(new THREE.Vector3(1,1,2));
assert.ok(p.distanceTo(new THREE.Vector3(1,1,2))>25,'local room/camera moves to real sourced parcel');
assert.equal(room.children[0],appearance);
assert.equal(appearance.geometry,beforeAppearanceGeometry);
assert.equal(exterior.children[0],shell.group);

/* Validate the ACTUAL 3D shell, including all roof and step vertices; merely
 * fitting the room floor rectangle previously let the eaves cross OSM lot.
 * Invisible click-target surface is not physical building geometry. */
const candidate=snapshot.elements.find(e=>e.type==='way'&&e.id===site.osmWayId);
const outline=candidate.geometry.map(p=>geoToCivita(p.lat,p.lon));
const within=(p)=>{
 let ok=false;
 for(let i=0,j=outline.length-2;i<outline.length-1;j=i++){
  const a=outline[i],b=outline[j];
  if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)ok=!ok;
 }
 return ok;
};
const exteriorViolations=[];
let verticesChecked=0;
for(const mesh of shell.group.children){
 if(mesh.name==='civita-writer-house-interactive-front')continue;
 const points=mesh.geometry?.attributes?.position;
 if(!points)continue;
 for(let j=0;j<points.count;j++){
  verticesChecked++;
  const vertex=new THREE.Vector3().fromBufferAttribute(points,j).applyMatrix4(mesh.matrixWorld);
  if(!within(vertex))exteriorViolations.push(mesh.name);
 }
}
assert.ok(verticesChecked>400,'Check actual structural vertices, not a 2D room box');
assert.deepEqual([...new Set(exteriorViolations)],[],
 'Writer roof, threshold, plinth, facade must remain inside the sourced OSM polygon');

const worldCode=readFileSync(resolve(root,'web/world.js'),'utf8');
assert.match(worldCode,/loadCivitaWriterParcel\(/);
assert.match(worldCode,/town\.setWriterPlacement/);
assert.match(worldCode,/writerInteriorWorldRoot\.matrixWorld/);
assert.match(worldCode,/writerExterior\.visible=outdoors && Boolean\(writerParcelSite\)/);
/* The default outdoor view must actually contain the sourced house. Prior
 * camera centered on bridge, putting the new site beyond screen right.
 * This is a Three.js frustum test, NOT a browser screenshot. */
const cameraContract=worldCode.match(/town:\s*\{\s*pos:\s*\[([^\]]+)\],\s*target:\s*\[([^\]]+)\]/);
assert.ok(cameraContract,'Default town camera contract missing');
const numbers=text=>text.split(',').map(x=>Number(x.trim()));
const cameraPos=numbers(cameraContract[1]),cameraTarget=numbers(cameraContract[2]);
assert.ok([...cameraPos,...cameraTarget].every(Number.isFinite));
const camera=new THREE.PerspectiveCamera(40,1.65,.1,950);
camera.position.set(...cameraPos);
camera.lookAt(new THREE.Vector3(...cameraTarget));
camera.updateMatrixWorld(true);
const parcelOnScreen=new THREE.Vector3(site.x,.2,site.z).project(camera);
const centerOnScreen=new THREE.Vector3(0,0,0).project(camera);
assert.ok(Math.abs(parcelOnScreen.x)<.8&&Math.abs(parcelOnScreen.y)<.8,
 'Mapped writer house must be visible in default city framing');
assert.ok(Math.abs(centerOnScreen.x)<.85&&Math.abs(centerOnScreen.y)<.85,
 'Town center must remain visible around writer house');
const frameDistance=camera.position.distanceTo(new THREE.Vector3(...cameraTarget));
const houseDistance=camera.position.distanceTo(new THREE.Vector3(site.x,.2,site.z));
assert.ok(houseDistance<frameDistance+93,
 'Camera fog must not completely erase the georeferenced house');

console.log('CIVITA-REAL-WRITER-PARCEL-CANDIDATE-OK',JSON.stringify({
 officialPlan:'D',osmWay:site.sourceWay,roomFootprintFit:true,
 relativeMapX:Math.round(site.x),relativeMapZ:Math.round(site.z),
 buildingM2:Math.round(site.footprintAreaM2),
 writerAppearancePreserved:true,cadastralVerification:false,exteriorVerticesChecked:verticesChecked,lotBoundaryViolations:0,defaultCameraHomeInFrame:true
}));
