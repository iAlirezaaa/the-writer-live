'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reader-preview-artifacts');
async function load(page,{count,delay=false}={}){
 let stories;
 try{const catalog=JSON.parse(await fs.readFile(path.join(root,'snapshot/stories.json'),'utf8'));stories=await Promise.all(catalog.map(s=>fs.readFile(path.join(root,`snapshot/stories/${s.id}.json`),'utf8').then(JSON.parse)));}
 catch(e){if(e.code!=='ENOENT')throw e;stories=Array.from({length:3},(_,i)=>({id:`preview-qa-${i}`,title:`کتاب آزمایشی ${i+1}`,words:500,created:`2026-11-0${i+1}`,stage:'داستان کوتاه',status:'accepted',body:'# عنوان\n\nاین نمونهٔ متن واقعیِ دادهٔ آزمایش است.'}));}
 if(count!=null)stories=Array.from({length:count},(_,i)=>({...stories[i%stories.length],key:`test-${i}`,id:count>3?`test-${i}`:stories[i].id}));
 const names=['read.js','book.js','book-cover.js','library-stage.js','snapshot.js','feedback.js','persian-display.js','reader-position.js','page-curl.js','library-preview.js'];
 const files=Object.fromEntries(await Promise.all(names.map(async n=>[n,await fs.readFile(path.join(root,'web',n),'utf8')])));
 // A parallel, compatible reader change may add an editorial module.
 try{files['reader-editorial.js']=await fs.readFile(path.join(root,'web/reader-editorial.js'),'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
 let html=(await fs.readFile(path.join(root,'web/read.html'),'utf8')).replace(/<link\b[^>]*>/g,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
 const css=await Promise.all(['style.css','book.css','library.css','reader-room.css','library-preview.css'].map(async n=>(await fs.readFile(path.join(root,'web',n),'utf8')).replace(/@font-face\s*\{[^}]*\}|@import\s+url\([^)]*\)\s*;/g,'')));
 await page.setContent(html.replace('</head>',`<style>${css.join('\n')}</style></head>`));
 await page.evaluate(async({files,stories,delay})=>{
  const store=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});history.replaceState=()=>{};window.previewRequests=[];
  window.fetch=async()=>({ok:true,json:async()=>({likes:0,dislikes:0})});
  files['snapshot.js']=`export function isGitHubPages(){return true;} export function appHref(p){return p;} export async function getJSON(p){const s=${JSON.stringify(stories)};if(p==='/api/stories')return s.map(({body,...x})=>x);if(p.endsWith('/comments'))return [];const id=decodeURIComponent(p.split('/').pop());window.previewRequests.push(id);${delay?"await new Promise(r=>setTimeout(r,id===s[0]?.id?650:20));":''}return s.find(v=>String(v.id)===id);}`;
  const urls={};function url(name){if(urls[name])return urls[name];const code=files[name].replace(/from\s+["']\.\/([^"']+)["']/g,(_,p)=>'from '+JSON.stringify(url(p.split('?')[0])));return urls[name]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));}
  await import(url('read.js'));await import(url('library-preview.js'));
 },{files,stories,delay});
 await page.waitForFunction(()=>document.querySelector('.reading-empty')||document.querySelector('.shelf-book'));
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 return stories;
}
async function checkFit(page){const b=await page.locator('#library-preview').boundingBox(),v=page.viewportSize();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=v.width+1&&b.y+b.height<=v.height+1,JSON.stringify({b,v}));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
async function main(){
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});const report={cases:[],fixture:'Production DOM/CSS/modules; public catalog where present, in-memory API and offline fonts. HTTP navigation covered separately.'};
 async function run(name,options,fn){if(process.env.READER_PREVIEW_CASE&&!name.includes(process.env.READER_PREVIEW_CASE))return;console.log('START',name);const page=await browser.newPage(options),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));try{await fn(page);assert.deepEqual(errors,[]);report.cases.push({name,status:'passed'});console.log('PASS',name);}catch(e){report.cases.push({name,status:'failed',error:String(e.stack||e),errors});console.error('FAIL',name,e);await page.screenshot({path:path.join(out,name+'-failure.png')}).catch(()=>{});}finally{await page.close();}}
 try{
 for(const [width,height,touch] of [[1440,1000,false],[768,1024,true],[375,812,true],[812,375,true]])for(const theme of ['dark','light']){
  await run(`${width}-${height}-${theme}`,{viewport:{width,height},hasTouch:touch},async page=>{
   const stories=await load(page);assert.equal(await page.evaluate(()=>window.previewRequests.length),0,'no eager manuscripts');
   if(theme==='light')await page.locator('#library-theme').click();
   await page.locator('#library-preview-toggle').click();await page.waitForFunction(()=>!document.querySelector('.preview-summary').textContent.includes('در حال دریافت'));
   assert.ok(await page.locator('.preview-excerpt').textContent());await checkFit(page);
   await page.locator('#library-preview').evaluate(n=>Promise.all(n.getAnimations().map(a=>a.finished.catch(()=>{}))));await page.screenshot({path:path.join(out,`${width}-${height}-${theme}.png`)});
   await page.locator('.preview-nav').last().click();await page.waitForFunction(()=>!document.querySelector('.preview-summary').textContent.includes('در حال دریافت'));
   assert.equal(await page.locator('.preview-counter').textContent(),'۲ از ۳');await checkFit(page);
   await page.keyboard.press('Escape');assert.equal(await page.locator('#library-preview').isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'library-preview-toggle');
   await page.locator('#library-preview-toggle').click();await page.locator('.preview-read').click();
   await page.waitForFunction(()=>document.querySelector('.book-overlay:not(.book-entering)')&&!document.querySelector('.stage'));
   assert.equal(await page.locator('#library-preview').isVisible(),false);await page.locator('.reader-close').click();await page.waitForFunction(()=>document.querySelector('.book-overlay').hidden);
  });
 }
 await run('hover-keyboard',{viewport:{width:1440,height:1000}},async page=>{
  await load(page);await page.locator('.shelf-book .cover').first().hover();await page.locator('#library-preview').waitFor({state:'visible'});await page.locator('.preview-read').hover();await page.waitForTimeout(320);assert.ok(await page.locator('#library-preview').isVisible(),'pointer reaches card');await page.keyboard.press('Escape');
  await page.locator('.shelf-book .cover').first().focus();await page.keyboard.press('i');await page.locator('.preview-close').waitFor();assert.ok(await page.locator('.preview-close').evaluate(n=>n===document.activeElement));await page.keyboard.press('Escape');assert.ok(await page.locator('.shelf-book .cover').first().evaluate(n=>n===document.activeElement));
 });
 await run('stale-response',{viewport:{width:1440,height:1000}},async page=>{const s=await load(page,{delay:true});await page.locator('#library-preview-toggle').click();await page.locator('.preview-nav').last().click();const second=await page.locator('.preview-title').textContent();await page.waitForFunction(()=>!document.querySelector('.preview-summary').textContent.includes('در حال دریافت'));const content=await page.locator('.preview-summary').textContent();await page.waitForTimeout(900);assert.equal(await page.locator('.preview-title').textContent(),second);assert.equal(await page.locator('.preview-summary').textContent(),content,'slow prior request cannot replace the newer synopsis');assert.ok(!(await page.locator('.preview-summary').textContent()).includes('در حال دریافت'));});
 await run('reduced-motion',{viewport:{width:375,height:812},hasTouch:true,reducedMotion:'reduce'},async page=>{await load(page);await page.locator('#library-preview-toggle').click();await page.waitForTimeout(120);assert.equal(await page.locator('#library-preview').evaluate(n=>n.getAnimations().length),0);await checkFit(page);});
 for(const count of [0,1,100])await run(`catalog-${count}`,{viewport:{width:375,height:812},hasTouch:true},async page=>{await load(page,{count});assert.equal(await page.locator('.shelf-book').count(),count);assert.equal(await page.locator('#library-preview-toggle').isDisabled(),count===0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(count){await page.locator('#library-preview-toggle').click();await checkFit(page);await page.keyboard.press('Escape');}if(count===100)assert.ok(await page.locator('#covers').evaluate(n=>n.offsetHeight>600),'real books grow shelves');});
 if(process.env.CAPTURE_READER_REFERENCE==='1'){
  const p=await browser.newPage({viewport:{width:1440,height:1000}});try{await p.goto('https://library.jjangik.kr/',{waitUntil:'domcontentloaded',timeout:20000});await p.waitForTimeout(3500);await p.screenshot({path:path.join(out,'reference-desktop.png'),fullPage:true});await fs.writeFile(path.join(out,'reference-dom.txt'),await p.locator('body').innerText());report.reference='Captured landing only; no interaction or pixel parity claim.';}catch(e){report.reference=String(e.message);}finally{await p.close();}
 }
 }finally{await browser.close();report.passed=report.cases.filter(x=>x.status==='passed').length;report.failed=report.cases.length-report.passed;await fs.writeFile(path.join(out,'summary.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify({passed:report.passed,failed:report.failed}));if(report.failed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
