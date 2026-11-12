'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reader-room-artifacts');
async function load(page,count,{brokenImage=false}={}){
 const catalog=JSON.parse(await fs.readFile(path.join(root,'snapshot/stories.json'),'utf8'));
 let stories=await Promise.all(catalog.map(s=>fs.readFile(path.join(root,'snapshot/stories',`${s.id}.json`),'utf8').then(JSON.parse)));
 if(count!=null)stories=Array.from({length:count},(_,i)=>({...stories[i%stories.length],id:`fixture-${i}`,key:`fixture-${i}`}));
 const names=['read.js','book.js','book-cover.js','library-stage.js','snapshot.js','feedback.js','persian-display.js','reader-position.js','page-curl.js','library-preview.js','reader-editorial.js'];
 const files=Object.fromEntries(await Promise.all(names.map(async n=>[n,await fs.readFile(path.join(root,'web',n),'utf8')])));
 const images={};for(const n of await fs.readdir(path.join(root,'web/reader-illustrations')))if(n.endsWith('.svg'))images[n]='data:image/svg+xml;base64,'+(await fs.readFile(path.join(root,'web/reader-illustrations',n))).toString('base64');
 const css=(await Promise.all(['style.css','book.css','library.css','reader-room.css','library-preview.css'].map(n=>fs.readFile(path.join(root,'web',n),'utf8')))).join('\n').replace(/@font-face\s*\{[^}]*\}|@import\s+url\([^)]*\)\s*;/g,'');
 const html=(await fs.readFile(path.join(root,'web/read.html'),'utf8')).replace(/<link\b[^>]*>/g,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
 await page.setContent(html.replace('</head>',`<style>${css}</style></head>`));
 await page.evaluate(async({files,stories,images})=>{
  const store=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});history.replaceState=()=>{};window.roomRequests=[];
  window.fetch=async()=>({ok:true,json:async()=>({likes:0,dislikes:0})});
  files['snapshot.js']=`export function isGitHubPages(){return true;}export function appHref(p){const images=${JSON.stringify(images)};return images[p.split('/').pop()]||p;}export async function getJSON(p){const s=${JSON.stringify(stories)};if(p==='/api/stories')return s.map(({body,...x})=>x);if(p.endsWith('/comments'))return [];const id=decodeURIComponent(p.split('/').pop());window.roomRequests.push(id);return s.find(v=>String(v.id)===id);}`;
  const urls={};function url(name){if(urls[name])return urls[name];const code=files[name].replace(/from\s+["']\.\/([^"']+)["']/g,(_,p)=>'from '+JSON.stringify(url(p.split('?')[0])));return urls[name]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));}
  await import(url('read.js'));await import(url('library-preview.js'));
 },{files,stories,images:brokenImage?{}:images});
 await page.waitForFunction(()=>document.querySelector('.reading-empty')||document.querySelector('.shelf-book'));
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 return stories;
}
async function fit(page){
 const v=page.viewportSize(),r=await page.locator('#library-preview').boundingBox();
 assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=v.width+1&&r.y+r.height<=v.height+1,JSON.stringify({r,v}));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page overflow');
}
async function main(){
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 const report={fixture:'Production DOM/CSS/modules and authorized public manuscripts/art, mocked API/history/storage and offline fonts. Not a live HTTP or physical-device test.',cases:[]};
 async function run(name,options,fn){
  const page=await browser.newPage(options),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
  try{await fn(page);assert.deepEqual(errors,[]);report.cases.push({name,status:'passed'});console.log('PASS',name);}
  catch(e){report.cases.push({name,status:'failed',error:String(e.stack||e),errors});console.error('FAIL',name,e);await page.screenshot({path:path.join(out,name+'-failed.png')}).catch(()=>{});}
  finally{await page.close();}
 }
 try{
  for(const [width,height,touch]of [[1440,1000,false],[1280,800,false],[768,1024,true],[375,812,true],[320,720,true],[812,375,true]])for(const theme of ['dark','light']){
   await run(`${width}-${height}-${theme}`,{viewport:{width,height},hasTouch:touch},async page=>{
    const stories=await load(page);if(theme==='light')await page.locator('#library-theme').click();
    assert.equal(await page.locator('.shelf-book').count(),stories.length);assert.equal(await page.evaluate(()=>window.roomRequests.length),0,'no eager manuscripts');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.equal(await page.locator('.case-still-life').isHidden(),await page.evaluate(()=>innerHeight<=480||[...document.querySelectorAll('.shelf-book')].some(n=>n.offsetTop>4)),'decor yields to real rows');
    await page.screenshot({path:path.join(out,`${width}-${height}-${theme}-room.png`),fullPage:true});
    await page.locator('#library-preview-toggle').click();await page.waitForFunction(()=>document.querySelector('.preview-summary').dataset.verified==='true');
    if(height>480)await page.waitForFunction(()=>document.querySelector('.preview-scene').naturalWidth>0);
    await fit(page);await page.locator('#library-preview').evaluate(n=>Promise.all(n.getAnimations().map(a=>a.finished.catch(()=>{}))));
    await page.screenshot({path:path.join(out,`${width}-${height}-${theme}-preview.png`)});
    await page.locator('.preview-nav').last().click();assert.equal(await page.locator('.preview-counter').textContent(),'۲ از ۳','next remains clickable after image load');
    await page.locator('.preview-read').click();await page.waitForFunction(()=>document.querySelector('.book-overlay:not(.book-entering)')&&!document.querySelector('.stage'));
    assert.equal(await page.locator('#library-preview').isVisible(),false);await page.locator('.reader-close').click();await page.waitForFunction(()=>document.querySelector('.book-overlay').hidden);
   });
  }
  for(const [width,height]of [[375,812],[768,1024]])await run(`missing-illustration-${width}`,{viewport:{width,height},hasTouch:true},async page=>{
   await load(page,undefined,{brokenImage:true});await page.locator('#library-preview-toggle').click();
   await page.waitForFunction(()=>document.querySelector('.preview-summary').dataset.verified==='true'&&document.querySelector('.preview-scene').hidden);
   await page.locator('#library-preview').evaluate(n=>Promise.all(n.getAnimations().map(a=>a.finished.catch(()=>{}))));
   await fit(page);await page.locator('.preview-nav').last().click();
   assert.equal(await page.locator('.preview-counter').textContent(),'۲ از ۳','missing art cannot move controls between pointer-down and click');
   await page.locator('.preview-nav').first().click();assert.equal(await page.locator('.preview-counter').textContent(),'۱ از ۳');
  });
  for(const count of [0,1,100])await run(`catalog-${count}`,{viewport:{width:375,height:812},hasTouch:true},async page=>{
   await load(page,count);assert.equal(await page.locator('.shelf-book').count(),count);assert.equal(await page.locator('#library-preview-toggle').isDisabled(),count===0);
   assert.equal(await page.locator('.case-still-life').isHidden(),count===0||count===100);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(count){await page.locator('#library-preview-toggle').click();await page.waitForFunction(()=>!document.querySelector('.preview-summary').textContent.includes('در حال دریافت'));assert.equal(await page.locator('.preview-scene').isVisible(),false,'unverified fixture receives no approved art');await fit(page);}
  });
  await run('pinned-keyboard-and-sticky-landscape',{viewport:{width:812,height:375},hasTouch:true},async page=>{
   await load(page);
   await page.locator('#library-preview-toggle').click();
   await page.waitForFunction(()=>document.querySelector('.preview-summary').dataset.verified==='true');
   assert.equal(await page.locator('#library-preview').getAttribute('aria-modal'),'true');
   await fit(page);
   const panel=page.locator('#library-preview'),controls=page.locator('.preview-controls');
   for(const edge of ['top','bottom']){
    if(edge==='bottom')await panel.evaluate(n=>n.scrollTop=n.scrollHeight);
    const r=await controls.boundingBox();
    assert.ok(r.y>=0&&r.y+r.height<=375,JSON.stringify({edge,r}));
   }
   await page.locator('.preview-nav:not(:disabled)').last().focus();
   await page.keyboard.press('Tab');
   assert.equal(await page.evaluate(()=>document.activeElement.className),'preview-close');
   await page.keyboard.press('Shift+Tab');
   assert.ok((await page.evaluate(()=>document.activeElement.className)).includes('preview-nav'));
   await page.keyboard.press('Escape');
   assert.equal(await panel.isHidden(),true);
   assert.equal(await page.locator('#library-preview-toggle').evaluate(n=>document.activeElement===n),true);
   assert.equal(await panel.getAttribute('aria-modal'),null);
  });
  await run('reduced-motion',{viewport:{width:375,height:812},hasTouch:true,reducedMotion:'reduce'},async page=>{await load(page);await page.locator('#library-preview-toggle').click();await page.waitForFunction(()=>document.querySelector('.preview-scene').naturalWidth>0);assert.equal(await page.locator('#library-preview').evaluate(n=>n.getAnimations().length),0);await fit(page);});
  await run('resize-both-directions',{viewport:{width:1440,height:1000}},async page=>{await load(page);await page.locator('#library-preview-toggle').click();await page.waitForFunction(()=>document.querySelector('.preview-summary').dataset.verified==='true');for(const [width,height]of [[320,720],[1440,1000]]){await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await fit(page);assert.equal(await page.locator('.case-still-life').isHidden(),await page.evaluate(()=>[...document.querySelectorAll('.shelf-book')].some(n=>n.offsetTop>4)));}});
 }finally{await browser.close();report.passed=report.cases.filter(c=>c.status==='passed').length;report.failed=report.cases.length-report.passed;await fs.writeFile(path.join(out,'summary.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify({passed:report.passed,failed:report.failed}));if(report.failed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
