'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright');
const {fixture,geometry}=require('./reader-aisle-browser.cjs');
const out=path.resolve(__dirname,'../reader-atmosphere-artifacts');
(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true});
 const report={fixture:'Real production HTML/CSS/modules, routed same-origin authorized snapshot; not a live CDN or physical-device test',cases:[]};
 async function run(width,height,theme,count){
  const name=`${width}-${height}-${theme}-${count??3}`;
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<900,reducedMotion:theme==='light'?'reduce':'no-preference'});page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   const full=await fixture(page,count);
   if(theme==='light')await page.locator('#library-theme').click();
   if(count==null)await page.waitForFunction(()=>document.querySelectorAll('.shelf-book > .cover[data-cover-scene]').length===3);
   await geometry(page,full.length);
   assert.ok(await page.locator('#covers').evaluate(n=>[...n.querySelectorAll('.shelf-book.is-face .cover')].every(c=>{const r=c.getBoundingClientRect(),t=c.querySelector('.c-title').getBoundingClientRect(),s=c.querySelector('.cover-subject').getBoundingClientRect(),a=c.querySelector('.cover-art').getBoundingClientRect();return t.bottom<=s.top+1&&s.bottom<=r.bottom-3&&a.bottom<=t.top+1;})),'cover title, art and form do not overlap');
   await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
   if(full.length){
    await page.locator('#library-preview-toggle').click();await page.waitForFunction(()=>!document.querySelector('#library-preview').hidden);await page.waitForTimeout(200);
    const r=await page.locator('#library-preview').boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,'preview stays inside viewport');
    await page.locator('.preview-read').click();
    if(count==null&&theme==='dark'){
     await page.locator('.b3d').waitFor();assert.equal(await page.locator('.b3d').getAttribute('data-cover-scene'),'verified');
    }
    await page.waitForFunction(()=>!document.querySelector('.stage')&&!document.querySelector('.book-overlay').classList.contains('book-entering'));
    assert.ok(await page.locator('.book-overlay').isVisible());
    await page.locator('.reader-close').click();await page.waitForFunction(()=>document.querySelector('.book-overlay').hidden&&!document.querySelector('.stage'));
    assert.equal(await page.locator('.shelf-book > .cover').first().evaluate(n=>getComputedStyle(n).visibility),'visible');
   }
   if(count===100){
    await page.locator('#aisle-next').click();await page.waitForFunction(()=>document.querySelector('.case').dataset.activeCabinet==='1');
    await page.locator('#library-filter-toggle').click();await page.locator('#story-search').fill('داستان شماره 100');await page.waitForFunction(()=>document.querySelectorAll('.shelf-book').length===1);
    await geometry(page,1);assert.equal(await page.locator('.aisle-cabinet').count(),1);
    await page.locator('#story-reset').click();await page.waitForFunction(()=>document.querySelectorAll('.shelf-book').length===100);
    for(const viewport of [{width:320,height:720},{width:1440,height:1000}]){await page.setViewportSize(viewport);await page.waitForTimeout(350);await geometry(page,100);}
   }
   assert.deepEqual(errors,[]);report.cases.push({name,status:'passed'});console.log('PASS',name);
  }catch(e){report.cases.push({name,status:'failed',error:String(e.stack||e),errors});console.error(name,e);await page.screenshot({path:path.join(out,name+'-failed.png'),fullPage:true}).catch(()=>{});}
  finally{await page.close();}
 }
 try{
  for(const [w,h]of [[1440,1000],[375,812],[320,720],[768,1024],[812,375]])for(const theme of ['dark','light'])await run(w,h,theme);
  await run(1440,1000,'dark',100);await run(375,812,'light',100);await run(375,812,'light',0);await run(375,812,'dark',1);
 }finally{await browser.close();report.passed=report.cases.filter(c=>c.status==='passed').length;report.failed=report.cases.length-report.passed;await fs.writeFile(path.join(out,'summary.json'),JSON.stringify(report,null,2));}
 if(report.failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
