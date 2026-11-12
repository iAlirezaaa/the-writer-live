'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),site=path.join(root,'.reference-entry-site');
(async()=>{
 execFileSync('python3',['tools/stage_reference_room.py','--site',site],{cwd:root,stdio:'inherit'});
 const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),p=path.resolve(site,'.'+decodeURIComponent(url.pathname)+(url.pathname.endsWith('/')?'index.html':''));if(!p.startsWith(site+path.sep))throw Error('path');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(p)]||'application/octet-stream');res.end(await fs.readFile(p));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/read/?reference=1#drag`);await page.waitForFunction(()=>window.referenceRoom?.state.mode==='spread'||document.body.dataset.error,null,{timeout:90000});
  assert.equal(await page.getAttribute('body','data-error'),null);assert.equal(await page.locator('meta[name="reader-mode"]').getAttribute('content'),'reference-empty');assert.equal(await page.locator('#covers button').count(),11);assert.equal(await page.locator('#page').innerText(),'');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>referenceRoom.state.mode==='shelf');assert.deepEqual(errors,[]);console.log('CANONICAL-REFERENCE-ENTRY-PASS: /read/, nested modules, compressed asset, empty deep link, return');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
