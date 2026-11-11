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
// The journey ends exactly on the reading page, flat, at full size, with its open face at z=0.
const poses=stagePoses({spine:{x:300,y:200,w:40,h:240},page:{x:260,y:66,w:540,h:1000},single:false,view:{w:1600,h:1150},depth:60});
assert.equal(poses.open,'translate3d(260.00px,66.00px,-30.00px) rotateX(0deg) rotateY(0deg) scale(1.0000)');
assert.ok(poses.shelf.includes('rotateY(-90deg)'),'starts spine-on');
assert.ok(Math.abs(poses.scale-.24)<1e-9,'starts at the height of the spine');
console.log('READER-PAGE-CURL-OK');
