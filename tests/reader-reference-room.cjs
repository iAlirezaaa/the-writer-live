'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),zlib=require('node:zlib'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reference-room-evidence');
const STORIES=[
 {id:'owner-20261110-jaye-doxt',title:'جای دوخت'},
 {id:'0005',title:'کوچه‌ی بازگشت'},
 {id:'0003',title:'نامی که از پل برگشت'}
];
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const bytes=await fs.readFile(path.join(root,'web/reference-room/data/room.json.gz')),model=JSON.parse(zlib.gunzipSync(bytes));
 assert.equal(model.content_mode,'empty');assert.equal(model.states['desktop-shelf'].items.length,11);
 const reader=await fs.readFile(path.join(root,'reader/index.html'),'utf8');
 assert.match(reader,/\.\.\/web\/read\.js/);assert.match(reader,/writer:reading-closed/);
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/stories'){res.setHeader('Content-Type','application/json');return res.end(await fs.readFile(path.join(root,'snapshot/stories.json')));}
  const match=url.pathname.match(/^\/api\/stories\/([^/]+)$/);
  if(match){res.setHeader('Content-Type','application/json');return res.end(await fs.readFile(path.join(root,'snapshot/stories',decodeURIComponent(match[1])+'.json')));}
  if(/\/(?:votes|comments)$/.test(url.pathname)){res.setHeader('Content-Type','application/json');return res.end(url.pathname.endsWith('/votes')?'{"likes":0,"dislikes":0}':'[]');}
  const p=path.resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));
  if(!p.startsWith(root+path.sep))throw Error('path');const data=await fs.readFile(p);
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(p)]||'application/octet-stream');res.end(data);
 }catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const report={source:process.env.GITHUB_SHA,asset:crypto.createHash('sha256').update(bytes).digest('hex'),browser:browser.version(),cases:[]};
 try{
  for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:name==='mobile',isMobile:name==='mobile'});page.setDefaultTimeout(60000);const errors=[];
   page.on('pageerror',e=>errors.push(e.message));const row={name};report.cases.push(row);
   try{
    await page.goto(base+'/web/reference-room/',{waitUntil:'load'});await page.waitForFunction(()=>window.referenceRoom?.ready||document.body.dataset.error);
    assert.equal(await page.getAttribute('body','data-error'),null);
    await page.evaluate(()=>{referenceRoom.setTestView(0);referenceRoom.renderer.setPixelRatio(.4);window.qaStoryLinks=[];window.__ROOM_TEST_NAVIGATE=(href,id)=>qaStoryLinks.push({href,id});});
    const labels=await page.locator('#covers button').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')));
    assert.deepEqual(labels,[...STORIES.map(s=>s.title),...Array.from({length:8},(_,i)=>`دفتر خالی ${i+4}`)]);
    assert.deepEqual(await page.locator('#covers button').evaluateAll(nodes=>nodes.map(n=>n.textContent)),[...STORIES.map(s=>s.title),'','','','','','','','']);
    assert.deepEqual(await page.evaluate(()=>referenceRoom.books.map(b=>b.storyId)),[...STORIES.map(s=>s.id),null,null,null,null,null,null,null,null]);
    await page.screenshot({path:path.join(out,name+'-story-shelf.png')});
    await page.emulateMedia({reducedMotion:'reduce'});
    for(let i=0;i<3;i++){
     await page.evaluate(i=>referenceRoom.open(i),i);await page.waitForFunction(()=>referenceRoom.state.mode==='spread'&&!referenceRoom.state.busy);
     const nav=await page.evaluate(()=>qaStoryLinks.at(-1)),u=new URL(nav.href);assert.equal(nav.id,STORIES[i].id);assert.equal(u.pathname,'/reader/');assert.equal(u.search,'?from=room');assert.equal(decodeURIComponent(u.hash.slice(1)),STORIES[i].id);
     await page.keyboard.press('Escape');await page.waitForFunction(()=>referenceRoom.state.mode==='shelf'&&!referenceRoom.state.busy);
    }
    for(let i=3;i<11;i++){assert.equal(await page.evaluate(i=>referenceRoom.books[i].name,i),'');assert.equal(await page.evaluate(i=>referenceRoom.books[i].storyId,i),null);}
    await page.evaluate(()=>referenceRoom.open(3));await page.waitForFunction(()=>referenceRoom.state.mode==='spread'&&!referenceRoom.state.busy);assert.equal(await page.locator('#page').innerText(),'');await page.screenshot({path:path.join(out,name+'-empty-placeholder.png')});await page.keyboard.press('Escape');await page.waitForFunction(()=>referenceRoom.state.mode==='shelf'&&!referenceRoom.state.busy);
    assert.deepEqual(errors,[]);row.status='passed';
   }catch(error){row.status='failed';row.error=String(error.stack||error);await page.screenshot({path:path.join(out,name+'-failure.png')}).catch(()=>{});}
   finally{row.errors=errors;await page.close();}
  }
 }finally{await browser.close();server.close();report.passed=report.cases.filter(c=>c.status==='passed').length;report.failed=report.cases.length-report.passed;await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});