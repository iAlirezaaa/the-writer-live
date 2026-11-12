'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),zlib=require('node:zlib'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reference-room-evidence');
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const bytes=await fs.readFile(path.join(root,'web/reference-room/data/room.json.gz')),model=JSON.parse(zlib.gunzipSync(bytes));
 assert.equal(model.content_mode,'empty');assert.equal(model.states['desktop-shelf'].items.length,11);
 assert.ok(!model.scene.materials.some(m=>/ShaderMaterial/.test(m.type)),'no copied executable shaders');
 assert.ok(model.scene.images.every(i=>i.url.startsWith('data:image/webp;base64,')),'self-contained image assets');
 const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));if(!p.startsWith(root+path.sep))throw Error('path');const data=await fs.readFile(p);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(p)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const report={source:process.env.GITHUB_SHA,asset:crypto.createHash('sha256').update(bytes).digest('hex'),browser:browser.version(),rendering:'SwiftShader: interactions at 0.4 pixel ratio; frozen screenshots at 1.0. Not a physical-device frame-rate benchmark.',cases:[]};
 try{
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:name==='mobile',isMobile:name==='mobile'});page.setDefaultTimeout(45000);const errors=[],network=[];
  await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window);let held=false,queue=[];window.requestAnimationFrame=callback=>held?(queue.push(callback),0):raf(callback);window.qaHold=value=>{held=value;if(!value)queue.splice(0).forEach(callback=>raf(callback));};});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))network.push(r.url());});
  const row={name};report.cases.push(row);
  async function shot(label){
   await page.evaluate(()=>{qaHold(true);const r=referenceRoom;r.renderer.setPixelRatio(1);r.renderer.render(r.scene,r.camera);});
   try{await page.screenshot({path:path.join(out,name+'-'+label+'.png'),timeout:60000});}
   finally{await page.evaluate(()=>{referenceRoom.renderer.setPixelRatio(.4);qaHold(false);});}
  }
  try{
   await page.goto(base+'/web/reference-room/',{waitUntil:'load'});await page.waitForFunction(()=>window.referenceRoom?.ready||document.body.dataset.error,null,{timeout:90000});assert.equal(await page.getAttribute('body','data-error'),null);
   await page.evaluate(()=>{referenceRoom.setTestView(0);referenceRoom.renderer.setPixelRatio(.4);});await page.waitForTimeout(1000);
   assert.equal(await page.locator('#covers button').count(),11);assert.equal(await page.locator('iframe').count(),0);await shot('shelf');
   row.geometry=await page.evaluate(()=>({objects:(()=>{let n=0;referenceRoom.scene.traverse(()=>n++);return n})(),books:referenceRoom.books.map(b=>({name:b.name,position:b.root.position.toArray(),scale:b.root.scale.toArray()})),draw:referenceRoom.renderer.info.render}));assert.ok(row.geometry.objects>600);
   await page.evaluate(()=>referenceRoom.setTestView(.65));await page.waitForTimeout(200);await shot('near');await page.evaluate(()=>referenceRoom.setTestView(0));
   const button=page.locator('#covers button').first();await button.focus();await button.press('Enter');await page.waitForTimeout(350);await shot('opening');
   await page.waitForFunction(()=>referenceRoom.state.mode==='spread'&&!referenceRoom.state.busy);await shot('open');
   await page.evaluate(()=>referenceRoom.enter());await page.waitForFunction(()=>referenceRoom.state.mode==='inside');assert.equal(await page.locator('#page').innerText(),'');await shot('empty-page');
   await page.keyboard.press('Escape');await page.waitForFunction(()=>referenceRoom.state.mode==='shelf'&&!referenceRoom.state.busy);
   await page.getByRole('button',{name:'A list',exact:true}).click();await page.waitForFunction(()=>referenceRoom.state.listed===1&&!referenceRoom.state.busy);await shot('list');await page.mouse.wheel(0,400);await page.waitForFunction(()=>referenceRoom.state.scroll>100);
   await page.getByRole('button',{name:'The shelf',exact:true}).click();await page.waitForFunction(()=>referenceRoom.state.listed===0&&!referenceRoom.state.busy);
   for(const view of ['About','Contact']){await page.getByRole('button',{name:view,exact:true}).click();await page.waitForFunction(view=>referenceRoom.state.mode===view&&!referenceRoom.state.busy,view.toLowerCase());await shot(view.toLowerCase());await page.keyboard.press('Escape');await page.waitForFunction(()=>referenceRoom.state.mode==='shelf'&&!referenceRoom.state.busy);}
   await page.emulateMedia({reducedMotion:'reduce'});
   for(let i=0;i<11;i++){await page.evaluate(i=>referenceRoom.open(i),i);await page.waitForFunction(()=>referenceRoom.state.mode==='spread'&&!referenceRoom.state.busy);assert.equal(await page.locator('#page').innerText(),'');await page.keyboard.press('Escape');await page.waitForFunction(()=>referenceRoom.state.mode==='shelf'&&!referenceRoom.state.busy);}
   await page.evaluate(()=>referenceRoom.open(3));await page.waitForFunction(()=>referenceRoom.state.mode==='spread');await page.setViewportSize({width:height,height:width});await page.waitForTimeout(200);await page.keyboard.press('Escape');await page.waitForFunction(()=>referenceRoom.state.mode==='shelf'&&!referenceRoom.state.busy);
   row.finite=await page.evaluate(()=>referenceRoom.books.every(b=>[...b.root.position.toArray(),...b.root.scale.toArray(),...b.root.quaternion.toArray()].every(Number.isFinite)));assert.ok(row.finite);assert.deepEqual(errors,[]);assert.deepEqual(network,[]);row.status='passed';
  }catch(error){row.status='failed';row.error=String(error.stack||error);await page.screenshot({path:path.join(out,name+'-failure.png')}).catch(()=>{});console.error(name,error);}
  finally{row.errors=errors;row.externalRequests=network;await page.close();}
 }
 }finally{await browser.close();server.close();report.passed=report.cases.filter(c=>c.status==='passed').length;report.failed=report.cases.length-report.passed;await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
