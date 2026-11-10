/* Civita structural viaduct regression: real Three.js geometry, sourced 245m OSM approach.
 * No physical collision, no invented terrain datum, writer rig is untouched.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectCivitaBridgeAlignment,resampleCivitaBridge,civitaBridgeProfileY,buildCivitaBridge,CIVITA_BRIDGE_STRUCTURE} from '../web/civita-bridge.js';
const lib=readFileSync(new URL('../web/vendor/three.module.js',import.meta.url),'utf8');
const THREE=await import('data:text/javascript;base64,'+Buffer.from(lib).toString('base64'));
const route={
 source:{provider:'OpenStreetMap contributors',license:'ODbL-1.0',
    url:'https://api.openstreetmap.org/api/0.6/map?bbox=12.1083,42.624,12.1136,42.628',
    acquired_at:'2026-11-10T10:06:30Z'},
 ways:[{
  type:'way',id:59997267,tags:{highway:'pedestrian',bridge:'yes',name:'Ponte Alberto Sordi e Federico Fellini'},
  timestamp:'2026-10-01T12:00:00Z',
  geometry:[{lat:42.6262194,lon:12.1096709},{lat:42.62638,lon:12.11008},{lat:42.62655,lon:12.11055},{lat:42.62675,lon:12.11102},{lat:42.62702,lon:12.11162},{lat:42.6273247,lon:12.1122457}]
 }]
};
const center=selectCivitaBridgeAlignment(route);
assert.equal(center.sourceId,'way/59997267');
assert.ok(center.totalLengthM>200&&center.totalLengthM<300);
assert.ok(center.points[0].lon>center.points.at(-1).lon,'first station must be cityward');
const stations=resampleCivitaBridge(center);
assert.equal(stations.length,15);
assert.equal(stations[0].progress,0);
assert.equal(stations.at(-1).progress,1);
assert.ok(civitaBridgeProfileY(5/14,center.totalLengthM)<0);
assert.ok(civitaBridgeProfileY(9/14,center.totalLengthM)<0);
assert.ok(civitaBridgeProfileY(1,center.totalLengthM)>civitaBridgeProfileY(9/14,center.totalLengthM));
const root=new THREE.Group(),writer=new THREE.Group();writer.name='writer-original-character-untouched';root.add(writer);
const built=buildCivitaBridge(THREE,root,route);
assert.equal(built.group.parent,root);
assert.equal(writer.parent,root);
assert.equal(built.group.userData.spanCount,14);
assert.equal(built.group.userData.pierCount,13);
assert.equal(built.group.userData.absoluteElevationVerified,false);
assert.equal(built.group.userData.footingGroundContactVerified,false);
assert.equal(built.group.userData.physicalCollider,false);
const slab=built.group.getObjectByName('viaduct-slab-span-1');
assert.ok(slab?.isMesh);
assert.equal(slab.geometry.parameters.width,4);
assert.equal(slab.geometry.parameters.height,.15);
assert.equal(built.group.getObjectByName('viaduct-slab-span-2').geometry.parameters.width,2.5);
const beams=built.group.children.filter(c=>c.name.startsWith('prestressed-girder-'));
assert.equal(beams.length,44,'First span 5 and 13x3 other spans');
assert.equal(built.group.children.filter(c=>c.name.startsWith('reinforced-concrete-pier-cap')).length,13);
assert.equal(built.group.children.filter(c=>c.name.startsWith('concrete-round-pier-')).length,44);
assert.ok(built.group.getObjectByName('concrete-round-pier-4-column-1').userData.heightProxyM===15);
const coords=built.stations.flatMap(p=>[p.x,p.y,p.z]);
assert.ok(coords.every(Number.isFinite));
assert.ok(stations.every(p=>p.x<-20),'bridge never overwrites writer home center');
assert.ok(built.group.children.every(c=>c.userData.physicalCollider===false));
assert.throws(()=>selectCivitaBridgeAlignment({...route,ways:[{...route.ways[0],id:555}]}));
assert.throws(()=>selectCivitaBridgeAlignment({...route,source:{...route.source,license:'none'}}));
assert.throws(()=>selectCivitaBridgeAlignment({...route,ways:[{...route.ways[0],geometry:[{lat:0,lon:0},route.ways[0].geometry[1]]}]}));
console.log('CIVITA-STRUCTURAL-BRIDGE-OK',JSON.stringify({
 lengthOSM_m:Math.round(center.totalLengthM),structuralSpans:14,piers:13,
 beams:beams.length,roundColumns:44,
 mappedCenterline:true,absoluteVerticalHeightVerified:false,
 testedMeshes:built.group.children.length,
 writerAppearancePreserved:writer.parent===root
}));
