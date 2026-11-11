/* MAYOR-081: regression for the two owner-reported city rendering defects.
 * 1. OSM massing must be OPAQUE (owner: "شهر با ساختمونایی با opacity کم ساخته شده").
 * 2. The sky dome must be a pure background (render first, no depth test) so it
 *    can never bury city geometry lying between dome radius and camera.far.
 * Real Three.js geometry runs through the real attachCivitaVectors code path
 * against the local licensed OSM snapshot fixture.
 * Usage: node --experimental-vm-modules tests/civita_render_materials_probe.mjs [site-root]
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createContext,SourceTextModule} from 'node:vm';
const root=resolve(process.argv[2]||'.');
const read=p=>readFileSync(resolve(root,p),'utf8');
const THREE=await import('data:text/javascript;base64,'+Buffer.from(read('web/vendor/three.module.js')).toString('base64'));
const fixture=read('web/data/civita-osm-snapshot.json');
const context=createContext({
 console,Date,performance,URL,AbortController,setTimeout,clearTimeout,
 fetch:async()=>({ok:true,status:200,text:async()=>fixture,json:async()=>JSON.parse(fixture)}),
});
const modules=new Map();
function load(path){
 if(modules.has(path))return modules.get(path);
 const module=new SourceTextModule(readFileSync(path,'utf8'),{context,identifier:path});
 modules.set(path,module);return module;
}
const mod=load(resolve(root,'web/civita-osm-render.js'));
await mod.link((specifier,referencing)=>{
 assert.ok(specifier.startsWith('./'),'No remote ESM code: '+specifier);
 return load(resolve(dirname(referencing.identifier),specifier.split('?')[0]));
});
await mod.evaluate();
const {layer,error,buildings}=await mod.namespace.attachCivitaVectors(THREE,new THREE.Scene(),{onStatus(){}});
assert.ok(!error,'OSM render path reported: '+error);
assert.ok(buildings.length>=10,'Expected the sourced building set, got '+buildings.length);
const meshes=layer.children.filter(o=>o.isMesh);
assert.equal(meshes.length,buildings.length,'Every building must be a mesh');
const materials=new Set();
for(const mesh of meshes)for(const m of [].concat(mesh.material))materials.add(m);
assert.ok(materials.size>=2,'Expected wall+top material set, got '+materials.size);
for(const m of materials){
 assert.equal(m.transparent,false,'Building material must be opaque');
 assert.equal(m.opacity,1,'Building material opacity must be 1');
 assert.notEqual(m.depthWrite,false,'Building material must write depth');
}
const world=read('web/world.js');
assert.ok(world.includes('sky.renderOrder = -1e3'),'Dome must render first');
assert.ok(world.includes('sky.material.depthTest = false'),'Dome must never depth-test city geometry');
assert.ok(world.includes('sky.frustumCulled = false'),'Dome must never be frustum-culled');
assert.ok(world.includes('skyGroup.position.copy(camera.position)'),'Dome stays camera-anchored');
console.log('CIVITA-RENDER-MATERIALS-OK',JSON.stringify({
 buildingMeshes:meshes.length,opaqueMaterials:materials.size,
 domeRenderOrder:-1e3,provenance:layer.userData.sourceMode
}));
