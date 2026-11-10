/* MAYOR-068: real Three.js regression for ACTIVE default Civita scene.
 * Historical Tehran smoke probes still run separately with explicit source-only.
 * node --experimental-vm-modules tests/civita_main_town_probe.mjs [site-root]
 */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createContext,SourceTextModule} from 'node:vm';
const root=resolve(process.argv[2]||'.');
const read=p=>readFileSync(resolve(root,p),'utf8');
const THREE=await import('data:text/javascript;base64,'+Buffer.from(read('web/vendor/three.module.js')).toString('base64'));
const context=createContext({console,Date,performance});
const modules=new Map();
function load(path){
 if(modules.has(path))return modules.get(path);
 const module=new SourceTextModule(readFileSync(path,'utf8'),{context,identifier:path});
 modules.set(path,module);return module;
}
const mod=load(resolve(root,'web/town.js'));
await mod.link((specifier,referencing)=>{
 assert.ok(specifier.startsWith('./'),'No remote ESM code: '+specifier);
 return load(resolve(dirname(referencing.identifier),specifier.split('?')[0]));
});
await mod.evaluate();
const {buildTown}=mod.namespace;
const scene=new THREE.Scene();
const originalRoom=new THREE.Group();originalRoom.name='writer-interior-street-level';scene.add(originalRoom);
const authorExterior=new THREE.Group();authorExterior.name='writer-home-exterior-v2';scene.add(authorExterior);
const town=buildTown({THREE,scene,clickable(){throw Error('No imaginary Civic locations')},canvasTex(){}});
assert.equal(town.group.name,'town');
assert.equal(town.group.userData.cityBuild.activeCity,'Civita di Bagnoregio');
assert.equal(town.group.userData.cityBuild.mapMode,'civita');
assert.equal(town.group.userData.cityBuild.authorRoomProtected,true);
assert.equal(town.group.userData.cityBuild.realBuildingHeightsMeasured,false);
assert.equal(town.group.userData.cityBuild.physicalCityCollidersAdded,false);
assert.deepEqual(town.group.children.map(o=>o.name),[
 'civita-osm-map-underlay','OSM-Porta-di-Santa-Maria-marker-not-architecture','civita-source-volumes','civita-verified-viaduct-study'
]);
const tiles=town.group.getObjectByName('civita-osm-map-underlay');
assert.equal(tiles.children.length,2);
for(const tile of tiles.children){
 assert.equal(tile.userData.physicalCollider,false);
 const bounds=new THREE.Box3().setFromObject(tile);
 assert.ok(Number.isFinite(bounds.min.x)&&Number.isFinite(bounds.min.z));
 assert.ok(bounds.max.x-bounds.min.x>100&&bounds.max.z-bounds.min.z>100);
}
assert.equal(scene.getObjectByName(originalRoom.name),originalRoom);
assert.equal(scene.getObjectByName(authorExterior.name),authorExterior);
assert.equal(originalRoom.parent,scene);
assert.equal(authorExterior.parent,scene);
assert.equal(town.trafficState().length,0);
assert.doesNotThrow(()=>town.update(0,0,false));
assert.equal(town.group.getObjectByName('writer-block-source-aligned-streets'),undefined);
const world=read('web/world.js');
assert.match(world,/clampCivitaTarget/);
assert.match(world,/city-civita-main-20261110-v2/);
assert.match(world,/writerInteriorWorldRoot\.add\(baseWriterRoomShell\)/);
const pubPin=resolve(root,'.github/citizens-assets/town.js');
if(existsSync(pubPin))assert.equal(readFileSync(pubPin,'utf8'),read('web/town.js'),'public Pages town pin drift');
console.log('CIVITA-MAIN-TOWN-OK: sourced map is the default; protected room remains separately owned; no Tehran geometry attached');
