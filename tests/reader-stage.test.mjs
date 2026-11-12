import assert from 'node:assert/strict';
import test from 'node:test';
import {playOpen,playClose} from '../web/library-stage.js';

const deferred=()=>{
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
};
const flush=()=>new Promise(resolve=>setImmediate(resolve));

class FakeAnimation {
  constructor(node,frames,options,autoFinish){
    Object.assign(this,{node,frames,options,cancelled:false,playbackRate:1});
    this.result=deferred();this.finished=this.result.promise;
    if(autoFinish)this.result.resolve();
  }
  cancel(){this.cancelled=true;this.result.reject(new DOMException('Cancelled','AbortError'));}
  finish(){this.result.resolve();}
}

class FakeElement extends EventTarget {
  constructor(tag,environment){
    super();
    this.tagName=tag.toUpperCase();this.environment=environment;
    this.children=[];this.parentElement=null;this.className='';this.dataset={};
    this.attributes=new Map();this.hidden=false;this.isConnected=true;
    this.style={background:'',visibility:'',setProperty(name,value){this[name]=String(value);},removeProperty(name){const value=this[name]??'';delete this[name];return value;}};
    this.rect={left:80,top:180,width:36,height:220};
    const tokens=()=>new Set(this.className.split(/\s+/).filter(Boolean));
    const write=set=>{this.className=[...set].join(' ');};
    this.classList={
      contains:name=>tokens().has(name),
      add:(...names)=>{const set=tokens();names.forEach(name=>set.add(name));write(set);},
      remove:(...names)=>{const set=tokens();names.forEach(name=>set.delete(name));write(set);},
      toggle:(name,force)=>{const set=tokens(),add=force??!set.has(name);if(add)set.add(name);else set.delete(name);write(set);return add;},
    };
  }
  append(...nodes){for(const node of nodes){node.remove();node.parentElement=this;node.isConnected=true;this.children.push(node);}}
  appendChild(node){this.append(node);return node;}
  remove(){
    if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(node=>node!==this);
    this.parentElement=null;this.isConnected=false;
  }
  setAttribute(name,value){this.attributes.set(name,String(value));}
  getAttribute(name){return this.attributes.get(name)??null;}
  getBoundingClientRect(){return {...this.rect};}
  focus(){this.environment.document.activeElement=this;}
  scrollIntoView(){this.scrolledIntoView=true;}
  closest(selector){
    for(let node=this;node;node=node.parentElement){
      if(selector==='button'&&node.tagName==='BUTTON')return node;
    }
    return null;
  }
  animate(frames,options){
    const animation=new FakeAnimation(this,frames,options,this.environment.autoFinish);
    this.environment.animations.push(animation);return animation;
  }
}

function setup(t,{reduced=false,autoFinish=false,background='rgb(24, 18, 14)',visibility='inherit'}={}){
  const environment={reduced,autoFinish,animations:[]};
  const document={activeElement:null,createElement:tag=>new FakeElement(tag,environment)};
  environment.document=document;
  const replacements={document,window:{
    matchMedia:()=>({matches:environment.reduced}),
    addEventListener:()=>{},removeEventListener:()=>{},
    visualViewport:{addEventListener:()=>{},removeEventListener:()=>{}}
  },innerWidth:1280,innerHeight:800};
  const saved=new Map(Object.keys(replacements).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  for(const [key,value]of Object.entries(replacements))Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
  const controller=new AbortController();
  t.after(()=>{
    controller.abort();
    for(const [key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  });
  const overlay=document.createElement('div'),source=document.createElement('button');
  overlay.style.background=background;source.style.visibility=visibility;
  const geometry={x:200,y:60,w:880,h:650,single:false,background};
  const calls={measure:0,snapshot:0,reveal:0,hide:0};
  const parameters={
    overlay,source,story:{id:'public-story',title:'کتاب آزمایشی',stage:'داستان'},
    signal:controller.signal,ready:Promise.resolve(true),
    measure:()=>{calls.measure++;return geometry;},
    snapshot:()=>{calls.snapshot++;return {left:document.createElement('div'),right:document.createElement('div')};},
    reveal:()=>{calls.reveal++;},onCancel:()=>controller.abort(),
  };
  return {...environment,environment,overlay,source,geometry,calls,parameters,controller,background,visibility};
}

function descendants(root,cls){
  return root.children.flatMap(node=>[...(node.classList.contains(cls)?[node]:[]),...descendants(node,cls)]);
}
function assertRestored(f){
  assert.equal(f.source.style.visibility,f.visibility,'the source keeps its original inline visibility');
  assert.equal(f.overlay.style.background,f.background,'the overlay keeps its original inline background');
  assert.equal(descendants(f.overlay,'stage').length,0,'temporary stages are removed');
}

test('aborting a pending reader load promptly removes the stage and ignores its late completion',{timeout:2000},async t=>{
  const f=setup(t),ready=deferred();
  const opening=playOpen({...f.parameters,ready:ready.promise});
  const rejected=assert.rejects(opening,{name:'AbortError'});
  assert.equal(descendants(f.overlay,'stage').length,1);
  assert.equal(descendants(f.overlay,'stage-status')[0].getAttribute('role'),'status');
  assert.equal(f.calls.measure,0,'layout is not measured before the reader is ready');
  f.controller.abort();
  await rejected;assertRestored(f);
  ready.resolve(true);await flush();
  assert.deepEqual(f.calls,{measure:0,snapshot:0,reveal:0,hide:0});
  assert.equal(f.animations.length,0);
});

test('a rejected ready promise preserves its error and cleans up the loading UI',{timeout:2000},async t=>{
  const f=setup(t),failure=new Error('Story request failed');
  f.overlay.classList.add('book-leaving');
  await assert.rejects(playOpen({...f.parameters,ready:Promise.reject(failure)}),error=>error===failure);
  assertRestored(f);
  assert.equal(f.overlay.classList.contains('book-leaving'),true,'pre-existing overlay classes survive cleanup');
  assert.equal(f.calls.reveal,0);
  assert.equal(f.animations.length,0);
});

test('a superseded reader result never measures or reveals stale pages',{timeout:2000},async t=>{
  const f=setup(t);
  await assert.rejects(playOpen({...f.parameters,ready:Promise.resolve(false)}),{name:'AbortError'});
  assertRestored(f);
  assert.equal(f.calls.measure,0);assert.equal(f.calls.reveal,0);
});

test('cancellation during animation restores the source and cancels every outstanding animation',{timeout:2000},async t=>{
  const f=setup(t);
  const opening=playOpen(f.parameters),rejected=assert.rejects(opening,{name:'AbortError'});
  await flush();
  assert.equal(f.calls.measure,1);assert.equal(f.calls.snapshot,1);
  assert.equal(f.source.style.visibility,'hidden');
  assert.equal(f.overlay.style.background,'transparent');
  assert.equal(f.animations.length,2,'the dimmer and initial pull are both running');
  f.controller.abort();await rejected;
  assertRestored(f);
  assert.equal(f.calls.reveal,0);
  assert.ok(f.animations.every(animation=>animation.cancelled));
  for(const animation of f.animations)animation.finish();
  await flush();assert.equal(f.calls.reveal,0,'late animation completion cannot reveal cancelled content');
});

test('the loading cancel button cancels pending readiness without waiting for the network',{timeout:2000},async t=>{
  const f=setup(t),ready=deferred();
  const opening=playOpen({...f.parameters,ready:ready.promise}),rejected=assert.rejects(opening,{name:'AbortError'});
  const cancel=descendants(f.overlay,'stage-cancel')[0];
  assert.equal(f.environment.document.activeElement,cancel,'the cancel action is keyboard reachable while loading');
  cancel.dispatchEvent(new Event('click'));await rejected;
  assertRestored(f);assert.equal(f.calls.reveal,0);
  ready.resolve(true);
});

test('reduced motion waits for readiness then reveals directly without hiding the source',{timeout:2000},async t=>{
  const f=setup(t,{reduced:true}),ready=deferred();
  const opening=playOpen({...f.parameters,ready:ready.promise});
  assert.equal(f.calls.reveal,0);
  ready.resolve(true);
  assert.equal(await opening,true);
  assertRestored(f);
  assert.deepEqual(f.calls,{measure:1,snapshot:0,reveal:1,hide:0});
  assert.equal(f.animations.length,0);
});

test('a completed opening restores source visibility and releases filled animation effects',{timeout:2000},async t=>{
  const f=setup(t,{autoFinish:true});
  assert.equal(await playOpen(f.parameters),true);
  assertRestored(f);
  assert.equal(f.calls.reveal,1);
  assert.equal(f.animations.length,6,'all opening phases executed');
  assert.ok(f.animations.every(animation=>animation.cancelled),'finished fill-forwards animations are released');
});

test('an older opening cannot restore a source or overlay now owned by the closing stage',{timeout:2000},async t=>{
  const f=setup(t);
  const opening=playOpen(f.parameters),oldRejected=assert.rejects(opening,{name:'AbortError'});
  await flush();
  const oldStage=descendants(f.overlay,'stage')[0],oldAnimations=[...f.animations];
  const closingController=new AbortController();t.after(()=>closingController.abort());
  const closing=playClose({
    overlay:f.overlay,source:f.source,story:f.parameters.story,geometry:f.geometry,pages:{},
    signal:closingController.signal,hideReader:()=>{f.calls.hide++;},
  });
  const newStage=descendants(f.overlay,'stage').find(stage=>stage!==oldStage);
  assert.ok(newStage,'the replacement stage is attached immediately');
  await oldRejected;
  assert.equal(oldStage.isConnected,false);
  assert.equal(newStage.parentElement,f.overlay,'old cleanup must not remove the new stage');
  assert.equal(f.source.style.visibility,'hidden','old cleanup must not unhide the new stage’s source');
  assert.equal(f.overlay.style.background,'transparent','old cleanup must not overwrite the new stage’s backdrop');
  assert.equal(f.overlay.classList.contains('book-leaving'),true,'old cleanup must not clear the new close state');
  assert.ok(oldAnimations.every(animation=>animation.cancelled));
  assert.ok(f.animations.slice(oldAnimations.length).every(animation=>!animation.cancelled));
  closingController.abort();assert.equal(await closing,false);
  assertRestored(f);
  assert.equal(f.overlay.classList.contains('book-leaving'),false);
  assert.equal(f.calls.hide,0);assert.equal(f.calls.reveal,0);
});

test('reduced-motion closing goes straight to the final state and leaves no temporary artifacts',{timeout:2000},async t=>{
  const f=setup(t,{reduced:true});
  const closed=await playClose({
    overlay:f.overlay,source:f.source,story:f.parameters.story,geometry:f.geometry,pages:{},
    signal:f.controller.signal,hideReader:()=>{f.calls.hide++;},
  });
  assert.equal(closed,true);assert.equal(f.calls.hide,1);assert.equal(f.animations.length,0);
  assertRestored(f);
});
