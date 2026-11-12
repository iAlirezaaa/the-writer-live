/* Independent controller for the measured reference room. Notebook contents are
 * intentionally empty. No source executable bundles, demos, tracking or fonts. */
import * as THREE from '../vendor/three.module.js';
const $=id=>document.getElementById(id),clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2,segment=(t,a,b)=>smooth(clamp((t-a)/(b-a)));
const stories=[{id:'owner-20261110-jaye-doxt',title:'جای دوخت'},{id:'0005',title:'کوچه‌ی بازگشت'},{id:'0003',title:'نامی که از پل برگشت'},null,null,null,null,null,null,null,null];
const titles=stories.map(story=>story?.title||'');
const media=matchMedia('(prefers-reduced-motion: reduce)'),reduce=()=>media.matches;
const state={mode:'shelf',selected:-1,hover:-1,near:0,listed:0,scroll:0,maxScroll:0,lamp:1,ready:false,busy:false,generation:0};
let data,scene,camera,renderer,books=[],baseline,frame=0,tween=null;
const nodes=new Map(),pathNodes=new Map(),ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),temp=new THREE.Vector3();
let pointer={x:0,y:0},viewPointer={x:0,y:0},rows=[],targets=[],savedContact=null,autoApproach=0;
const yRotation=a=>new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),a),frontRotation=yRotation(-Math.PI/2);
function storyHref(book){return new URL(`../../reader/?from=room#${encodeURIComponent(book.storyId)}`,import.meta.url).href;}
function storyLabelSprite(root,spineTitle,title){
 if(!spineTitle?.isObject3D||!title)return null;
 root.updateWorldMatrix(true,true);spineTitle.updateWorldMatrix(true,false);
 const anchor=spineTitle.getWorldPosition(new THREE.Vector3());root.worldToLocal(anchor);
 const canvas=document.createElement('canvas');canvas.width=320;canvas.height=2048;
 const ctx=canvas.getContext('2d');ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(-Math.PI/2);ctx.direction='rtl';ctx.textAlign='center';ctx.textBaseline='middle';
 let size=118;do{ctx.font=`600 ${size}px sans-serif`;if(ctx.measureText(title).width<=canvas.height*.82)break;size-=5;}while(size>54);
 ctx.fillStyle='rgba(64,43,28,.96)';ctx.fillText(title,0,0);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
 const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
 const sprite=new THREE.Sprite(material);sprite.position.copy(anchor);sprite.scale.set(.22,1.45,1);sprite.renderOrder=50;sprite.userData.storyLabel=true;root.add(sprite);return sprite;
}
function addStoryLabels(root,hinge,title){
 const cover=root.children[4],spineTitle=hinge.children[6],spineSub=hinge.children[7];
 for(const mesh of [cover,spineTitle,spineSub])if(mesh?.isObject3D)mesh.visible=false;
 const label=storyLabelSprite(root,spineTitle,title);return label?[label]:[];
}
function navigateStory(book){
 if(!book.storyId)return false;const href=storyHref(book);
 if(typeof globalThis.__ROOM_TEST_NAVIGATE==='function'){globalThis.__ROOM_TEST_NAVIGATE(href,book.storyId);return true;}
 location.assign(href);return true;
}
const pose=o=>({p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()});
const put=(o,a,b,t)=>{o.position.lerpVectors(a.p,b.p,t);o.quaternion.slerpQuaternions(a.q,b.q,t);o.scale.lerpVectors(a.s,b.s,t);};
const byPath=path=>pathNodes.get(path?.join('/'))||path?.reduce((o,i)=>o?.children[i],scene);
function mode(value){
 state.mode=value;document.body.dataset.mode=value;$('covers').inert=!['shelf','list'].includes(value);
 for(const b of document.querySelectorAll('.views button'))b.setAttribute('aria-pressed',String(b.dataset.view===(state.listed?'list':'shelf')));
 $('hint').classList.toggle('on',value==='spread');$('hint').textContent=value==='spread'?(matchMedia('(hover:none)').matches?'Tap the page to open it · tap outside to put it back':'Click the page to open it · Esc puts it back'):'';
 $('page').setAttribute('aria-hidden',String(value!=='inside'));$('label').classList.remove('on');
}
async function readAsset(){
 if(globalThis.__ROOM_TEST_DATA)return globalThis.__ROOM_TEST_DATA;
 const response=await fetch(new URL('./data/room.json.gz',import.meta.url));if(!response.ok)throw new Error(`Room asset: HTTP ${response.status}`);
 const bytes=new Uint8Array(await response.arrayBuffer());$('load-progress').style.transform='scaleX(.55)';
 if(bytes[0]!==0x1f||bytes[1]!==0x8b)return JSON.parse(new TextDecoder().decode(bytes));
 if(!globalThis.DecompressionStream)throw new Error('This browser cannot decode the room asset');
 return JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
}
function requestRender(shadow=false){if(shadow&&renderer)renderer.shadowMap.needsUpdate=true;if(!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
function animate(duration,update,finish){clearTimeout(autoApproach);state.generation++;tween={start:performance.now(),duration:reduce()?0:duration,update,finish};state.busy=true;requestRender(true);}
function setCamera(near=state.near){
 const a=innerWidth/innerHeight,mobile=a<1,farZ=18.5*(mobile?1+(1-a)*.75:1),closeZ=10.4*(mobile?1+(1-a)*1.1:1);
 const x=THREE.MathUtils.lerp(mobile?-.6:.75,-1.222,near),y=THREE.MathUtils.lerp(3.3,4.04,near),targetY=THREE.MathUtils.lerp(mobile?2.05:2.95,3.86,near);
 camera.position.set(x+viewPointer.x*1.3*(1-.55*near),y-viewPointer.y*.6*(1-.55*near),THREE.MathUtils.lerp(farZ,closeZ,near));camera.lookAt(x,targetY,0);camera.updateMatrixWorld();
}
function updateWallTitle(){
 const title=nodes.get('wall-title');if(!title)return;const a=camera.aspect,z=18.5*(a<1?1+(1-a)*.75:1),right=(a<1?-.6:.75)+(z+1.02)*Math.tan(27*Math.PI/360)*a,start=4.05,room=right-.5-start,width=Math.min(3.6,room*.86);
 title.visible=room>2.1;title.scale.set(width,width,1);title.position.set(start+width/2+(room-width)*.3,4.85,title.position.z);
}
function resize(){
 if(!renderer)return;renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 if(state.mode==='about')aboutPose();else if(state.mode==='contact')contactPose();else setCamera();updateWallTitle();
 if(state.listed&&!['spread','inside','opening','closing'].includes(state.mode))listLayout(true);
 if(['spread','opening'].includes(state.mode)&&state.selected>=0){tween=null;state.busy=false;openFinal(books[state.selected]);mode('spread');}requestRender(true);
}
function layoutButtons(){
 if(!camera||!state.ready||!['shelf','list'].includes(state.mode))return;const box=new THREE.Box3();
 for(const book of books){box.setFromObject(book.root);const min={x:Infinity,y:Infinity},max={x:-Infinity,y:-Infinity};
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=temp.set(x,y,z).project(camera),px=(p.x+1)*innerWidth/2,py=(1-p.y)*innerHeight/2;min.x=Math.min(min.x,px);min.y=Math.min(min.y,py);max.x=Math.max(max.x,px);max.y=Math.max(max.y,py);}
  Object.assign(book.button.style,{left:min.x+'px',top:min.y+'px',width:(max.x-min.x)+'px',height:(max.y-min.y)+'px'});book.bounds={min,max};
 }
}
function forward(distance,x=0,y=0){return camera.position.clone().addScaledVector(camera.getWorldDirection(new THREE.Vector3()),distance).add(new THREE.Vector3(x,y,0).applyQuaternion(camera.quaternion));}
function tick(now){
 frame=0;if(tween){const current=tween,t=current.duration?clamp((now-current.start)/current.duration):1;current.update(t);renderer.shadowMap.needsUpdate=true;if(t===1&&tween===current){tween=null;state.busy=false;current.finish?.();}}
 let pending=false;
 if(!state.busy&&['shelf','list'].includes(state.mode)){
  const amount=reduce()?1:.12;viewPointer.x+=(pointer.x-viewPointer.x)*amount;viewPointer.y+=(pointer.y-viewPointer.y)*amount;pending=Math.abs(pointer.x-viewPointer.x)+Math.abs(pointer.y-viewPointer.y)>.001;setCamera();
  if(state.listed)listLayout(false);else for(const book of books){const wanted=book.index===state.hover?1:0;book.pull+=(wanted-book.pull)*(reduce()?1:.16);if(Math.abs(wanted-book.pull)>.001)pending=true;book.root.position.copy(book.home.p);book.root.position.z+=book.pull*.62;book.root.position.y+=book.pull*.03;book.root.quaternion.copy(book.home.q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),book.pull*.11));}
 }
 const light=byPath([223]);if(light?.isPointLight){light.intensity=state.listed||state.selected>=0?26:0;light.position.copy(forward(2,1.7,2));}
 renderer.render(scene,camera);layoutButtons();if(state.hover>=0&&!state.busy&&['shelf','list'].includes(state.mode))placeLabel(books[state.hover]);if(tween||pending)requestRender(pending);
}
function placeLabel(book){const r=book.bounds;if(!r)return;$('label').style.left=clamp(r.max.x+18,20,Math.max(20,innerWidth-290))+'px';$('label').style.top=clamp(r.min.y+12,70,Math.max(70,innerHeight-180))+'px';}
function point(index){
 if(state.busy||!['shelf','list'].includes(state.mode)||index===state.hover)return;state.hover=index;$('room').classList.toggle('over',index>=0);
 if(index>=0&&books[index].name){const book=books[index];$('label').replaceChildren(Object.assign(document.createElement('strong'),{textContent:book.name}));$('label').classList.add('on');}else $('label').classList.remove('on');requestRender(true);
}
function hit(x,y){mouse.set(x/innerWidth*2-1,1-y/innerHeight*2);ray.setFromCamera(mouse,camera);const found=ray.intersectObjects(targets,false)[0];return found?.object.userData.notebook??-1;}
function openPose(book){
 const qe=Math.tan(camera.fov*Math.PI/360),width=book.model.data.page.w,h=book.model.look.h,single=innerWidth<700;
 const px=single?Math.min(innerWidth-60,460)/width:Math.min(innerWidth*.78/(width*2+.2),innerHeight*.78/h),distance=innerHeight/(2*qe*px),q=camera.quaternion.clone().multiply(frontRotation);
 const centre=new THREE.Vector3(book.model.data.page.x,h/2,book.model.data.page.zc+(single?0:width/2));
 return {p:forward(distance,0,single?-.1:distance*qe*.06).sub(centre.applyQuaternion(q)),q,s:new THREE.Vector3(1,1,1)};
}
function showBlankLeaves(book){for(const o of book.prints)o.visible=false;book.still.visible=false;book.hinge.rotation.y=Math.PI;}
function openFinal(book){const p=openPose(book);book.root.position.copy(p.p);book.root.quaternion.copy(p.q);book.root.scale.copy(p.s);showBlankLeaves(book);book.paper.visible=true;book.inside.visible=true;}
function dimRoom(amount){for(const l of scene.userData.lights)l.intensity=l.userData.power*(1-amount)*(l.userData.lamp?state.lamp:1);}
function open(index,push=true){
 if(!state.ready||state.busy||index<0||index>=books.length||!['shelf','list'].includes(state.mode))return;
 const book=books[index];state.selected=index;book.returnPose=pose(book.root);state.hover=-1;for(const label of book.storyLabels)label.visible=false;mode('opening');
 const start=pose(book.root),pulled={p:start.p.clone().add(new THREE.Vector3(0,.12,1.2)),q:start.q.clone(),s:start.s.clone()},end=openPose(book);
 if(push)history.pushState({notebook:index},'',`#${book.name.toLowerCase()}`);
 animate(1600,t=>{if(t<.3)put(book.root,start,pulled,segment(t,0,.3));else put(book.root,pulled,end,segment(t,.3,1));book.hinge.rotation.y=Math.PI*segment(t,.3,1);if(t>.35)for(const o of book.prints)o.visible=false;book.paper.visible=true;book.inside.visible=true;dimRoom(segment(t,.2,1)*.48);},()=>{openFinal(book);mode('spread');if(navigateStory(book))return;$('close').focus({preventScroll:true});requestRender(true);});
}
function restoreBook(book){for(const[o,p]of book.original){o.position.copy(p.p);o.quaternion.copy(p.q);o.scale.copy(p.s);o.visible=p.visible;}for(const label of book.storyLabels)label.visible=true;book.still.visible=false;book.pull=0;}
function close(clearHash=true){
 if(!state.ready)return;if(clearHash&&location.hash)history.replaceState(null,'',location.pathname+location.search);
 if(['about','contact'].includes(state.mode))return backToRoom();if(state.selected<0)return;const book=books[state.selected];
 if(state.mode==='inside'){$('page').setAttribute('aria-hidden','true');openFinal(book);}
 const start=pose(book.root),end=book.returnPose||book.home,hinge=book.hinge.rotation.y;state.hover=-1;mode('closing');
 animate(1050,t=>{put(book.root,start,end,smooth(t));book.hinge.rotation.y=hinge*(1-segment(t,0,.5));if(t>.5)for(const o of book.prints)o.visible=book.original.get(o)?.visible??true;dimRoom((1-t)*.48);},()=>{restoreBook(book);state.selected=-1;mode(state.listed?'list':'shelf');book.button.focus({preventScroll:true});requestRender(true);});
}
function enter(){
 if(state.mode!=='spread'||state.busy)return;const book=books[state.selected],a=pose(book.root),b=openPose(book);b.s.multiplyScalar(1.5);mode('opening');
 animate(550,t=>{put(book.root,a,b,smooth(t));$('page').style.opacity=String(segment(t,.55,1));$('page').style.visibility='visible';},()=>{mode('inside');$('page').style.opacity='';$('page').style.visibility='';$('close').focus({preventScroll:true});});
}
function listLayout(reset){
 if(!books.length)return;const qe=Math.tan(camera.fov*Math.PI/360),distance=6.6,ratio=innerHeight/(2*qe*distance),small=innerWidth<700,tallest=Math.max(...books.map(b=>b.model.look.h));
 const height=Math.max(innerHeight*(small?.42:.82),170),scale=height/(tallest*ratio),width=1.42*scale*ratio,edge=small?24:Math.max(innerWidth*.06,40),pitch=small?1.35:1.5,mid=small?innerHeight/2:innerHeight*.52;
 state.maxScroll=Math.max(0,(books.length-1)*width*pitch+width+edge*2-innerWidth);state.scroll=clamp(state.scroll,0,state.maxScroll);rows=[];
 books.forEach((book,i)=>{const h=book.model.look.h*scale*ratio,x=edge+i*width*pitch-state.scroll,y=mid-h/2,q=camera.quaternion.clone().multiply(frontRotation),p=forward(distance,(x+width/2-innerWidth/2)/ratio,-(y+h/2-innerHeight/2)/ratio).sub(new THREE.Vector3(book.model.look.t/2,book.model.look.h/2,0).multiplyScalar(scale).applyQuaternion(q));rows.push({p,q,s:new THREE.Vector3(scale,scale,scale)});if(!state.busy||reset){book.root.position.copy(p);book.root.quaternion.copy(q);book.root.scale.setScalar(scale);}});
}
function setList(enabled){
 if(!state.ready||state.busy||!['shelf','list'].includes(state.mode)||state.listed===Number(enabled))return;const starts=books.map(b=>pose(b.root));state.hover=-1;state.listed=Number(enabled);state.scroll=0;
 if(enabled)listLayout(false);const ends=enabled?rows:books.map(b=>b.home);mode(enabled?'list':'shelf');animate(1200,t=>{books.forEach((b,i)=>put(b.root,starts[i],ends[i],smooth(t)));dimRoom((enabled?t:1-t)*.92);},()=>{dimRoom(enabled?.92:0);requestRender(true);});
}
function aboutPose(){camera.position.set(.5,4.688,2.9);camera.lookAt(.5,-.512,2.9);camera.updateMatrixWorld();}
function contactPose(){const at=byPath(baseline.clock.g.path).position,cy=baseline.clock.cy||.33,q=Math.tan(camera.fov*Math.PI/360),distance=Math.max(.56/(.64*2*q),.56/(.8*2*q*camera.aspect));camera.position.set(at.x,at.y+cy+.1,at.z+distance);camera.lookAt(at.x,at.y+cy,at.z);camera.updateMatrixWorld();}
function show(name){
 if(!state.ready||state.busy||state.selected>=0||!['shelf','list'].includes(state.mode))return;state.hover=-1;const start=pose(camera),clock=byPath(baseline.clock.g.path);savedContact=pose(clock);
 if(name==='about')aboutPose();else contactPose();const end=pose(camera);camera.position.copy(start.p);camera.quaternion.copy(start.q);mode(name);
 animate(name==='about'?1000:1800,t=>{put(camera,start,end,smooth(t));if(name==='contact')clock.quaternion.copy(savedContact.q).multiply(yRotation(3*Math.PI*smooth(t)));dimRoom((name==='about'?.22:.35)*smooth(t));if(name==='about')byPath([224]).intensity=1.8*smooth(t);},()=>{$('close').focus({preventScroll:true});requestRender(true);});
}
function backToRoom(){
 const start=pose(camera);setCamera();const end=pose(camera);camera.position.copy(start.p);camera.quaternion.copy(start.q);const clock=byPath(baseline.clock.g.path),a=pose(clock),old=state.mode;
 animate(1000,t=>{put(camera,start,end,smooth(t));if(old==='contact'&&savedContact)put(clock,a,savedContact,smooth(t));dimRoom((1-t)*.35);if(old==='about')byPath([224]).intensity=1.8*(1-t);},()=>{mode(state.listed?'list':'shelf');requestRender(true);});
}
function zoom(value){if(!['shelf','list'].includes(state.mode)||state.busy||state.listed)return;const a=state.near;animate(1200,t=>{state.near=THREE.MathUtils.lerp(a,value,smooth(t));setCamera();},()=>requestRender());}
function clockTime(){if(!baseline?.clock)return;const now=new Date(),hour=now.getHours()+now.getMinutes()/60,minute=now.getMinutes()+now.getSeconds()/60;byPath(baseline.clock.hr.path).rotation.z=-hour/12*Math.PI*2;byPath(baseline.clock.mn.path).rotation.z=-minute/60*Math.PI*2;byPath(baseline.clock.sc.path).rotation.z=-now.getSeconds()/60*Math.PI*2;requestRender();}
function toggleLamp(){if(state.busy)return;const a=state.lamp,b=a>.5?0:1;animate(400,t=>{state.lamp=THREE.MathUtils.lerp(a,b,smooth(t));dimRoom(state.listed?.92:0);},()=>requestRender(true));}
async function start(){
 try{
  data=await readAsset();baseline=data.states['desktop-shelf'];if(data.content_mode!=='empty'||baseline.items.length!==11)throw new Error('Unexpected room asset');
  scene=await new THREE.ObjectLoader().parseAsync(data.scene);camera=new THREE.PerspectiveCamera(27,innerWidth/innerHeight,.2,90);
  renderer=new THREE.WebGLRenderer({canvas:$('room'),antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.localClippingEnabled=true;
  scene.userData.lights=[];const record=(o,path=[])=>{pathNodes.set(path.join('/'),o);o.children.forEach((c,i)=>record(c,[...path,i]));};record(scene);
  scene.traverse(o=>{nodes.set(o.uuid,o);if(o.isLight){o.userData.power=o.intensity;o.userData.lamp=o.type==='SpotLight'||(o.type==='PointLight'&&o.parent.type!=='Scene');scene.userData.lights.push(o);}if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.map)m.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());});
  for(const n of baseline.nodes){const o=byPath(n.path);if(o?.isLight&&o.target&&n.target){o.target.position.fromArray(n.target);if(!o.target.parent)scene.add(o.target);}}
  for(const o of scene.children)if(o.isMesh&&o.position.y>4.5&&o.position.y<5.1&&o.position.x>4){nodes.set('wall-title',o);break;}
  const blankPaper=new THREE.MeshBasicMaterial({color:0xf1ede3,toneMapped:false,side:THREE.DoubleSide});
  books=baseline.items.map((model,index)=>{
   const root=byPath(model.path),hinge=byPath(model.data.hinge.path),still=byPath(model.still.path),original=new Map(),story=stories[index];
   const coverDecal=root.children[4],spineTitle=hinge.children[6],spineSub=hinge.children[7];for(const mesh of [coverDecal,spineTitle,spineSub])if(mesh?.isObject3D)mesh.visible=false;
   // The reference caches its lamp shadow. Recomputed close-packed notebook
   // shadows otherwise blacken several spines after importing the measured mesh.
   root.traverse(o=>{original.set(o,{...pose(o),visible:o.visible});if(o.isMesh){o.userData.notebook=index;o.receiveShadow=false;targets.push(o);}});
   const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',story?.title||`دفتر خالی ${index+1}`);button.textContent=story?.title||'';button.tabIndex=index===0?0:-1;$('covers').append(button);
   const book={index,model,name:story?.title||'',title:'',storyId:story?.id||null,slug:model.name.toLowerCase(),root,hinge,still,original,home:pose(root),pull:0,button,prints:hinge.children.slice(2),paper:root.children[7],inside:hinge.children[1],storyLabels:addStoryLabels(root,hinge,story?.title||'')};still.visible=false;book.paper.material=blankPaper;book.inside.material=blankPaper;
   button.addEventListener('click',()=>open(index));button.addEventListener('focus',()=>{point(index);if(state.listed){state.scroll=clamp(index*(rows[0]?.s.x||1)*1.42*innerHeight/(2*Math.tan(27*Math.PI/360)*6.6)*1.5,0,state.maxScroll);requestRender();}});return book;
  });
  state.ready=true;resize();clockTime();renderer.render(scene,camera);$('load-progress').style.transform='scaleX(1)';document.body.classList.remove('loading');installInput();
  window.referenceRoom={state,scene,camera,renderer,books,stories,open,close,setList,show,enter,zoom,toggleLamp,render:()=>requestRender(true),setTestView(value){clearTimeout(autoApproach);tween=null;state.busy=false;state.near=value;pointer={x:0,y:0};viewPointer={x:0,y:0};setCamera();requestRender(true);},ready:true};
  const named=location.hash.slice(1).toLowerCase(),index=books.findIndex(b=>b.slug===named);if(index>=0)open(index,false);else if(!reduce())autoApproach=setTimeout(()=>zoom(1),2600);setInterval(clockTime,60000);
 }catch(error){console.error(error);document.body.classList.remove('loading');$('failure').hidden=false;document.body.dataset.error=error.message;}
}
function installInput(){
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>['shelf','list'].includes(b.dataset.view)?setList(b.dataset.view==='list'):show(b.dataset.view)));$('close').addEventListener('click',()=>close());
 document.querySelector('.mark').addEventListener('click',e=>{e.preventDefault();if(state.selected>=0)close();else if(['about','contact'].includes(state.mode))backToRoom();else{setList(false);zoom(0);}});
 let down=null;$('room').addEventListener('pointerdown',e=>{clearTimeout(autoApproach);down={x:e.clientX,y:e.clientY,scroll:state.scroll};$('room').setPointerCapture(e.pointerId);});
 $('room').addEventListener('pointermove',e=>{if(down&&state.listed&&!state.busy){state.scroll=clamp(down.scroll+down.x-e.clientX,0,state.maxScroll);point(-1);requestRender();return;}if(e.pointerType!=='touch'&&['shelf','list'].includes(state.mode)&&!state.busy){pointer={x:(e.clientX/innerWidth-.5)*2,y:(e.clientY/innerHeight-.5)*2};point(hit(e.clientX,e.clientY));requestRender();}});
 $('room').addEventListener('pointerup',e=>{if(!down)return;const d=down;down=null;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>8)return;if(state.mode==='spread'){hit(e.clientX,e.clientY)===state.selected?enter():close();return;}if(['about','contact'].includes(state.mode)){backToRoom();return;}if(state.busy)return;const i=hit(e.clientX,e.clientY);if(i>=0){open(i);return;}const cord=ray.intersectObjects(scene.children,true).find(v=>v.object.parent===byPath([201]));if(cord)toggleLamp();});
 $('room').addEventListener('pointercancel',()=>{down=null;});$('room').addEventListener('pointerleave',()=>{if(!down){pointer={x:0,y:0};point(-1);requestRender();}});
 addEventListener('wheel',e=>{clearTimeout(autoApproach);if(state.listed&&!state.busy){state.scroll=clamp(state.scroll+e.deltaY+e.deltaX,0,state.maxScroll);requestRender();}else if(Math.abs(e.deltaY)>4)zoom(e.deltaY<0?1:0);},{passive:true});
 addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();return;}if(!['shelf','list'].includes(state.mode)||e.altKey||e.ctrlKey||e.metaKey)return;const current=books.findIndex(b=>b.button===document.activeElement);if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?10:clamp((current<0?0:current)+(e.key==='ArrowRight'?1:-1),0,10);books.forEach(b=>b.button.tabIndex=b.index===next?0:-1);books[next].button.focus({preventScroll:true});}});
 addEventListener('resize',resize);addEventListener('popstate',()=>{if(!location.hash)close(false);});media.addEventListener?.('change',e=>{if(e.matches&&tween){tween.duration=0;requestRender(true);}});document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestRender();});
}
start();
