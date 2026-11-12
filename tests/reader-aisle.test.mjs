import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const source=await fs.readFile(new URL('../web/library-aisle.js',import.meta.url),'utf8');
const {packBooks}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('no phantom cabinet for an empty or exactly full catalog',()=>{
 assert.deepEqual(packBooks([],100,3),{placements:[],count:1});
 assert.equal(packBooks(Array(6).fill(45),95,3).count,1);
 assert.equal(packBooks(Array(7).fill(45),95,3).count,2);
});
test('real measured widths retain order, bounds and exclusive space',()=>{
 for(const available of [182,254,400,560])for(const size of [1,3,29,100,400]){
  const widths=Array.from({length:size},(_,i)=>26+(i*37)%80);
  const result=packBooks(widths,available);
  assert.equal(result.placements.length,size);
  result.placements.forEach((p,i)=>{assert.equal(p.index,i);assert.equal(p.width,widths[i]);assert.ok(p.x+p.width<=available+.01);assert.ok(p.row>=0&&p.row<3);if(i){const last=result.placements[i-1];if(last.cabinet===p.cabinet&&last.row===p.row)assert.ok(p.x>=last.x+last.width+5);}});
 }
});
test('invalid geometry fails explicitly rather than discarding catalog entries',()=>{
 assert.throws(()=>packBooks([0],100),RangeError);assert.throws(()=>packBooks([101],100),RangeError);assert.throws(()=>packBooks([30],NaN),RangeError);assert.throws(()=>packBooks([30],100,0),RangeError);
});
test('canonical source and Pages entrypoint use the same modules',async()=>{
 const html=await fs.readFile(new URL('../web/read.html',import.meta.url),'utf8');
 const page=await fs.readFile(new URL('../read/index.html',import.meta.url),'utf8').catch(()=>null);
 assert.match(html,/data-library-layout="aisles"/);assert.match(html,/library-aisle\.css\?v=aisles-20261112-v1/);assert.match(html,/library-aisle\.js\?v=aisles-20261112-v1/);
 if(page)assert.equal(page,html.replaceAll('href="/web/','href="../web/').replaceAll('src="/web/','src="../web/').replaceAll('href="/"','href="../"'));
});
test('the old optional view has one canonical destination and no embedded duplicate app',async()=>{
 const legacy=await fs.readFile(new URL('../web/interaction-library/index.html',import.meta.url),'utf8');
 assert.match(legacy,/location\.replace\(target.href\)/);assert.match(legacy,/target.search=location.search/);assert.match(legacy,/target.hash=location.hash/);assert.doesNotMatch(legacy,/<iframe|createElement\(['"]iframe/);
 assert.match(legacy,/href="\.\.\/\.\.\/read\/"/);
});
test('scoped catalog styling never overrides the reading book or page transforms',async()=>{
 const css=await fs.readFile(new URL('../web/library-aisle.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/\.book(?:\s|\{|\.)|\.b3d|\.stage\s*\{/);
 assert.match(css,/prefers-reduced-motion/);assert.match(css,/\.c-title\{position:static/);
});
