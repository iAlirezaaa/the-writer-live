'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reader-aisle-artifacts');
const origin='https://ialirezaaa.github.io',base='/the-writer-live';
async function fixture(page,count){
 const catalog=JSON.parse(await fs.readFile(path.join(root,'snapshot/stories.json'),'utf8'));
 const actual=await Promise.all(catalog.map(s=>fs.readFile(path.join(root,'snapshot/stories',s.id+'.json'),'utf8').then(JSON.parse)));
 const full=count==null?actual:Array.from({length:count},(_,i)=>({...actual[i%actual.length],id:`aisle-test-${i}`,title:`داستان شماره ${i+1}`,words:200+(i*137)%6000,created:new Date(Date.UTC(2026,0,1,i)).toISOString()}));
 const list=full.map(({body,check,...s})=>s);
 if(process.env.READER_AISLE_OFFLINE){
  const names=['read.js','book.js','book-cover.js','library-stage.js','snapshot.js','feedback.js','persian-display.js','reader-position.js','page-curl.js','library-preview.js','reader-editorial.js','library-aisle.js'];
  const files=Object.fromEntries(await Promise.all(names.map(async n=>[n,await fs.readFile(path.join(root,'web',n),'utf8')])));
  const images={};for(const n of await fs.readdir(path.join(root,'web/reader-illustrations')))if(n.endsWith('.svg'))images[n]='data:image/svg+xml;base64,'+(await fs.readFile(path.join(root,'web/reader-illustrations',n))).toString('base64');
  const css=(await Promise.all(['style.css','book.css','library.css','reader-room.css','library-preview.css','library-aisle.css'].map(n=>fs.readFile(path.join(root,'web',n),'utf8')))).join('\n').replace(/@font-face\s*\{[^}]*\}|@import\s+url\([^)]*\)\s*;/g,'');
  const html=(await fs.readFile(path.join(root,'web/read.html'),'utf8')).replace(/<link\b[^>]*>/g,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
  await page.setContent(html.replace('</head>',`<style>${css}</style></head>`));
  await page.evaluate(async({files,full,images})=>{
   const store=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});history.replaceState=()=>{};
   window.fetch=async()=>({ok:true,json:async()=>({likes:0,dislikes:0})});
   files['snapshot.js']=`export function isGitHubPages(){return true;}export function appHref(p){const images=${JSON.stringify(images)};return images[p.split('/').pop()]||p;}export async function getJSON(p){const s=${JSON.stringify(full)};if(p==='/api/stories')return s.map(({body,check,...x})=>x);if(p.endsWith('/comments'))return [];return s.find(v=>String(v.id)===decodeURIComponent(p.split('/').pop()));}`;
   const urls={};function url(name){if(urls[name])return urls[name];const code=files[name].replace(/from\s+["']\.\/([^"']+)["']/g,(_,p)=>'from '+JSON.stringify(url(p.split('?')[0])));return urls[name]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));}
   await import(url('library-aisle.js'));await import(url('read.js'));await import(url('library-preview.js'));
  },{files,full,images});
  await page.waitForFunction(()=>document.querySelector('#covers.is-aisle-layout'));
  return full;
 }

 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!==origin)return route.abort();
  let p=decodeURIComponent(url.pathname.replace(new RegExp('^'+base+'(?=/|$)'),'') );
  if(p==='/api/stories'||p==='/snapshot/stories.json')return route.fulfill({json:list});
  const match=p.match(/^\/(?:api|snapshot)\/stories\/([^/]+?)(?:\.json)?$/);
  if(match){const s=full.find(s=>s.id===match[1]);return route.fulfill(s?{json:s}:{status:404,body:'{}'});}
  if(p.endsWith('/comments'))return route.fulfill({json:[]});
  if(p.endsWith('/votes'))return route.fulfill({json:{likes:0,dislikes:0}});
  if(p.endsWith('/'))p+='index.html';
  const name=path.resolve(root,'.'+p);if(!name.startsWith(root+path.sep))return route.abort();
  try{const body=await fs.readFile(name);const ext=path.extname(name);return route.fulfill({body,contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'})[ext]||'application/octet-stream'});}catch{return route.fulfill({status:404,body:'not found'});}
 });
 await page.goto(origin+base+'/read/',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>document.querySelector('#covers.is-aisle-layout'));
 return full;
}
async function geometry(page,count){
 const result=await page.evaluate(()=>{
  const books=[...document.querySelectorAll('#covers > .shelf-book')];
  const cases=[...document.querySelectorAll('.aisle-cabinet')];
  return {pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,cases:cases.length,books:books.map(n=>({key:n.dataset.key,cabinet:+n.dataset.cabinet,row:+n.dataset.shelfRow,x:n.offsetLeft,y:n.offsetTop,w:n.offsetWidth,h:n.offsetHeight})),cabinets:cases.map(n=>({x:n.offsetLeft,y:n.offsetTop,w:n.offsetWidth,h:n.offsetHeight}))};
 });
 assert.equal(result.books.length,count);assert.ok(result.pageWidth<=result.viewport,'no horizontal page overflow');
 for(const b of result.books){const c=result.cabinets[b.cabinet];assert.ok(c&&b.x>=c.x+10&&b.x+b.w<=c.x+c.w-10,JSON.stringify({b,c}));assert.ok(b.y>=0&&b.y+b.h<=c.h);}
 for(let i=0;i<result.books.length;i++)for(let j=i+1;j<result.books.length;j++){const a=result.books[i],b=result.books[j];if(a.cabinet===b.cabinet&&a.row===b.row)assert.ok(a.x+a.w<=b.x+.1||b.x+b.w<=a.x+.1,'books do not overlap');}
 return result;
}
async function main(){
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
 const report={fixture:process.env.READER_AISLE_OFFLINE?'Production DOM/CSS/modules, synthetic API/history/storage and offline fonts; route tests skipped explicitly.':'Actual public HTML/CSS/JS, routed same-origin HTTP fixtures and authorized public content; no CDN or physical-device certification.',cases:[]};
 async function run(name,options,count,fn){const page=await browser.newPage(options);page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{const full=await fixture(page,count);await fn(page,full);assert.deepEqual(errors,[]);report.cases.push({name,status:'passed'});console.log('PASS',name);}
 catch(e){report.cases.push({name,status:'failed',error:String(e.stack||e),errors});console.error('FAIL',name,e);await page.screenshot({path:path.join(out,name+'-failure.png'),fullPage:true}).catch(()=>{});}finally{await page.close();}}
 try{
 for(const [width,height]of [[1440,1000],[768,1024],[375,812],[320,720],[812,375]])for(const theme of ['dark','light']){
 await run(`${width}-${height}-${theme}`,{viewport:{width,height},hasTouch:width<900},undefined,async(page,full)=>{
  if(theme==='light')await page.locator('#library-theme').click();await geometry(page,full.length);
  assert.ok(await page.locator('.shelf-book.is-face .cover').first().evaluate(n=>{const title=n.querySelector('.c-title').getBoundingClientRect(),form=n.querySelector('.cover-subject').getBoundingClientRect(),cover=n.getBoundingClientRect();return title.bottom<=form.top+1&&form.bottom<=cover.bottom+1;}),'face-out title never overlaps its form');
  assert.equal(await page.locator('.aisle-cabinet').count(),1);await page.screenshot({path:path.join(out,`${width}-${height}-${theme}.png`),fullPage:true});
  await page.locator('#library-preview-toggle').click();await page.waitForFunction(()=>document.querySelector('.preview-summary').dataset.verified==='true');
  const r=await page.locator('#library-preview').boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,'preview fits');
  await page.locator('.preview-read').click();await page.waitForFunction(()=>!document.querySelector('.stage')&&!document.querySelector('.book-overlay').classList.contains('book-entering'));
  assert.equal(await page.locator('.book-overlay').isVisible(),true);
  await page.screenshot({path:path.join(out,`${width}-${height}-${theme}-reading.png`)});
  await page.locator('.reader-close').click();await page.waitForFunction(()=>document.querySelector('.book-overlay').hidden&&!document.querySelector('.stage'));
  assert.equal(await page.locator('.shelf-book > .cover').first().evaluate(n=>getComputedStyle(n).visibility),'visible');
 });}
 for(const [width,height,motion]of [[1440,1000,'no-preference'],[375,812,'reduce']])await run(`100-books-${width}`,{viewport:{width,height},hasTouch:width<900,reducedMotion:motion},100,async(page,full)=>{
  const g=await geometry(page,100);assert.ok(g.cases>1);await page.screenshot({path:path.join(out,`100-books-${width}.png`),fullPage:true});
  await page.locator('#aisle-next').click();await page.waitForFunction(()=>document.querySelector('.case').dataset.activeCabinet==='1');
  await page.screenshot({path:path.join(out,`100-books-${width}-next.png`),fullPage:true});
  await page.locator('#aisle-prev').click();await page.waitForFunction(()=>document.querySelector('.case').dataset.activeCabinet==='0');
  if(width<900){
   // Navigation may scroll the document down to its controls. A touch must
   // start inside the visible intersection, not at an off-screen row offset.
   const region=await page.locator('.case').boundingBox();
   const top=Math.max(0,region.y),bottom=Math.min(height,region.y+region.height);
   assert.ok(bottom-top>40,'cabinet has a visible touch area');
   const y=(top+bottom)/2;
   assert.ok(await page.evaluate(y=>Boolean(document.elementFromPoint(70,y)?.closest('.case')),y),'gesture starts on the real cabinet');
   const cdp=await page.context().newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:70,y}]});
   for(let x=90;x<=310;x+=20){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await page.waitForTimeout(18);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForFunction(()=>Math.abs(document.querySelector('.case').scrollLeft)>20);
   await cdp.detach();
  }

  const last=page.locator('.shelf-book > .cover').last();await last.scrollIntoViewIfNeeded();await last.click();
  await page.waitForFunction(()=>!document.querySelector('.stage')&&!document.querySelector('.book-overlay').classList.contains('book-entering'));
  await page.locator('.reader-close').click();await page.waitForFunction(()=>document.querySelector('.book-overlay').hidden&&!document.querySelector('.stage'));
  await geometry(page,100);
  await page.locator('#library-filter-toggle').click();await page.locator('#story-search').fill('داستان شماره 100');await page.waitForFunction(()=>document.querySelectorAll('.shelf-book').length===1);await geometry(page,1);
  assert.equal(await page.locator('.aisle-cabinet').count(),1);assert.equal(await page.locator('#aisle-next').isDisabled(),true);
  await page.locator('#story-reset').click();await page.waitForFunction(()=>document.querySelectorAll('.shelf-book').length===100);await geometry(page,100);
  for(const v of [{width:320,height:720},{width:1440,height:1000}]){await page.setViewportSize(v);await page.waitForTimeout(350);await geometry(page,100);}
 });
 if(!process.env.READER_AISLE_OFFLINE)for(const legacy of ['web/read.html','web/interaction-library/'])await run('canonical-'+legacy.replaceAll('/','-'),{viewport:{width:1280,height:900}},undefined,async(page,full)=>{
  const hash=legacy==='web/read.html'?String(full[0].id):'reader';
  await page.goto(origin+base+'/'+legacy+'?view=library#'+encodeURIComponent(hash));
  await page.waitForURL(url=>url.pathname===base+'/read/');
  await page.waitForFunction(()=>document.querySelector('#covers.is-aisle-layout'));
  assert.equal(new URL(page.url()).search,'?view=library');
  assert.equal(new URL(page.url()).hash,legacy==='web/read.html'?'#'+encodeURIComponent(String(full[0].id)):'');
  assert.equal(await page.locator('iframe').count(),0);
 });
 for(const count of [0,1])await run(`catalog-${count}`,{viewport:{width:375,height:812},hasTouch:true},count,async page=>{await geometry(page,count);assert.equal(await page.locator('.aisle-cabinet').count(),1);assert.equal(await page.locator('#library-preview-toggle').isDisabled(),!count);});
 }finally{await browser.close();report.passed=report.cases.filter(c=>c.status==='passed').length;report.failed=report.cases.length-report.passed;await fs.writeFile(path.join(out,'summary.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify({passed:report.passed,failed:report.failed}));if(report.failed)process.exitCode=1;
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={fixture,geometry};
