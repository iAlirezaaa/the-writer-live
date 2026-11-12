import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const cover=await fs.readFile(new URL('../web/book-cover.js',import.meta.url),'utf8');
const {registerCoverScene,applyCoverVisual}=await import('data:text/javascript;base64,'+Buffer.from(cover).toString('base64'));
const element=()=>({dataset:{},style:{values:new Map(),setProperty(k,v){this.values.set(k,v)},removeProperty(k){this.values.delete(k)}}});
test('verified artwork is shared without mutating story data',()=>{
 const story=Object.freeze({id:'qa',title:'کتاب',status:'accepted',body:'متن تاییدشده'});
 registerCoverScene(story,'/web/reader-illustrations/qa.svg');
 const shelf=element(),stage=element();applyCoverVisual(shelf,story);applyCoverVisual(stage,{...story});
 assert.equal(shelf.dataset.coverScene,'verified');assert.equal(stage.style.values.get('--cover-scene'),shelf.style.values.get('--cover-scene'));
});
test('changed manuscript or metadata uses the honest procedural cover',()=>{
 for(const story of [{id:'qa',title:'کتاب',status:'accepted',body:'متن عوض‌شده'},{id:'qa',title:'عنوان دیگر',status:'accepted',body:'متن تاییدشده'},{id:'qa',title:'کتاب',status:'rejected',body:'متن تاییدشده'}]){
  const target=element();applyCoverVisual(target,story);assert.equal(target.dataset.coverScene,undefined);assert.equal(target.style.values.has('--cover-scene'),false);
 }
});
test('presentation gates original story art and preserves book button identity',async()=>{
 const js=await fs.readFile(new URL('../web/library-atmosphere.js',import.meta.url),'utf8');
 assert.match(js,/art\.verified/);assert.match(js,/full\?\.status!==story\.status/);
 assert.match(js,/capture:true/);assert.match(js,/book-open/);assert.match(js,/writer:reading-closed/);
 assert.doesNotMatch(js,/createElement\(['"]button|innerHTML|setInterval/);
});
test('new room has static lighting and no edits to physical page geometry',async()=>{
 const css=await fs.readFile(new URL('../web/library-atmosphere.css',import.meta.url),'utf8');
 assert.match(css,/prefers-reduced-motion/);assert.doesNotMatch(css,/animation:.*infinite|backdrop-filter|filter:\s*blur/);
 assert.doesNotMatch(css,/\.book\s*\{|\.stage\s*\{|\.b3d\s*\{|\.page\s*\{/);
});
test('both entrypoints load the same room and review the shared cover alias',async()=>{
 const html=await fs.readFile(new URL('../web/read.html',import.meta.url),'utf8');
 assert.ok(html.indexOf('/web/library-atmosphere.js?')<html.indexOf('/web/library-aisle.js?'));
 const map=JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);
 assert.equal(map.imports['../web/book-cover.js?v=reader-20261109-v7'],'../web/book-cover.js?v=room-20261112-v1');
 const page=await fs.readFile(new URL('../read/index.html',import.meta.url),'utf8').catch(()=>null);
 if(page)assert.equal(page,html.replaceAll('href="/web/','href="../web/').replaceAll('src="/web/','src="../web/').replaceAll('href="/"','href="../"'));
});
test('public candidate contains exactly reviewed atmosphere bytes',{skip:process.env.READER_PUBLIC_CHECK!=='1'},async()=>{
 const {createHash}=await import('node:crypto');
 const manifest=JSON.parse(await fs.readFile(new URL('../.github/live-sync-manifest.json',import.meta.url),'utf8'));
 const assets=manifest.reader_atmosphere_assets;
 assert.deepEqual(Object.keys(assets).sort(),['web/book-cover.js','web/library-atmosphere.css','web/library-atmosphere.js']);
 for(const [name,hash]of Object.entries(assets))assert.equal(createHash('sha256').update(await fs.readFile(new URL('../'+name,import.meta.url))).digest('hex'),hash,name);
});
