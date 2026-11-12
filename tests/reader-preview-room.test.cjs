'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..'),mod=import('../web/library-preview.js');
test('unknown or changed manuscripts cannot receive original illustrations',async()=>{
 const {previewContent}=await mod;
 for(const id of ['unknown','0003','0005','owner-20261110-jaye-doxt']){
  const item=previewContent({id,title:'تغییر',status:'accepted',body:'متن تغییرکرده'});
  assert.equal(item.image,'');assert.equal(item.alt,'');assert.equal(item.verified,false);
 }
});
test('each authorized revision keeps its synopsis, illustration and Persian alternative text together',async t=>{
 let catalog;try{catalog=JSON.parse(await fs.readFile(path.join(root,'snapshot/stories.json'),'utf8'));}catch(e){if(e.code==='ENOENT'){t.skip('Public export is verified on the live candidate.');return;}throw e;}
 const {previewContent}=await mod;
 for(const item of catalog){
  const story=JSON.parse(await fs.readFile(path.join(root,'snapshot/stories',`${item.id}.json`),'utf8'));
  const data=previewContent(story);if(!data.verified)continue;
  assert.ok(data.image.endsWith('.svg'));assert.ok(data.alt.length>12);assert.ok(data.summary.length>150);
  await fs.access(path.join(root,'web/reader-illustrations',data.image));
  for(const change of [{body:story.body+' تغییر'},{title:'تغییر'},{status:'withdrawn'}]){
   const stale=previewContent({...story,...change});assert.equal(stale.image,'');assert.equal(stale.summary,'');
  }
 }
});
test('decorative architecture is isolated from real catalog and reader geometry',async()=>{
 const s=await fs.readFile(path.join(root,'web/library-preview.js'),'utf8');
 assert.ok(s.includes("detail.setAttribute('aria-hidden','true')"));
 assert.ok(s.includes('item.offsetTop>4'));assert.ok(!/insertAdjacentHTML|\.innerHTML\s*=|eval\(/.test(s));
 assert.ok(s.includes('current!==token'));assert.ok(s.includes("scene.loading='lazy'"));
 assert.ok(s.includes("scene.removeAttribute('src')"));assert.ok(s.includes("node('details','preview-sample')"));
});
test('room and discovery styling preserve narrow, landscape and reduced-motion paths',async()=>{
 const css=await fs.readFile(path.join(root,'web/library-preview.css'),'utf8');
 for(const token of ['max-width:640px','max-height:480px','prefers-reduced-motion:reduce','.case-still-life[hidden]','.preview-scene[hidden]'])assert.ok(css.includes(token),token);
 assert.ok(css.includes('min-height:calc((var(--row-h) + var(--plank))*2)'));
});
