'use strict';
// Real browser/layout, actual production HTML/CSS/modules, in-memory synthetic
// story API and offline fonts. No server, credentials or publication writes.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const out=path.resolve(process.env.READER_SELECTION_ARTIFACTS||path.join(root,'reader-browser-artifacts/selection-geometry'));
const sentence='صبح زود، نور از پنجره به اتاق رسید. دختر کتاب را روی میز گذاشت و به صدای قدم‌ها گوش داد. پشت در کسی منتظر پاسخ بود، اما او هنوز جملهٔ آخر نامه را نخوانده بود.';
const stories=Array.from({length:16},(_,i)=>({id:`qa-${i}`,title:`کتاب چراغ آبی ${i+1}`,stage:'داستان کوتاه',status:'accepted',score:9,threshold:8,words:i===1?80:1700,created:'2026-11-12T08:00:00Z',body:Array(24).fill(sentence).join('\n\n'),check:''}));
const box=async(page,selector)=>page.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
function near(actual,expected,label){for(const key of ['x','y','width','height'])assert.ok(Math.abs(actual[key]-expected[key])<=1,`${label}.${key}: ${actual[key]} != ${expected[key]}`);}
async function frames(page){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function animation(page,cls,index,finish=false){
 await page.waitForFunction(({cls,index})=>window.qaAnimations.filter(v=>v.cls===cls).length>index,{cls,index});
 if(finish)await page.evaluate(({cls,index})=>window.qaAnimations.filter(v=>v.cls===cls)[index].a.finish(),{cls,index});
 await frames(page);
}
async function load(page){
 let html=await fs.readFile(path.join(root,'web/read.html'),'utf8');
 html=html.replace(/<link\b[^>]*>/g,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
 const css=await Promise.all(['style.css','book.css','library.css','reader-room.css'].map(async name=>(await fs.readFile(path.join(root,'web',name),'utf8')).replace(/@font-face\s*\{[^}]*\}|@import\s+url\([^)]*\)\s*;/g,'')));
 await page.setContent(html.replace('</head>',`<style>${css.join('\n')}</style></head>`));
 const names=['read.js','book.js','book-cover.js','library-stage.js','snapshot.js','feedback.js','persian-display.js','reader-position.js','page-curl.js','reader-editorial.js'];
 const files=Object.fromEntries(await Promise.all(names.map(async name=>[name,await fs.readFile(path.join(root,'web',name),'utf8')])));
 await page.evaluate(async({files,stories})=>{
  const memory=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}});
  window.fetch=async url=>({ok:true,json:async()=>String(url).endsWith('/votes')?{likes:0,dislikes:0}:[]});
  // about:blank has no HTTP origin: URL/history behavior is covered by the
  // separate HTTP regression suite, not this in-memory geometry fixture.
  history.replaceState=()=>{};
  window.qaSelectionBox=null;const rect=Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect=function(){const r=rect.call(this);if(!window.qaSelectionBox&&this.matches('.shelf-book > .cover')&&document.querySelector('.stage'))window.qaSelectionBox={x:r.x,y:r.y,width:r.width,height:r.height};return r;};
  window.qaAnimations=[];const animate=Element.prototype.animate;
  Element.prototype.animate=function(...args){const a=animate.apply(this,args);if(['b3d','b3d-cover','stage-dim','stage'].some(c=>this.classList.contains(c))){a.pause();window.qaAnimations.push({a,cls:this.classList[0]});}return a;};
  files['snapshot.js']=`export function isGitHubPages(){return false;} export function appHref(p){return p;} export async function getJSON(p){const s=${JSON.stringify(stories)};return p==='/api/stories'?s:p.endsWith('/comments')?[]:s.find(v=>v.id===decodeURIComponent(p.split('/').pop()));}`;
  const urls={};function moduleURL(name){if(urls[name])return urls[name];const code=files[name].replace(/from\s+["']\.\/([^"']+)["']/g,(_,p)=>'from '+JSON.stringify(moduleURL(p.split('?')[0])));return urls[name]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));}
  await import(moduleURL('read.js'));
 },{files,stories});
 await page.locator('.shelf-book .cover').first().waitFor();
}
async function openedParity(page,label){
 const single=await page.locator('.book').evaluate(n=>n.classList.contains('single'));
 const pairs=[['.b3d-inner > .page',single?'.book > .page-right':'.book > .page-left']];
 if(!single)pairs.push(['.b3d-inside > .page','.book > .page-right']);
 const result=[];
 for(const [clone,real]of pairs){const a=await box(page,clone),b=await box(page,real);near(a,b,label);result.push({clone:a,real:b});}
 return result;
}
async function main(){
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 const report={browser:browser.version(),fixture:'Actual production DOM/CSS/modules; synthetic API and offline fonts',cases:[]};
 try{
 for(const [width,height]of [[1280,900],[768,1024],[375,812],[812,375]])for(const index of [0,1]){
  const name=`${width}x${height}-${index?'spine':'face'}`,row={name,errors:[]};report.cases.push(row);
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<1000});page.setDefaultTimeout(8000);
  page.on('pageerror',e=>row.errors.push(e.message));
  try{
   await load(page);const source=page.locator(`.shelf-book[data-key="qa-${index}"] > .cover`);
   await source.scrollIntoViewIfNeeded();await source.hover();
   // Let the genuine shelf hover settle before testing the exact selection handoff.
   await page.waitForTimeout(380);
   await source.click();await animation(page,'b3d',0);
   row.source=await page.evaluate(()=>window.qaSelectionBox);row.initial=await box(page,index?'.b3d-spine':'.b3d-front');near(row.initial,row.source,'selection');
   await page.screenshot({path:path.join(out,name+'-selected.png')});
   await animation(page,'b3d',0,true);await animation(page,'b3d',1,true);await animation(page,'b3d',2);
   await animation(page,'stage-dim',0,true);
   row.held=await box(page,'.b3d-front');
   const aspect=index?.68:row.source.width/row.source.height;
   assert.ok(Math.abs(row.held.width/row.held.height-aspect)<.002,'closed jacket preserves portrait aspect');
   assert.ok(row.held.x>=0&&row.held.y>=0&&row.held.x+row.held.width<=width&&row.held.y+row.held.height<=height,'jacket fits both viewport axes');
   await page.screenshot({path:path.join(out,name+'-held.png')});
   await animation(page,'b3d-cover',0,true);await animation(page,'b3d',2,true);await animation(page,'stage',0);
   row.opened=await openedParity(page,'open page');await page.screenshot({path:path.join(out,name+'-opened.png')});
   await animation(page,'stage',0,true);await page.waitForFunction(()=>!document.querySelector('.stage'));
   await page.evaluate(()=>{window.qaAnimations=[];});await page.locator('.reader-close').click();await animation(page,'b3d',0);
   row.closeStart=await openedParity(page,'close page');
   await animation(page,'b3d-cover',0,true);await animation(page,'b3d',0,true);await animation(page,'b3d',1,true);await animation(page,'b3d',2,true);
   row.returned=await box(page,index?'.b3d-spine':'.b3d-front');near(row.returned,await source.boundingBox(),'return to shelf');
   await page.screenshot({path:path.join(out,name+'-returned.png')});await animation(page,'stage-dim',0,true);
   await page.waitForFunction(()=>!document.querySelector('.stage')&&document.querySelector('.book-overlay').hidden);
   assert.equal(await source.evaluate(n=>getComputedStyle(n).visibility),'visible');
   assert.deepEqual(row.errors,[]);row.status='passed';console.log('PASS',name);
  }catch(error){row.status='failed';row.error=String(error.stack||error);await page.screenshot({path:path.join(out,name+'-failure.png')}).catch(()=>{});console.error('FAIL',name,row.error);}
  finally{await page.close();}
 }
 for(const [width,height]of [[1280,900],[375,812]]){
  const row={name:`${width}x${height}-reduced`,errors:[]};report.cases.push(row);
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce',hasTouch:width<1000});page.setDefaultTimeout(8000);page.on('pageerror',e=>row.errors.push(e.message));
  try{await load(page);await page.locator('.shelf-book .cover').first().click();await page.waitForFunction(()=>document.querySelector('.book-overlay:not(.book-entering)')&&!document.querySelector('.stage'));assert.equal(await page.locator('.b3d').count(),0);await page.locator('.reader-close').click();await page.waitForFunction(()=>document.querySelector('.book-overlay').hidden);assert.deepEqual(row.errors,[]);row.status='passed';console.log('PASS',row.name);}
  catch(e){row.status='failed';row.error=String(e.stack||e);console.error('FAIL',row.name,row.error);}finally{await page.close();}
 }
 }finally{await browser.close();report.passed=report.cases.filter(r=>r.status==='passed').length;report.failed=report.cases.length-report.passed;await fs.writeFile(path.join(out,'summary.json'),JSON.stringify(report,null,2)+'\n');}
 console.log(JSON.stringify({passed:report.passed,failed:report.failed,report:path.join(out,'summary.json')}));
 if(report.failed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
