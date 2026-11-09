/* Verifies licensed Tehran road-centerline preview without changing any city routes.
 * node tests/tehran_writer_block_overlay_probe.mjs [checkout-root]
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const root=resolve(process.argv[2]||".");
const read=(path)=>readFileSync(resolve(root,path),"utf8");
const asUrl=(s)=>"data:text/javascript;base64,"+Buffer.from(s).toString("base64");
const planSource=read("web/urban-plan.js");
const overlaySource=read("web/writer-block-road-preview.js");
const replacement=overlaySource.replace(/"\.\/urban-plan\.js\?v=[^"]+"/,
  JSON.stringify(asUrl(planSource)));
assert.notEqual(replacement,overlaySource,"Preview must use canonical Tehran geo origin");
const plan=await import(asUrl(planSource));
const preview=await import(asUrl(replacement));
const THREE=await import(asUrl(read("web/vendor/three.module.js")));
const ring=preview.writerBlockLocalRing();
assert.equal(ring.length,6);
assert.ok(Math.abs(ring[0].x-ring[5].x)<1e-7&&Math.abs(ring[0].z-ring[5].z)<1e-7);
assert.ok(preview.writerBlockContainsLocalPoint(0,0),"Writer home must be inside block");
assert.ok(!preview.writerBlockContainsLocalPoint(200,200),"Outside-block point is rejected");
assert.ok(Math.abs(preview.writerBlockRingArea()-12265)<5,"Area must match sourced OSM candidate");
assert.deepEqual(preview.WRITER_BLOCK_ROAD_EVIDENCE.wayIds,[4292858,481657106,36697708,36697711]);
assert.match(preview.WRITER_BLOCK_ROAD_EVIDENCE.attribution,/OpenStreetMap/);
assert.match(preview.WRITER_BLOCK_ROAD_EVIDENCE.confidence,/not curbs/);
const parent=new THREE.Group();
const mesh=preview.buildWriterBlockRoadPreview(THREE,parent,{streetY:-3});
assert.equal(parent.children.length,1,"No separate draw calls or scene roots");
assert.equal(mesh.name,"writer-block-osm-centerline-preview");
assert.ok(mesh instanceof THREE.Mesh);
assert.ok(mesh.geometry.attributes.position.count>100);
assert.equal(mesh.material.side,THREE.FrontSide,"One-pass transparent ground trace");
assert.equal(mesh.castShadow,false);
assert.equal(mesh.receiveShadow,false);
assert.equal(mesh.userData.cityMapEvidence.physicalCollider,false);
assert.equal(mesh.userData.cityMapEvidence.physicalRoadWidthKnown,false);
assert.equal(mesh.userData.cityMapEvidence.homeAnchorContained,true);
const bbox=new THREE.Box3().setFromObject(mesh);
assert.ok(bbox.min.x>-125 && bbox.max.x<65 && bbox.min.z>-30 && bbox.max.z<100,
  "Trace must remain inside source-backed block bounding region");
assert.ok(Math.abs(bbox.min.y+2.85)<1e-5&&Math.abs(bbox.max.y+2.85)<1e-5,
  "Overlay is a ground decal, not raised road geometry");
for(const x of mesh.geometry.attributes.position.array)
  assert.ok(Number.isFinite(x),"No NaN/Infinity in road preview");
assert.equal(plan.auditUrbanPlan().ok,true,"Existing writer block street topology stays valid");
mesh.geometry.dispose();mesh.material.dispose();
console.log("TEHRAN-WRITER-BLOCK-OVERLAY-OK",
  JSON.stringify({area:preview.writerBlockRingArea(),vertices:mesh.geometry.attributes.position.count,
    drawMeshes:parent.children.length,source:preview.WRITER_BLOCK_ROAD_EVIDENCE.source}));
