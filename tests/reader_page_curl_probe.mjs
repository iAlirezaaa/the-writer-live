/* The maths of a turning page and of the shelf-to-page journey. Usage: node tests/reader_page_curl_probe.mjs */
import assert from 'node:assert/strict';
import {bendAngles,angleFromPointer,shouldCommit} from '../web/page-curl.js';
import {stagePoses} from '../web/library-stage.js';

// A flat page has no bend, whatever the curl.
assert.deepEqual(bendAngles(0,60,6),[0,0,0,0,0,0]);
assert.deepEqual(bendAngles(180,60,6).map(a=>Math.round(a)),[180,180,180,180,180,180]);
// Mid-turn the free edge leads the spine side, and nothing leaves 0-180.
const mid=bendAngles(90,60,10);
assert.ok(mid.at(-1)>mid[0]);
for(let i=1;i<mid.length;i++)assert.ok(mid[i]>=mid[i-1],'the sheet bends one way');
for(const t of [1,45,179])for(const a of bendAngles(t,120,14))assert.ok(a>=0&&a<=180);
// Backward turns use negative curl and lead the other way.
const back=bendAngles(90,-60,10);assert.ok(back.at(-1)<back[0]);
// The pointer: left edge flat, spine upright, right edge landed; out of range clamps.
assert.equal(Math.round(angleFromPointer(1)),0);assert.equal(Math.round(angleFromPointer(0)),90);assert.equal(Math.round(angleFromPointer(-1)),180);assert.equal(Math.round(angleFromPointer(7)),0);
// Release: past the point of no return completes; a flick decides against position.
assert.equal(shouldCommit(120,0,true),true);assert.equal(shouldCommit(30,0,true),false);
assert.equal(shouldCommit(30,400,true),true);assert.equal(shouldCommit(120,-400,true),false);
assert.equal(shouldCommit(60,0,false),true);assert.equal(shouldCommit(150,0,false),false);assert.equal(shouldCommit(150,-400,false),true);

// Assert physical geometry, not a particular transform string. CSS scale(s)
// leaves Z unscaled; a sideways spine therefore used to jump in thickness.
const decode=pose=>{
 const t=/translate3d\(([^)]+)\)/.exec(pose)[1].split(',').map(parseFloat);
 const s=/scale3d\(([^)]+)\)/.exec(pose)[1].split(',').map(Number);
 return {x:t[0],y:t[1],z:t[2],sx:s[0],sy:s[1],sz:s[2]};
};
const near=(a,b)=>assert.ok(Math.abs(a-b)<.01,`${a} != ${b}`);
for(const faceOut of [false,true])for(const view of [{w:1600,h:1150},{w:375,h:812},{w:812,h:375}]){
 const spine={x:80,y:120,w:faceOut?136:53,h:200};
 const page={x:24,y:64,w:view.w<1060?view.w-64:540,h:Math.max(200,view.h-140)},depth=64;
 const p=stagePoses({spine,page,single:view.w<1060,view,depth,faceOut});
 const start=decode(p.shelf),held=decode(p.held),end=decode(p.open),W=p.modelWidth,H=page.h;
 assert.ok(p.shelf.includes(`rotateY(${faceOut?0:-90}deg)`));
 near(start.sy*H,spine.h);
 near(faceOut?start.sx*W:start.sz*depth,spine.w);
 near(start.x+W/2,spine.x+spine.w/2);near(start.y+H/2,spine.y+spine.h/2);
 near(start.z+(faceOut?depth*start.sz/2:W*start.sx/2),0);
 near(held.sx,held.sy);near(W/H,.68);
 assert.ok(W*held.sx<=view.w*.78+.01&&H*held.sy<=view.h*.76+.01);
 near(end.x+W/2-W*end.sx/2,page.x);near(end.y,page.y);
 near(W*end.sx,page.w);near(H*end.sy,page.h);near(end.z+depth/2,0);
 // The page clone adapter cancels the root's opening X scale.
 near(end.sx*(W/page.w),1);
}
console.log('READER-PAGE-CURL-OK; SELECTION-GEOMETRY-6-CASES-OK');
