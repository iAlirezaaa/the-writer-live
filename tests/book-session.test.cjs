"use strict";
// Exercises the real reader's async and state transitions with a minimal DOM.
// Browser geometry/focus rendering is checked separately by the Playwright suite.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../web/book.js"), "utf8")
  .replace(/^import .*;\r?\n/gm, "").replace(/^export /gm, "");
let anchors,curl;
test.before(async () => {
  [anchors,curl]=await Promise.all([import("../web/reader-position.js"),import("../web/page-curl.js")]);
});
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
};
const title = () => ({kind:"title",firstPara:0,firstWord:0});
const page = (paragraph, word=0) => ({kind:"body",firstPara:paragraph,firstWord:word});
const story = id => ({id,title:id,body:"متن داستان",words:500,check:"",status:"accepted"});
const plain = value => JSON.parse(JSON.stringify(value));

function fixture() {
  const events=[],memory=new Map(),requests=new Map();
  const document={activeElement:null,fonts:null};
  function node() {
    const classes=new Set();
    return {
      handlers:{},addEventListener(name,handler){this.handlers[name]=handler;},
      hidden:false,open:false,disabled:false,tabIndex:0,isConnected:true,children:[],inert:false,dataset:{},style:{setProperty(){}},
      classList:{add(...names){names.forEach(n=>classes.add(n));},remove(...names){names.forEach(n=>classes.delete(n));},contains:n=>classes.has(n),toggle(){}},
      setAttribute(name,value){this[name]=String(value);},removeAttribute(name){delete this[name];},
      replaceChildren(...children){this.children=children;},contains(){return false;},
      querySelector(){return null;},querySelectorAll(){return [];},getClientRects(){return [{}];},
      getBoundingClientRect(){return {left:0,right:600,top:0,width:600,height:800};},
      closest(){return null;},focus(){document.activeElement=this;},select(){this.selected=true;},
      getAnimations(){return [];},remove(){this.isConnected=false;}
    };
  }
  const names=["overlay","title","pageR","pageL","prev","next","settings","margin","marginBtn","selBtn","highlightBtn","pop","voteStatus","voteUp","voteDown","closeBtn","bookEl","measure","find","bookmark"];
  const ui=Object.fromEntries(names.map(name=>[name,node()]));
  ui.overlay.hidden=true;ui.pop.hidden=true;ui.margin.hidden=true;
  const background=node(),opener=node();document.body=node();document.body.children=[background,ui.overlay];document.activeElement=opener;
  const listeners=new Map();
  const window={innerWidth:375,dispatchEvent(event){events.push(event.type);listeners.get(event.type)?.(event);},addEventListener:(name,handler)=>listeners.set(name,handler),removeEventListener:(name,handler)=>{if(listeners.get(name)===handler)listeners.delete(name);},getSelection(){return {toString:()=>""};},matchMedia(){return {matches:true};}};
  const sandbox={document,window,innerWidth:375,Event,CustomEvent:class extends Event {constructor(type,options){super(type);this.detail=options?.detail;}},Map,Set,Date,Math,Number,Boolean,String,Array,Promise,console,
    setTimeout,clearTimeout,performance,requestAnimationFrame:()=>1,cancelAnimationFrame(){},
    getComputedStyle:()=>({padding:"20px",background:"rgb(20, 20, 20)"}),
    localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)},
    sessionStorage:{getItem:()=>null},isGitHubPages:()=>true,
    getJSON(url){if(url.endsWith("/comments"))return Promise.resolve([]);const id=decodeURIComponent(url.split("/").pop());return requests.get(id)?.promise||Promise.resolve(story(id));},
    loadPublicStoryNotes:()=>Promise.resolve([]),pageAnchor:anchors.pageAnchor,locatePageByAnchor:anchors.locatePageByAnchor,
    readHighlights:()=>[],writeHighlights:(_id,values)=>values,
    angleFromPointer:curl.angleFromPointer,shouldCommit:curl.shouldCommit,
    uiFixture:ui,fetch:async()=>({ok:true,json:async()=>({})})
  };
  const context=vm.createContext(sandbox);
  vm.runInContext(source+`
    const actualRepaginate=repaginate;
    ui=uiFixture;
    applyReaderAppearance=()=>{};storeGlobalReadingOptions=()=>{};updateSyncState=()=>{};
    renderMargin=()=>{};ensureReaderFont=()=>{};restoreReadingLocation=()=>{};
    repaginate=()=>{book.pages=[{kind:"title",firstPara:0,firstWord:0},{kind:"body",firstPara:0,firstWord:0},{kind:"body",firstPara:1,firstWord:0},{kind:"body",firstPara:2,firstWord:0}];book.index=0;};
    show=()=>{};
  `,context);
  const api=vm.runInContext(`({openBook,cancelReaderOpen,close,setCloseTransition,readerState,readerKeydown,toggleBookmark,grabStart,grabMove,grabEnd,sendNote,bindSheet,layPaper,
    getBook:()=>book,setBook:value=>{book=value;ui.overlay.hidden=false;},
    getRequest:()=>readerRequest,
    getDragGoal:()=>grab?.goal,
    settleDrag(){if(grab?.t){grab.t.theta=grab.goal;grab.t.velocity=0;}},
    enableCurl(){
      window.matchMedia=()=>({matches:false});book.turnStyle="curl";
      startTurn=target=>{
        book.turning={target,forward:target>book.index,per:spread(),theta:target>book.index?0:180,velocity:0,curl:0,tilt:0,raf:0,dragging:false,width:600,hinge:600,leaf:{destroy(){}},casts:[]};
        return book.turning;
      };
      paintTurn=()=>{};
      runTurn=(turn,{commit})=>{if(commit)book.index=turn.target;endTurn();};
    },
    reflow(pages){
      storyParagraphs=()=>[];checkLines=()=>[];
      titlePage=()=>({kind:"title",firstPara:0,firstWord:0});editorialPage=()=>null;paginate=()=>pages;
      refreshReaderSections=()=>{};actualRepaginate();
    }
  })`,context);
  return {...api,ui,background,document,window,context,requests,events,memory,node,
    resolve(id){requests.get(id).resolve(story(id));},request(id){const value=deferred();requests.set(id,value);return value;}};
}

test("a slower previous story cannot replace the latest selection",async()=>{
  const f=fixture();f.request("older");f.request("latest");
  const old=f.openBook("older"),latest=f.openBook("latest");
  f.resolve("latest");assert.equal(await latest,true);
  f.resolve("older");assert.equal(await old,false);
  assert.equal(f.getBook().story.id,"latest");assert.equal(f.ui.title.textContent,"latest");
});
test("Escape during a pending load restores the shelf and late data stays closed",async()=>{
  const f=fixture();f.request("slow");
  const opening=f.openBook("slow");assert.equal(f.background.inert,true);
  f.readerKeydown({key:"Escape",preventDefault(){}});
  assert.equal(f.ui.overlay.hidden,true);assert.equal(f.background.inert,false);
  f.resolve("slow");assert.equal(await opening,false);
  assert.equal(f.ui.overlay.hidden,true);assert.equal(f.getBook(),null);
  assert.deepEqual(f.events,["writer:reading-closed"]);
});
test("a stale rejected load neither closes nor rejects the latest reader",async()=>{
  const f=fixture(),pending=f.request("stale");
  const older=f.openBook("stale");await f.openBook("latest");
  pending.reject(new Error("old network failure"));assert.equal(await older,false);
  assert.equal(f.ui.overlay.hidden,false);assert.equal(f.getBook().story.id,"latest");
});
test("a current failed load restores the background before reporting the error",async()=>{
  const f=fixture(),pending=f.request("failed");
  const opening=f.openBook("failed");pending.reject(new Error("network failure"));
  await assert.rejects(opening,/network failure/);
  assert.equal(f.ui.overlay.hidden,true);assert.equal(f.background.inert,false);
  assert.deepEqual(f.events,["writer:reading-error","writer:reading-closed"]);
});
test("an older closing transition cannot hide a newly opened story",async()=>{
  const f=fixture(),transition=deferred();await f.openBook("old");
  vm.runInContext('readerPages=()=>({left:null,right:null});',f.context);
  f.setCloseTransition(async({hideReader})=>{await transition.promise;hideReader();});
  const closing=f.close();await f.openBook("new");transition.resolve();await closing;
  assert.equal(f.getBook().story.id,"new");assert.equal(f.ui.overlay.hidden,false);
});
test("Ctrl+F reveals search and Escape leaves the settings before closing the book",async()=>{
  const f=fixture();await f.openBook("search");const summary=f.node();f.ui.settings.querySelector=()=>summary;
  f.readerKeydown({key:"f",ctrlKey:true,preventDefault(){},target:f.ui.closeBtn});
  assert.equal(f.ui.settings.open,true);assert.equal(f.document.activeElement,f.ui.find);assert.equal(f.ui.find.selected,true);
  f.readerKeydown({key:"Escape",preventDefault(){},target:f.ui.find});
  assert.equal(f.ui.settings.open,false);assert.equal(f.document.activeElement,summary);assert.equal(f.ui.overlay.hidden,false);
  f.readerKeydown({key:"Escape",preventDefault(){},target:summary});assert.equal(f.ui.overlay.hidden,true);
});
test("Tab and Shift+Tab wrap within the dialog",async()=>{
  const f=fixture();await f.openBook("focus");const first=f.node(),last=f.node();
  f.ui.overlay.querySelectorAll=()=>[first,last];f.document.activeElement=last;
  f.readerKeydown({key:"Tab",preventDefault(){}});assert.equal(f.document.activeElement,first);
  f.readerKeydown({key:"Tab",shiftKey:true,preventDefault(){}});assert.equal(f.document.activeElement,last);
});
test("a bookmark follows its paragraph after page breaks change",()=>{
  const f=fixture();const anchor={kind:"body",firstPara:1,firstWord:0};
  f.setBook({story:story("anchor"),pages:[title(),page(0),page(1),page(2)],index:2,bookmark:2,bookmarkAnchor:anchor});
  f.reflow([page(0),page(0,25),page(0,50),page(1),page(2)]);
  assert.equal(f.getBook().bookmark,4);assert.equal(f.getBook().index,4);
  assert.deepEqual(plain(f.readerState().bookmarkAnchor),anchor);
});
test("legacy numeric bookmarks acquire a stable passage anchor",()=>{
  const f=fixture();f.setBook({story:story("legacy"),pages:[title(),page(0),page(1)],index:1,bookmark:2});
  f.reflow([page(0),page(0,20),page(1)]);
  assert.equal(f.getBook().bookmark,3);
  assert.deepEqual(plain(f.getBook().bookmarkAnchor),{kind:"body",firstPara:1,firstWord:0});
});
test("responsive reflow establishes page visibility before measuring the grid",()=>{
  const f=fixture(),visibilityAtMeasurement=[];
  f.setBook({story:story("reflow-grid"),pages:[title(),page(0),page(1),page(2)],index:2,mode:"auto",bookmark:null});
  f.ui.pageL.hidden=false;
  f.ui.pageR.getBoundingClientRect=()=>{
    visibilityAtMeasurement.push(f.ui.pageL.hidden);
    // A visible second grid item must not occupy an implicit column when the
    // viewport switches to one page. Measurement is the observable contract.
    return {left:0,right:600,top:0,width:f.ui.pageL.hidden?600:300,height:800};
  };
  f.window.innerWidth=375;f.reflow([page(0),page(1),page(2)]);
  assert.equal(f.ui.measure.style.width,"600px");
  f.window.innerWidth=1440;f.reflow([page(0),page(1),page(2)]);
  assert.equal(f.ui.measure.style.width,"300px");
  assert.deepEqual(visibilityAtMeasurement,[true,false]);
});
test("the final two-page spread records complete progress",()=>{
  const f=fixture();f.window.innerWidth=1440;
  f.setBook({story:story("spread"),pages:[title(),page(0),page(1),page(2),page(3),{kind:"blank"}],index:4,mode:"spread",bookmark:null});
  assert.equal(f.readerState().progress,1);
  f.getBook().index=0;assert.equal(f.readerState().progress,0);
});
test("touch swipes remain usable with reduced motion and avoid vertical gestures",async()=>{
  const f=fixture();await f.openBook("touch");const target=f.node();
  const pointer=(x,y,type="pointerup")=>({clientX:x,clientY:y,pointerId:1,pointerType:"touch",button:0,target,type,preventDefault(){}});
  f.grabStart(pointer(200,200,"pointerdown"));f.grabMove(pointer(290,204,"pointermove"));f.grabEnd(pointer(290,204));
  assert.equal(f.getBook().index,1);
  f.grabStart(pointer(200,200,"pointerdown"));f.grabMove(pointer(205,280,"pointermove"));f.grabEnd(pointer(205,280));
  assert.equal(f.getBook().index,1);
});
test("a cancelled touch gesture never advances the book",async()=>{
  const f=fixture();await f.openBook("touch-cancel");const target=f.node();
  const pointer=(x,type)=>({clientX:x,clientY:200,pointerId:1,pointerType:"touch",button:0,target,type,preventDefault(){}});
  f.grabStart(pointer(100,"pointerdown"));f.grabMove(pointer(220,"pointermove"));f.grabEnd(pointer(220,"pointercancel"));
  assert.equal(f.getBook().index,0);
});
test("a tiny touch curl stays on its page from either side of the page",async()=>{
  for(const forward of [true,false]){
    for(const start of [150,300,450]){
      const f=fixture();await f.openBook("touch-tiny");f.enableCurl();
      f.getBook().index=forward?0:1;
      const original=f.getBook().index,target=f.node(),delta=forward?8:-8;
      const pointer=(x,type)=>({clientX:x,clientY:200,pointerId:1,pointerType:"touch",button:0,target,type,preventDefault(){}});
      f.grabStart(pointer(start,"pointerdown"));f.grabMove(pointer(start+delta,"pointermove"));
      f.settleDrag();f.grabEnd(pointer(start+delta,"pointerup"));
      assert.equal(f.getBook().index,original,`tiny ${forward?"forward":"backward"} touch at ${start}`);
    }
  }
});
test("equal touch displacement bends equally regardless of its starting position",async()=>{
  const goals=[];
  for(const start of [30,180,360]){
    const f=fixture();await f.openBook("touch-relative");f.enableCurl();const target=f.node();
    const pointer=(x,type)=>({clientX:x,clientY:200,pointerId:1,pointerType:"touch",button:0,target,type,preventDefault(){}});
    f.grabStart(pointer(start,"pointerdown"));f.grabMove(pointer(start+180,"pointermove"));
    goals.push(f.getDragGoal());
  }
  assert.ok(goals[0]>0&&goals[0]<180);
  assert.ok(goals.every(goal=>Math.abs(goal-goals[0])<1e-9));
});
test("a deliberate touch curl commits in either RTL direction",async()=>{
  for(const [start,delta,from,to] of [[150,360,0,1],[510,-360,1,0]]){
    const f=fixture();await f.openBook("touch-commit");f.enableCurl();f.getBook().index=from;const target=f.node();
    const pointer=(x,type)=>({clientX:x,clientY:200,pointerId:1,pointerType:"touch",button:0,target,type,preventDefault(){}});
    f.grabStart(pointer(start,"pointerdown"));f.grabMove(pointer(start+delta,"pointermove"));
    f.settleDrag();f.grabEnd(pointer(start+delta,"pointerup"));
    assert.equal(f.getBook().index,to);
  }
});
test("mouse curls still track the physical pointer position, independent of grab offset",async()=>{
  const goals=[];
  for(const start of [20,80]){
    const f=fixture();await f.openBook("mouse-physical");f.enableCurl();const target=f.node();
    const pointer=(x,type)=>({clientX:x,clientY:200,pointerId:1,pointerType:"mouse",button:0,target,type,preventDefault(){}});
    f.grabStart(pointer(start,"pointerdown"));f.grabMove(pointer(100,"pointermove"));goals.push(f.getDragGoal());
  }
  const expected=curl.angleFromPointer(2*(600-100)/600-1);
  assert.ok(goals.every(goal=>Math.abs(goal-expected)<1e-9));
});
test("late comment responses cannot attach to a different story",async()=>{
  const f=fixture(),response=deferred();await f.openBook("comment-source");
  f.window.THE_WRITER_FEEDBACK_API="https://feedback.invalid";
  f.ui.popName={value:"Reader"};f.ui.popText={value:"An example comment"};f.ui.pop.dataset={quote:""};f.ui.popStatus=f.node();
  f.context.fetch=()=>response.promise;
  const sending=f.sendNote({preventDefault(){}});await f.openBook("other-story");
  response.resolve({ok:true,json:async()=>({id:"note-1",text:"An example comment"})});await sending;
  assert.equal(f.getBook().comments.length,0);assert.equal(f.getBook().story.id,"other-story");
});
test("pointer cancellation never applies a paper chosen on touch-down",async()=>{
  const f=fixture();await f.openBook("paper-cancel");const sheet=f.node();
  f.bindSheet(sheet,"kraft","#c9ad85","");
  sheet.handlers.pointerdown({pointerId:1,clientX:20,clientY:20,button:0,preventDefault(){}});
  f.window.dispatchEvent({type:"pointercancel",pointerId:1,clientX:20,clientY:20});
  assert.equal(f.getBook().theme,"paper");
});
test("a replaced paper flight cannot apply its old theme after the newer choice",async()=>{
  const f=fixture();await f.openBook("paper-latest");f.window.matchMedia=()=>({matches:false});
  const choices=[];f.context.recordTheme=value=>choices.push(value);
  vm.runInContext('setReaderOption=(name,value)=>{book[name]=value;recordTheme(value);};',f.context);
  function sheet(){
    const n=f.node(),animations=[];
    n.animate=()=>{const d=deferred(),a={finished:d.promise,cancel:()=>d.reject(new Error("cancelled")),resolve:d.resolve};animations.push(a);return a;};
    n.getAnimations=()=>animations;n.animations=animations;return n;
  }
  const from={left:10,top:10,width:80,height:100},old=sheet(),latest=sheet();
  const first=f.layPaper("kraft",old,from),second=f.layPaper("night",latest,from);
  await first;assert.deepEqual(choices,[]);
  latest.animations[0].resolve();await new Promise(setImmediate);
  assert.deepEqual(choices,["night"]);
  latest.animations[1].resolve();await second;
  assert.equal(f.getBook().theme,"night");
});
