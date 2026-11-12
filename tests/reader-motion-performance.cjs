'use strict';
// Actual production modules and DOM. Deterministic work budgets are assertions;
// frame times are observations, not device-independent 60 fps guarantees.
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright');
const {fixture}=require('./reader-aisle-browser.cjs');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.READER_MOTION_ARTIFACTS||path.join(root,'reader-motion-artifacts'));
const baseline=process.env.READER_MOTION_BASELINE==='1';
const check=(value,message)=>{if(!baseline)assert.ok(value,message);};
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
 const report={browser:browser.version(),baseline,fixture:process.env.READER_AISLE_OFFLINE?'Production code with offline services/fonts':'Production HTTP/module fixture, not live CDN',cases:[]};
 async function run(name,viewport,fn){
  const page=await browser.newPage({viewport,hasTouch:viewport.width<900});page.setDefaultTimeout(15000);const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));const row={name};
  try{await fixture(page,100);await fn(page,row,requests);assert.deepEqual(errors,[]);row.status='passed';}
  catch(e){row.status='failed';row.error=String(e.stack||e);console.error(name,e);await page.screenshot({path:path.join(out,name+'-failure.png')}).catch(()=>{});}
  finally{row.errors=errors;report.cases.push(row);console.log(row.status.toUpperCase(),name);await page.close();}
 }
 try{
 for(const [label,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:375,height:812}],['landscape',{width:812,height:375}]]){
  await run(label+'-scroll-and-layout',viewport,async(page,row)=>{
   await page.locator('#aisle-next').click();await page.waitForFunction(()=>document.querySelector('.case').dataset.activeCabinet==='1');await page.waitForTimeout(400);
   row.burst=await page.evaluate(async()=>{
    const nav=document.querySelector('.aisle-navigation'),view=document.querySelector('.case'),shelf=document.querySelector('#covers'),cabinet=shelf.querySelector('.aisle-cabinet'),before=view.scrollLeft;
    const observer=new MutationObserver(()=>{});observer.observe(nav,{subtree:true,childList:true,attributes:true,characterData:true});
    const start=performance.now();for(let i=0;i<120;i++)view.dispatchEvent(new Event('scroll'));
    const synchronousWrites=observer.takeRecords().length,duration=performance.now()-start;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const delayedWrites=observer.takeRecords().length;observer.disconnect();
    for(let i=0;i<20;i++)shelf.dispatchEvent(new CustomEvent('writer:shelf-layout',{cancelable:true}));
    return {synchronousWrites,delayedWrites,duration,cabinetPreserved:cabinet===shelf.querySelector('.aisle-cabinet'),scrollDelta:Math.abs(view.scrollLeft-before)};
   });
   check(row.burst.synchronousWrites===0,'scroll callbacks must not rewrite status on every event');
   check(row.burst.cabinetPreserved,'identical layout must retain cabinet snap targets');
   check(row.burst.scrollDelta<1,'duplicate layout must not interrupt scroll position');
   await page.screenshot({path:path.join(out,label+'-shelf.png')});
   // Nonzero scroll -> real open/return; record the exact geometry-measuring scroll.
   await page.evaluate(()=>{window.qaScrollCalls=[];const original=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(options){if(this.matches?.('.cover'))qaScrollCalls.push(options);return original.call(this,options);};});
   const cover=page.locator('.shelf-book[data-cabinet="1"] > .cover').first();await cover.click();
   await page.waitForFunction(()=>document.querySelector('.book-overlay')&&!document.querySelector('.stage')&&!document.querySelector('.book-overlay').classList.contains('book-entering'));
   await page.locator('.reader-close').click();await page.waitForFunction(()=>document.querySelector('.book-overlay').hidden&&!document.querySelector('.stage'));
   row.returnCalls=await page.evaluate(()=>qaScrollCalls);
   check(row.returnCalls.some(v=>v?.behavior==='instant'&&v.inline==='nearest'),'return destination must be settled before measurement');
   assert.equal(await page.locator('.shelf-book > .cover[style*="visibility: hidden"]').count(),0);
   await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#aisle-next').click();
   await page.waitForTimeout(100);assert.equal(await page.locator('.stage').count(),0);
  });
  await run(label+'-curl-content-and-timing',viewport,async(page,row,requests)=>{
   if(!process.env.READER_AISLE_OFFLINE){
    check(requests.some(u=>u.includes('page-curl.js?v=motion-20261112-v2')),'nested curl cache version must resolve through the HTML import map');
    check(requests.some(u=>u.includes('library-stage.js?v=motion-20261112-v2')),'nested stage version must resolve through the HTML import map');
   }
   await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.cover').first().click();
   await page.waitForFunction(()=>document.querySelector('.book-overlay')&&!document.querySelector('.stage'));
   await page.locator('.book-jump').selectOption({label:'متن داستان'});
   await page.waitForTimeout(100);
   const source=await fs.readFile(path.join(root,'web/page-curl.js'),'utf8');
   row.snapshot=await page.evaluate(async source=>{
    const mod=await import(URL.createObjectURL(new Blob([source],{type:'text/javascript'})));
    const host=document.querySelector('.book'),original=host.querySelector(':scope > .page:has(.page-content.body)'),r=original.getBoundingClientRect(),hr=host.getBoundingClientRect();
    const normalize=s=>s.replace(/\s+/g,' ').trim();
    const oldParagraphs=[...original.querySelectorAll('.page-content.body > p')];
    // Capture each whole line's word bounds before mounting a leaf.
    function words(p){const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT),result=[];let n;while(n=walker.nextNode())for(const w of n.textContent.matchAll(/\S+/gu)){const range=document.createRange();range.setStart(n,w.index);range.setEnd(n,w.index+w[0].length);const rr=range.getBoundingClientRect();result.push({text:w[0],x:rr.x,y:rr.y,w:rr.width,h:rr.height});}return result;}
    const expected=oldParagraphs.map(p=>({text:normalize(p.textContent),words:words(p)}));
    const blank=original.cloneNode(false),start=performance.now();
    const leaf=mod.createLeaf({host,left:r.left-hr.left,top:r.top-hr.top,width:r.width,height:r.height,front:original,back:blank,strips:innerWidth<700?8:14});leaf.set(0,0,0);
    const copy=leaf.element.querySelector('.leaf-front > .page');
    const actual=[...copy.querySelectorAll('.page-content.body > p')];let maxDrift=0;
    actual.forEach((p,i)=>words(p).forEach((w,j)=>{const ref=expected[i].words[j];if(ref)maxDrift=Math.max(maxDrift,Math.abs(w.x-ref.x),Math.abs(w.y-ref.y));}));
    window.qaLeaf=leaf;
    return {constructionMs:performance.now()-start,optimized:actual.filter(p=>p.dataset.curlLines).length,textPreserved:actual.every((p,i)=>normalize(p.textContent)===expected[i].text),sourceUntouched:oldParagraphs.every(p=>!p.dataset.curlLines),maxWordDrift:maxDrift,ariaHidden:leaf.element.getAttribute('aria-hidden')};
   },source);
   check(row.snapshot.optimized>0,'plain justified text must be shaped once, not in every strip');
   assert.ok(row.snapshot.textPreserved&&row.snapshot.sourceUntouched,'original manuscript and copied words unchanged');
   assert.ok(row.snapshot.maxWordDrift<1.25,'static handoff must preserve Persian word positions');
   await page.screenshot({path:path.join(out,label+'-flat-page.png')});
   for(const angle of [45,90,135]){await page.evaluate(angle=>qaLeaf.set(angle,38,0),angle);await page.screenshot({path:path.join(out,label+'-curl-'+angle+'.png')});}
   await page.evaluate(()=>qaLeaf.destroy());await page.emulateMedia({reducedMotion:'no-preference'});
   // Observe a real click, not paused WAAPI. Never gate CI on wall-clock fps.
   const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
   const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(v=>[v.name,v.value]));
   await page.evaluate(()=>{window.qaTimes={frames:[],long:[],running:true};let previous=0;function frame(t){if(!qaTimes.running)return;if(previous)qaTimes.frames.push(t-previous);previous=t;requestAnimationFrame(frame);}requestAnimationFrame(frame);window.qaLong=new PerformanceObserver(list=>qaTimes.long.push(...list.getEntries().map(e=>e.duration)));qaLong.observe({type:'longtask'});});
   const before=await metrics();await page.locator('.turn-next').click();await page.waitForFunction(()=>!document.querySelector('.leaf-curl'));await page.waitForTimeout(80);const after=await metrics();
   row.timing=await page.evaluate(()=>{qaTimes.running=false;qaLong.disconnect();return qaTimes;});
   row.work=Object.fromEntries(['LayoutCount','RecalcStyleCount','LayoutDuration','ScriptDuration','TaskDuration'].map(k=>[k,after[k]-before[k]]));
   await page.locator('.reader-close').click();await page.waitForFunction(()=>document.querySelector('.book-overlay').hidden&&!document.querySelector('.stage'));
   assert.equal(await page.locator('.leaf-curl').count(),0);
  });
 }
 }finally{await browser.close();report.passed=report.cases.filter(v=>v.status==='passed').length;report.failed=report.cases.length-report.passed;await fs.writeFile(path.join(out,'summary.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify({passed:report.passed,failed:report.failed}));if(report.failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
