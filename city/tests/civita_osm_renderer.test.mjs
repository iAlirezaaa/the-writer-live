import assert from 'node:assert/strict';
import {test} from 'node:test';
import {attachCivitaVectors} from '../../web/civita-osm-render.js';
class Group{constructor(){this.children=[];this.userData={};}add(n){this.children.push(n);}}
class MeshStandardMaterial{constructor(x){this.options=x;}}
class LineBasicMaterial{constructor(x){this.options=x;}}
class Shape{constructor(pts){this.points=pts;}}
class ExtrudeGeometry{constructor(shape,config){this.shape=shape;this.config=config;}rotateX(angle){this.rotationX=angle;}}
class Vector2{constructor(x,y){this.x=x;this.y=y;}}
class Vector3{constructor(x,y,z){this.x=x;this.y=y;this.z=z;}}
class BufferGeometry{setFromPoints(pts){this.points=pts;return this;}}
class Mesh{constructor(geometry,materials){this.geometry=geometry;this.materials=materials;this.position={set(...xyz){this.xyz=xyz;}};this.userData={};}}
class Line extends Mesh{}
const THREE={Group,MeshStandardMaterial,LineBasicMaterial,Shape,ExtrudeGeometry,Vector2,Vector3,BufferGeometry,Mesh,Line};
const poly=[{lat:42.6275,lon:12.1135},{lat:42.6275,lon:12.1136},{lat:42.6276,lon:12.1136},{lat:42.6276,lon:12.1135},{lat:42.6275,lon:12.1135}];
test('built snapshot loads before Overpass and preserves OSM IDs',async()=>{
 const source={source:{url:'https://api.openstreetmap.org/api/0.6/map?bbox=1',license:'ODbL-1.0',acquired_at:'2026-11-10T09:00:00Z'},elements:[
  {type:'way',id:101,tags:{building:'yes'},geometry:poly},
  {type:'way',id:102,tags:{highway:'footway'},geometry:poly.slice(0,2)}
 ]};
 let called=0;
 const before=globalThis.fetch;globalThis.fetch=async(url,opts)=>{
  called++;assert.match(url,/civita-osm-snapshot\.json$/);assert.ok(opts.signal);
  return {ok:true,text:async()=>JSON.stringify(source)};
 };
 try{
  const scene=new Group(),out=await attachCivitaVectors(THREE,scene);
  assert.equal(called,1);assert.equal(scene.children.length,1);
  assert.equal(out.layer.children.length,2);
  assert.equal(out.layer.userData.buildingFootprintCount,1);
  assert.equal(out.layer.userData.sourceMode,'static-licensed-snapshot');
  assert.equal(out.layer.userData.acquiredAt,'2026-11-10T09:00:00Z');
  assert.equal(out.layer.children[0].userData.heightProxy,true);
  assert.equal(out.layer.children[0].userData.physicalCollider,false);
  assert.equal(out.layer.children[1].userData.roadWidthM,null);
  assert.equal(out.layer.children[0].geometry.rotationX,-Math.PI/2);
 }finally{globalThis.fetch=before;}
});
test('missing snapshot permits one live fallback, never invented geometry',async()=>{
 const source={elements:[{type:'way',id:101,tags:{building:'yes'},geometry:poly}]},requested=[];
 const before=globalThis.fetch;globalThis.fetch=async(url)=>{
  requested.push(url);
  if(url.includes('civita-osm-snapshot.json'))return {ok:false,status:404};
  assert.match(url,/overpass-api\.de/);return {ok:true,text:async()=>JSON.stringify(source)};
 };
 try{
  const scene=new Group(),out=await attachCivitaVectors(THREE,scene);
  assert.equal(requested.length,2);assert.equal(out.layer.children.length,1);
  assert.equal(out.layer.userData.sourceMode,'live-overpass-fallback');
 }finally{globalThis.fetch=before;}
});
test('network outage cannot fabricate unsourced geometry',async()=>{
 const before=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('offline');};
 try{const scene=new Group();const out=await attachCivitaVectors(THREE,scene);assert.match(out.error,/offline/);assert.equal(out.layer.children.length,0);}
 finally{globalThis.fetch=before;}
});
