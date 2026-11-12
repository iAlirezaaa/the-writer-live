/* The moment between shelf and page. The chosen book leaves its place, turns to show its cover, opens,
 * and the open book is drawn at exactly the size and position of the reading page, so the change is only a dissolve.
 */
import {applyCoverVisual,createCoverArt} from './book-cover.js?v=reader-20261109-v7';

const make=(cls,parent)=>{const n=document.createElement('div');n.className=cls;parent?.append(n);return n;};
const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const activeStages=new WeakMap(),sourceOwners=new WeakMap();
const interrupted=()=>new DOMException('Reader transition cancelled','AbortError');

// Attach rejection and abort handlers immediately: a failed/slow request must
// never strand a hidden book or leave an unhandled promise during the animation.
function waitFor(promise,signal){
 return new Promise((resolve,reject)=>{
  const settle=(fn,value)=>{signal.removeEventListener('abort',abort);fn(value);};
  const abort=()=>settle(reject,interrupted());
  Promise.resolve(promise).then(value=>settle(resolve,value),error=>settle(reject,error));
  if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});
 });
}

function transition(overlay,signal){
 const previous=activeStages.get(overlay);
 previous?.controller.abort();
 const controller=new AbortController(),animations=new Set();
 const record={controller,stage:null,source:null,visibility:'',background:previous?.background??overlay.style.background,leaving:previous?.leaving??overlay.classList.contains('book-leaving')};
 activeStages.set(overlay,record);
 const abort=()=>controller.abort();
 if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
 let speed=1;
 return {
  signal:controller.signal,
  attach(stage){record.stage=stage;},
  hideSource(source){record.source=source;record.visibility=sourceOwners.get(source)?.visibility??source.style.visibility;sourceOwners.set(source,record);source.style.visibility='hidden';},
  fast(){speed=2.6;for(const animation of animations)animation.playbackRate=speed;},
  // A viewport change invalidates the measured source and destination poses.
  // Finish any active WAAPI promises, then hand over to the already reflowed
  // real reader instead of animating toward stale screen coordinates.
  finish(){for(const animation of animations){try{if(animation.playState!=="finished")animation.finish();}catch{}}},
  animate(node,frames,options){
   if(controller.signal.aborted)return Promise.reject(interrupted());
   const animation=node.animate(frames,options);animation.playbackRate=speed;animations.add(animation);
   return waitFor(animation.finished,controller.signal);
  },
  cleanup(){
   signal?.removeEventListener('abort',abort);
   for(const animation of animations){animation.finished.catch(()=>{});animation.cancel();}
   record.stage?.remove();
   if(record.source&&sourceOwners.get(record.source)===record){record.source.style.visibility=record.visibility;sourceOwners.delete(record.source);}
   if(activeStages.get(overlay)===record){
    activeStages.delete(overlay);overlay.style.background=record.background;
    overlay.classList.toggle('book-leaving',record.leaving);
   }
  }
 };
}

// A measured pose is disposable. Resize/rotation and a newly enabled motion
// preference must settle the same journey, including paused WAAPI promises.
function observeHandoff(run){
 let needed=false;
 const invalidate=()=>{needed=true;run.finish();};
 const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 const onMotion=event=>{if(event.matches)invalidate();};
 window.addEventListener('resize',invalidate);
 window.visualViewport?.addEventListener('resize',invalidate);
 if(motion?.addEventListener)motion.addEventListener('change',onMotion);
 else motion?.addListener?.(onMotion);
 return {
  get needed(){return needed;},
  cleanup(){
   window.removeEventListener('resize',invalidate);
   window.visualViewport?.removeEventListener('resize',invalidate);
   if(motion?.removeEventListener)motion.removeEventListener('change',onMotion);
   else motion?.removeListener?.(onMotion);
  }
 };
}

/* Keep a physical portrait jacket while closed; adapt only the opened pages to
 * the reading viewport. All three axes must scale: a 2-D scale leaves the spine
 * thickness unscaled when the book turns sideways. */
export function stagePoses({spine,page,single,view,depth,faceOut=false}){
 const H=page.h,aspect=faceOut?spine.w/spine.h:.68,W=H*aspect;
 const s=spine.h/H,cx=W/2,cy=H/2;
 const spineX=spine.x+spine.w/2-cx,spineY=spine.y+spine.h/2-cy;
 const centreX=view.w/2-cx,centreY=view.h/2-cy;
 const show=Math.min(.94,view.h*.76/H,view.w*.78/W);
 const f=(x,y,z,ry,sx,sy=sx,sz=sy,rx=0)=>`translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,${z.toFixed(3)}px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(${sx.toFixed(6)},${sy.toFixed(6)},${sz.toFixed(6)})`;
 const shelfZ=faceOut?-depth*s/2:-s*W/2;
 const shelfDepth=faceOut?s:spine.w/depth;
 return {
  scale:s,modelWidth:W,
  shelf:f(spineX,spineY,shelfZ,faceOut?0:-90,s,s,shelfDepth),
  pulled:f(spineX,spineY-8,shelfZ+Math.min(100,view.w*.08),faceOut?0:-90,s,s,shelfDepth),
  shown:f(centreX,centreY,-depth*show/2,-8,show,show,show,4),
  held:f(centreX,centreY,-depth*show/2,0,show),
  // Centre-origin compensation keeps the left edge at page.x after widening.
  open:f(page.x+(page.w-W)/2,page.y,-depth/2,0,page.w/W,1,1),
  single,
 };
}

function buildBook(story,{w,h,depth,pageWidth=w},snapshot){
 const root=make('b3d');root.style.width=w+'px';root.style.height=h+'px';root.style.setProperty('--d',depth+'px');
 root.setAttribute('aria-hidden','true');root.inert=true;
 // Paginated text keeps its actual final metrics. The root's final X scale
 // cancels this adapter, so the handover does not resize or reflow the text.
 for(const page of [snapshot.left,snapshot.right])if(page){
  page.style.width=pageWidth+'px';page.style.left='0';page.style.right='auto';
  page.style.transformOrigin='0 0';page.style.transform=`scaleX(${w/pageWidth})`;
 }
 applyCoverVisual(root,story);
 make('b3d-back',root);
 const inner=make('b3d-inner',root);
 if(snapshot.left)inner.append(snapshot.left);
 make('b3d-fore',root);make('b3d-head',root);make('b3d-tail',root);
 const spine=make('b3d-spine',root);
 const label=document.createElement('span');label.textContent=story.title||'';spine.append(label);
 const cover=make('b3d-cover',root);
 const front=make('b3d-front',cover);
 const art=createCoverArt();
 const title=document.createElement('strong');title.textContent=story.title||'اثر بی‌عنوان';
 const sub=document.createElement('small');sub.textContent=story.stage||'داستان';
 front.append(art,title,sub);
 const inside=make('b3d-inside',cover);
 if(snapshot.right)inside.append(snapshot.right);
 return {root,cover,inner,inside};
}

function place(overlay,story,geometry,snapshot,stage=make('stage',overlay)){
 const dim=make('stage-dim',stage);dim.style.background=geometry.background;
 const view=make('stage-view',stage);
 const parts=buildBook(story,geometry,snapshot);
 view.append(parts.root);
 return {stage,dim,...parts};
}

/* Opens `source` (a spine on the shelf) into the reading page. `ready` resolves once the reader has laid out its pages. */
export async function playOpen({overlay,source,story,measure,ready,snapshot,reveal,signal,onCancel}){
 const run=transition(overlay,signal),stage=make('stage',overlay);run.attach(stage);
 const handoffState=observeHandoff(run);
 const controls=make('stage-controls',stage),status=make('stage-status',controls);
 status.setAttribute('role','status');status.textContent='در حال آماده‌کردن کتاب…';
 const cancel=document.createElement('button');cancel.className='stage-cancel';cancel.type='button';cancel.textContent='بازگشت به قفسه';
 cancel.addEventListener('click',()=>{onCancel?.();});controls.append(cancel);cancel.focus({preventScroll:true});
 try{
  if(await waitFor(ready,run.signal)===false)throw interrupted();
  if(run.signal.aborted)throw interrupted();
  // Per-book preferences, loaded fonts and viewport changes may have changed the
  // real page since the initial click. Measure only after layout is ready.
  const m=measure(),spine=source?.getBoundingClientRect();
  if(reduced()||!spine||!spine.width||!spine.height||typeof stage.animate!=='function'){
   reveal();return true;
  }
  status.textContent='در حال بازکردن کتاب…';
  const view={w:innerWidth,h:innerHeight},page={x:m.x,y:m.y,w:m.single?m.w:m.w/2,h:m.h};
  const faceOut=Boolean(source.closest?.('.shelf-book')?.classList.contains('is-face'));
 const scaleUp=page.h/Math.max(1,spine.height),depth=Math.max(26,Math.min(64,(faceOut?32:spine.width)*scaleUp));
  const poses=stagePoses({spine:{x:spine.left,y:spine.top,w:spine.width,h:spine.height},page,single:m.single,view,depth,faceOut});
  overlay.style.background='transparent';
  const s=place(overlay,story,{w:poses.modelWidth,h:page.h,depth,pageWidth:page.w,background:m.background},snapshot(),stage);
  run.hideSource(source);s.root.style.transform=poses.shelf;
  stage.addEventListener('pointerdown',event=>{if(!event.target.closest?.('button'))run.fast();});
  const dim=run.animate(s.dim,[{opacity:0},{opacity:1}],{duration:900,easing:'ease-in',fill:'forwards'});dim.catch(()=>{});
  const handoff=()=>{overlay.style.background='';controls.hidden=true;stage.classList.add('is-revealed');reveal();};
  if(handoffState.needed){handoff();return true;}
  await run.animate(s.root,[{transform:poses.shelf},{transform:poses.pulled}],{duration:260,easing:'cubic-bezier(.3,.05,.2,1)',fill:'forwards'});
  if(handoffState.needed){handoff();return true;}
  await run.animate(s.root,[{transform:poses.pulled},{transform:poses.shown,offset:.86},{transform:poses.held}],{duration:480,easing:'cubic-bezier(.45,.02,.2,1)',fill:'forwards'});
  if(handoffState.needed){handoff();return true;}
  await Promise.all([
   run.animate(s.cover,[{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],{duration:600,easing:'cubic-bezier(.5,.03,.22,1)',fill:'forwards',delay:40}),
   run.animate(s.root,[{transform:poses.held},{transform:poses.open}],{duration:640,easing:'cubic-bezier(.45,.02,.2,1)',fill:'forwards'}),
   dim
  ]);
  // Restore the real background before revealing the page; no shelf flash.
  handoff();
  // Never start a fresh dissolve with an already-invalidated snapshot.
  if(handoffState.needed)return true;
  await run.animate(stage,[{opacity:1},{opacity:0}],{duration:220,easing:'ease',fill:'forwards'});
  return true;
 }finally{handoffState.cleanup();run.cleanup();}
}

/* The same journey backwards: the page closes and the book goes back into its gap. */
export async function playClose({overlay,source,story,geometry,pages,hideReader,signal}){
 const run=transition(overlay,signal);
 const handoffState=observeHandoff(run);
 try{
 if(run.signal.aborted)return false;
 if(reduced()||!source||source.isConnected===false){hideReader();return true;}
 source.scrollIntoView?.({block:'nearest'});
 const spine=source.getBoundingClientRect(),view={w:innerWidth,h:innerHeight};
 // A filtered/collapsed return destination has no physical shelf pose. Do not
 // divide by its height or animate a phantom book back to the viewport origin.
 if(!(spine.width>0&&spine.height>0)||![spine.left,spine.top,spine.width,spine.height].every(Number.isFinite)){
  hideReader();return true;
 }
 const page={x:geometry.x,y:geometry.y,w:geometry.single?geometry.w:geometry.w/2,h:geometry.h};
 const faceOut=Boolean(source.closest?.('.shelf-book')?.classList.contains('is-face'));
 const scaleUp=page.h/Math.max(1,spine.height),depth=Math.max(26,Math.min(64,(faceOut?32:spine.width)*scaleUp));
 const poses=stagePoses({spine:{x:spine.left,y:spine.top,w:spine.width,h:spine.height},page,single:geometry.single,view,depth,faceOut});
 overlay.classList.add('book-leaving');overlay.style.background='transparent';
 const s=place(overlay,story,{w:poses.modelWidth,h:page.h,depth,pageWidth:page.w,background:geometry.background},pages);
 run.attach(s.stage);run.hideSource(source);
 s.root.style.transform=poses.open;s.cover.style.transform='rotateY(180deg)';
 const dim=run.animate(s.dim,[{opacity:1},{opacity:0}],{duration:900,easing:'ease-out',fill:'forwards',delay:100});dim.catch(()=>{});
 await Promise.all([
  run.animate(s.cover,[{transform:'rotateY(180deg)'},{transform:'rotateY(0deg)'}],{duration:400,easing:'cubic-bezier(.5,.03,.22,1)',fill:'forwards'}),
  run.animate(s.root,[{transform:poses.open},{transform:poses.held}],{duration:400,easing:'cubic-bezier(.45,.02,.2,1)',fill:'forwards'})
 ]);
 if(handoffState.needed){hideReader();return true;}
 await run.animate(s.root,[{transform:poses.held},{transform:poses.pulled}],{duration:380,easing:'cubic-bezier(.45,.02,.2,1)',fill:'forwards'});
 if(handoffState.needed){hideReader();return true;}
 await run.animate(s.root,[{transform:poses.pulled},{transform:poses.shelf}],{duration:220,easing:'cubic-bezier(.3,.05,.2,1)',fill:'forwards'});
 if(handoffState.needed){hideReader();return true;}
 await dim;hideReader();return true;
 }catch(error){if(error.name==='AbortError')return false;throw error;}
 finally{handoffState.cleanup();run.cleanup();}
}
