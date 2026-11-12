'use strict';
// Production DOM/CSS/modules in Chromium. Only API, history and storage are
// fixtures. Pause WAAPI to make each interruption phase deterministic.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.READER_LIFECYCLE_ARTIFACTS || path.join(root, 'reader-browser-artifacts/transition-lifecycle'));
const story = {id:'transition-qa', title:'آزمون حرکت کتاب', stage:'داستان کوتاه', status:'accepted', words:500, created:'2026-11-12T00:00:00Z', body:Array(20).fill('نور از پنجره به اتاق رسید. کتاب روی میز بود و صدای باران از کوچه می‌آمد.').join('\n\n'), check:''};
async function load(page) {
  let html = await fs.readFile(path.join(root,'web/read.html'),'utf8');
  html = html.replace(/<link\b[^>]*>/g,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
  const css = await Promise.all(['style.css','book.css','library.css','reader-room.css','library-preview.css'].map(async name => (await fs.readFile(path.join(root,'web',name),'utf8')).replace(/@font-face\s*\{[^}]*\}|@import\s+url\([^)]*\)\s*;/g,'')));
  await page.setContent(html.replace('</head>',`<style>${css.join('\n')}</style></head>`));
  const names = ['read.js','book.js','book-cover.js','library-stage.js','snapshot.js','feedback.js','persian-display.js','reader-position.js','page-curl.js','reader-editorial.js'];
  const files = Object.fromEntries(await Promise.all(names.map(async name => [name,await fs.readFile(path.join(root,'web',name),'utf8')])));
  await page.evaluate(async ({files,story}) => {
    const memory = new Map();
    Object.defineProperty(window,'localStorage',{value:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}});
    history.replaceState = () => {};
    window.fetch = async () => ({ok:true,json:async()=>[]});
    files['snapshot.js'] = `export function isGitHubPages(){return false;} export function appHref(p){return p;} export async function getJSON(p){return p==='/api/stories'?[${JSON.stringify(story)}]:p.endsWith('/comments')?[]:${JSON.stringify(story)};}`;
    window.qaAnimations = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function(...args) {
      const a = animate.apply(this,args);
      if(['b3d','b3d-cover','stage-dim','stage'].some(c=>this.classList.contains(c))) {
        a.pause(); window.qaAnimations.push({a,cls:this.classList[0]});
      }
      return a;
    };
    const urls = {};
    function url(name) {
      if(urls[name])return urls[name];
      const code=files[name].replace(/from\s+["']\.\/([^"']+)["']/g,(_,p)=>'from '+JSON.stringify(url(p.split('?')[0])));
      return urls[name]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
    }
    await import(url('read.js'));
  },{files,story});
  await page.locator('.shelf-book > .cover').first().waitFor();
}
async function animation(page,cls,index,finish=false) {
  await page.waitForFunction(({cls,index}) => window.qaAnimations.filter(v=>v.cls===cls).length>index,{cls,index});
  if(finish)await page.evaluate(({cls,index}) => window.qaAnimations.filter(v=>v.cls===cls)[index].a.finish(),{cls,index});
}
async function beginOpen(page,late=false) {
  await page.locator('.shelf-book > .cover').first().click();
  await animation(page,'b3d',0);
  if(late) {
    await animation(page,'b3d',0,true); await animation(page,'b3d',1,true);
    await animation(page,'b3d',2);
  }
}
async function settle(page,closed=false) {
  await page.waitForFunction(closed => {
    const overlay=document.querySelector('.book-overlay');
    return overlay && overlay.hidden===closed && !overlay.classList.contains('book-entering') && !document.querySelector('.stage');
  },closed);
  assert.equal(await page.locator('.shelf-book > .cover').evaluate(n=>n.style.visibility),'','source visibility restored');
}
async function openInstant(page) {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('.shelf-book > .cover').first().click();
  await settle(page);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{window.qaAnimations=[];});
}
async function main() {
  await fs.mkdir(out,{recursive:true});
  const browser = await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
  const report={browser:browser.version(),fixture:'production modules; offline fonts and synthetic API; paused WAAPI',cases:[]};
  async function run(name,viewport,fn) {
    const row={name,errors:[]};report.cases.push(row);
    const page=await browser.newPage({viewport,hasTouch:viewport.width<900});page.setDefaultTimeout(5000);
    page.on('pageerror',e=>row.errors.push(e.message));
    try {await load(page);await fn(page);assert.deepEqual(row.errors,[]);row.status='passed';await page.screenshot({path:path.join(out,name+'.png')});console.log('PASS',name);}
    catch(e) {row.status='failed';row.error=String(e.stack||e);await page.screenshot({path:path.join(out,name+'-failure.png')}).catch(()=>{});console.error('FAIL',name,row.error);}
    finally {await page.close();}
  }
  try {
    for(const [label,viewport,target] of [['desktop',{width:1440,height:1000},{width:1280,height:900}],['mobile',{width:375,height:812},{width:812,height:375}]]) {
      for(const late of [false,true])await run(`${label}-resize-${late?'unfold':'lift'}`,viewport,async page=>{
        await beginOpen(page,late);await page.screenshot({path:path.join(out,`${label}-${late?'unfold':'lift'}-before.png`)});
        await page.setViewportSize(target);await settle(page);
        // Cover the reverse direction during return, with the geometry already
        // repaginated to the new viewport. Do not force click hidden controls.
        await page.waitForTimeout(250);await page.evaluate(()=>{window.qaAnimations=[];});
        await page.locator('.reader-close').click();await animation(page,'b3d',0);
        await page.setViewportSize(viewport);await settle(page,true);
      });
      for(const phase of ['lift','unfold','return'])await run(`${label}-reduce-${phase}`,viewport,async page=>{
        if(phase==='return') {await openInstant(page);await page.locator('.reader-close').click();await animation(page,'b3d',0);}
        else await beginOpen(page,phase==='unfold');
        await page.emulateMedia({reducedMotion:'reduce'});await settle(page,phase==='return');
        const count=await page.evaluate(()=>window.qaAnimations.length);
        await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize(target);await page.waitForTimeout(100);
        assert.equal(await page.evaluate(()=>window.qaAnimations.length),count,'completed transition does not restart');
      });
    }
    for(const mode of ['hidden','detached'])await run(`return-source-${mode}`,{width:375,height:812},async page=>{
      await openInstant(page);
      await page.locator('.shelf-book').evaluate((n,mode)=>{if(mode==='hidden')n.style.display='none';else n.remove();},mode);
      await page.locator('.reader-close').click();await settle(page,true);
      assert.equal(await page.evaluate(()=>window.qaAnimations.filter(v=>v.cls==='b3d').length),0,'no invalid return pose');
    });
    await run('cancel-and-reopen',{width:375,height:812},async page=>{
      await beginOpen(page,true);await page.getByRole('button',{name:'بازگشت به قفسه'}).click();await settle(page,true);
      await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.shelf-book > .cover').first().click();await settle(page);
      await page.locator('.reader-close').click();await settle(page,true);
    });
  } finally {
    await browser.close();report.passed=report.cases.filter(c=>c.status==='passed').length;report.failed=report.cases.length-report.passed;
    await fs.writeFile(path.join(out,'summary.json'),JSON.stringify(report,null,2)+'\n');
  }
  console.log(JSON.stringify({passed:report.passed,failed:report.failed}));if(report.failed)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
