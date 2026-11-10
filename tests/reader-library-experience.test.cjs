"use strict";
// Test source-linked, privacy-safe catalog behaviors with a minimal DOM.
// Run: node --test tests/reader-library-experience.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../web/read.js"), "utf8");
const capture = (rx, name) => {
  const hit = source.match(rx);
  assert.ok(hit, "missing production source: " + name);
  return hit[0];
};
const functions = [
  "isFavorite", "toggleFavorite", "updateFavoritesBadge", "toggleFavoritesFilter",
  "setLibraryView", "toggleLibraryTheme", "updateLibraryControls",
  "savedProgress", "make", "makeCover", "renderShelf", "resetShelfFilters",
];
const script = [
  capture(/^const STATUS = [^\n]+;/m, "status"),
  capture(/^const nfa = [^\n]+;/m, "Persian numbers"),
  capture(/^const searchKey = [^\n]+;/m, "Persian search"),
  capture(/^const favoriteKey = [^\n]+;/m, "favorite key"),
  "const $ = id => document.getElementById(id);",
  "const favoriteMemory = new Map();",
  "let stories = [];",
  "let favoritesOnly = false;",
  "let readingFilter = 'all';",
  "let libraryView = 'grid';",
  "let libraryTheme = 'light';",
  ...functions.map(name =>
    capture(new RegExp("^function " + name + "\\([^\\n]*\\)\\s*\\{[\\s\\S]*?^\\}", "m"), name)),
  "return {setStories(data){stories=data;},setReadingFilter(value){readingFilter=value;},isFavorite,toggleFavorite,renderShelf,resetShelfFilters,toggleFavoritesFilter,setLibraryView,toggleLibraryTheme,makeCover};",
].join("\n");

class Node {
  constructor(tag) {
    this.tag=tag; this.children=[]; this.attributes={}; this.handlers={};
    this.dataset={}; this.style={}; this.value=""; this.textContent="";
    this.hidden=false; this.focused=false; this.className="";
  }
  append(...children){this.children.push(...children)}
  replaceChildren(...children){this.children=children}
  setAttribute(key,value){this.attributes[key]=String(value)}
  addEventListener(event,fn){this.handlers[event]=fn}
  focus(){this.focused=true}
}
const library=[
  {id:"0005",title:"کوچه‌ی بازگشت",stage:"داستان",status:"accepted",created:"2026-11-07",words:1270},
  {id:"0003",title:"نامی که از پل برگشت",stage:"داستان",status:"accepted",created:"2026-11-06",words:1332},
];
function fixture(initial=new Map(),broken=false){
  const ids=Object.fromEntries([
    "story-search","story-status","story-sort","story-reset","story-favorites","reading-filter",
    "library-theme","library-grid","library-list","library-shelf","library-stories-count","library-progress-count",
    "library-saved-count","shelf-count","covers","library-room","library-room-clock"
  ].map(id=>[id,new Node("div")]));
  ids["story-status"].value="all";ids["story-sort"].value="newest";ids["reading-filter"].value="all";
  const body=new Node("body");
  const doc={body,getElementById:id=>ids[id],createElement:tag=>new Node(tag)};
  const localStorage={
    getItem:key=>{if(broken)throw Error("disabled");return initial.get(key)??null},
    setItem:(key,value)=>{if(broken)throw Error("disabled");initial.set(key,String(value))},
    removeItem:key=>{if(broken)throw Error("disabled");initial.delete(key)}
  };
  const api=new Function("document","localStorage","applyCoverVisual","createCoverArt","location","route",script)(
    doc,localStorage,()=>({edition:"01"}),()=>new Node("span"),{hash:""},()=>{}
  );
  api.setStories(library);
  return {...api,ids,body,initial};
}
function findByClass(node,cls){
  if(node.className===cls)return node;
  for(const x of node.children||[]){if(x&&typeof x==="object"){const found=findByClass(x,cls);if(found)return found}}
  return null;
}
test("initial RTL catalog renders cards, counters and grid",()=>{
  const f=fixture();f.renderShelf();
  assert.equal(f.ids.covers.children.length,2);
  assert.equal(f.ids.covers.dataset.view,"grid");
  assert.equal(f.ids["library-stories-count"].textContent,"۲");
  assert.equal(f.ids["library-saved-count"].textContent,"۰");
  assert.equal(f.ids["library-progress-count"].textContent,"۰");
});
test("book save button is accessible, keeps focusable card and persists by id",()=>{
  const f=fixture();f.renderShelf();
  const card=f.ids.covers.children[0];
  const save=findByClass(card,"cover-favorite");assert.ok(save);
  assert.equal(save.type,"button");assert.equal(save.attributes["aria-pressed"],"false");
  save.handlers.click();
  assert.equal(f.ids.covers.children[0],card);
  assert.equal(f.initial.get("the-writer-favorite:0005"),"1");
  assert.equal(save.attributes["aria-pressed"],"true");
  assert.equal(f.ids["library-saved-count"].textContent,"۱");
});
test("saved favorites survive a fresh catalog instance",()=>{
  const storage=new Map([["the-writer-favorite:0003","1"]]);
  const f=fixture(storage);f.renderShelf();
  assert.equal(f.isFavorite("0003"),true);
  f.toggleFavoritesFilter();
  assert.equal(f.ids.covers.children.length,1);
  assert.equal(findByClass(f.ids.covers.children[0],"c-title").textContent,library[1].title);
  assert.equal(f.ids["story-favorites"].attributes["aria-pressed"],"true");
  assert.equal(f.ids["story-reset"].hidden,false);
});
test("reading, finished and unread progress filters stay independent",()=>{
  const storage=new Map([["the-writer-reading:0003",JSON.stringify({progress:1})],["the-writer-reading:0005",JSON.stringify({progress:.4})]]);
  const f=fixture(storage);f.renderShelf();
  assert.equal(f.ids["library-progress-count"].textContent,"۱");
  f.setReadingFilter("reading");f.renderShelf();assert.equal(f.ids.covers.children.length,1);
  assert.equal(findByClass(f.ids.covers.children[0],"c-title").textContent,library[0].title);
  f.setReadingFilter("finished");f.renderShelf();assert.equal(f.ids.covers.children.length,1);
  assert.equal(findByClass(f.ids.covers.children[0],"c-title").textContent,library[1].title);
  f.setReadingFilter("unread");f.renderShelf();
  assert.equal(f.ids.covers.children[0].className,"reading-empty");
});
test("grid/list switch keeps books and stores preference",()=>{
  const f=fixture();f.renderShelf();
  f.setLibraryView("list");
  assert.equal(f.ids.covers.dataset.view,"list");
  assert.equal(f.ids["library-list"].attributes["aria-pressed"],"true");
  assert.equal(f.ids["library-list"].focused,true);
  assert.equal(f.initial.get("the-writer-library-view"),"list");
  assert.equal(f.ids.covers.children.length,2);
  f.setLibraryView("grid");
  assert.equal(f.ids.covers.dataset.view,"grid");
});
test("interactive bookshelf is an optional third mode and resets cleanly",()=>{
  const f=fixture();f.renderShelf();
  f.setLibraryView("shelf");
  assert.equal(f.ids.covers.dataset.view,"shelf");
  assert.equal(f.ids.covers.children.length,2);
  assert.equal(f.ids["library-shelf"].attributes["aria-pressed"],"true");
  assert.equal(f.ids["library-grid"].attributes["aria-pressed"],"false");
  assert.equal(f.ids["library-list"].attributes["aria-pressed"],"false");
  assert.equal(f.ids["library-shelf"].focused,true);
  assert.equal(f.initial.get("the-writer-library-view"),"shelf");
  f.setLibraryView("grid");
  assert.equal(f.ids.covers.dataset.view,"grid");
  assert.equal(f.ids["library-shelf"].attributes["aria-pressed"],"false");
  assert.equal(f.ids.covers.children.length,2);
});
test("shelf has real titled spines and preserves complete reader labels",()=>{
  const f=fixture();f.renderShelf();f.setLibraryView("shelf");
  for(const [i,story] of library.entries()){
    const card=f.ids.covers.children[i];
    const spine=findByClass(card,"shelf-spine");
    const cover=findByClass(card,"cover");
    assert.ok(spine,"Each live story needs a visible side spine");
    assert.equal(spine.textContent,story.title);
    assert.equal(spine.attributes["aria-hidden"],"true");
    assert.ok(cover.attributes["aria-label"].includes(story.title),"Keep accessible full titles");
  }
});
test("immersive room is opt-in, local-time aware and leaves other modes intact",()=>{
  const f=fixture();f.renderShelf();
  assert.equal(f.ids["library-room"].dataset.mode,"plain");
  f.setLibraryView("shelf");
  assert.equal(f.ids["library-room"].dataset.mode,"shelf");
  assert.ok(["day","night"].includes(f.ids["library-room"].dataset.light));
  assert.match(f.ids["library-room-clock"].textContent,/[۰-۹]/);
  f.setLibraryView("list");
  assert.equal(f.ids["library-room"].dataset.mode,"plain");
  assert.equal(f.ids.covers.dataset.view,"list");
});
test("shelf grows from 0 to 200 books without losing a title or favorite control",()=>{
  for(const total of [0,1,5,12,50,200]){
    const f=fixture();
    const library=Array.from({length:total},(_,i)=>({
      id:"shelf-"+i,title:"کتاب شماره "+i,stage:"داستان",
      status:"accepted",created:"2026-11-10",words:1000+i
    }));
    f.setStories(library);f.setLibraryView("shelf");
    const cards=f.ids.covers.children;
    assert.equal(cards.length,total||1);
    if(total){
      assert.equal(findByClass(cards[0],"shelf-spine").textContent,library[0].title);
      assert.equal(findByClass(cards.at(-1),"shelf-spine").textContent,library.at(-1).title);
      assert.ok(findByClass(cards[0],"cover-favorite"));
      assert.ok(findByClass(cards.at(-1),"shelf-floating-sample"));
    }
  }
});
test("dark theme changes only catalog theme, persists and toggles",()=>{
  const f=fixture();f.renderShelf();
  f.toggleLibraryTheme();
  assert.equal(f.body.dataset.libraryTheme,"dark");
  assert.equal(f.ids["library-theme"].attributes["aria-pressed"],"true");
  assert.equal(f.initial.get("the-writer-library-theme"),"dark");
  f.toggleLibraryTheme();assert.equal(f.body.dataset.libraryTheme,"light");
});
test("filter reset clears progress and favorites without changing view/theme",()=>{
  const f=fixture(new Map([["the-writer-favorite:0003","1"]]));f.renderShelf();
  f.toggleFavoritesFilter();f.setReadingFilter("unread");f.setLibraryView("list");f.toggleLibraryTheme();
  f.ids["reading-filter"].value="unread";
  f.resetShelfFilters();
  assert.equal(f.ids["reading-filter"].value,"all");
  assert.equal(f.ids.covers.children.length,2);
  assert.equal(f.ids["story-favorites"].attributes["aria-pressed"],"false");
  assert.equal(f.ids.covers.dataset.view,"list");
  assert.equal(f.body.dataset.libraryTheme,"dark");
  assert.equal(f.ids["story-search"].focused,true);
});
test("Persian search and reading estimate render without altering title",()=>{
  const f=fixture();f.ids["story-search"].value="كوچه";f.renderShelf();
  assert.equal(f.ids.covers.children.length,1);
  const card=f.ids.covers.children[0];
  assert.match(findByClass(card,"cover-estimate").textContent,/۶ دقیقه/);
  assert.equal(library[0].title,"کوچه‌ی بازگشت");
});
test("unavailable storage degrades safely without breaking shelf",()=>{
  const f=fixture(new Map(),true);
  f.renderShelf();f.toggleFavorite("0005");f.renderShelf();
  assert.equal(f.ids.covers.children.length,2);
  assert.equal(f.isFavorite("0005"),true);
  f.toggleLibraryTheme();assert.equal(f.body.dataset.libraryTheme,"dark");
});
test("new HTML controls and visible editorial styling are installed",()=>{
  const privateHtml=path.join(__dirname,"../web/read.html");
  const publicHtml=path.join(__dirname,"../read/index.html");
  const html=fs.readFileSync(fs.existsSync(privateHtml)?privateHtml:publicHtml,"utf8");
  const css=fs.readFileSync(path.join(__dirname,"../web/book.css"),"utf8");
  for(const id of ["story-favorites","reading-filter","library-grid","library-list","library-shelf","library-theme","library-explore",
    "library-stories-count","library-progress-count","library-saved-count"])
    assert.ok(html.includes('id="'+id+'"'),"missing control "+id);
  assert.match(html,/id="library-saved-count"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
  const roomModule=fs.readFileSync(path.join(__dirname,"../web/interaction-library/reader-shelf-room.js"),"utf8");
  assert.match(roomModule,/export function openShelfBook/);
  assert.match(roomModule,/dialog\.showModal\(\)/);
  assert.match(roomModule,/prefers-reduced-motion/);
  assert.match(roomModule,/readStory\(\)/);
  assert.ok(html.includes('id="library-room"'));
  assert.ok(source.includes('import("./interaction-library/reader-shelf-room.js?v=shelf-room-v4")'));
  const shelfCss=path.join(__dirname,"../web/interaction-library/reader-shelf.css");
  assert.ok(fs.existsSync(shelfCss),"The removable shelf must be a separate stylesheet");
  const immersive=fs.readFileSync(shelfCss,"utf8");
  assert.match(immersive,/\.covers\[data-view="shelf"\]/);
  assert.match(immersive,/\.covers\[data-view="grid"\]/,"Original cinematic cabinet must be the cover view");
  assert.match(immersive,/\.shelf-spine/,"New shelf should show readable side spines");
  assert.match(immersive,/\.shelf-notebook-spread/,"Shelf must open into a real notebook spread");
  assert.match(immersive,/\.library-room\[data-mode="shelf"\]/,"Dedicated room layout missing");

  assert.match(immersive,/@media \(prefers-reduced-motion:reduce\)/);
  assert.ok(html.includes("reader-shelf.css?v=reader-shelf-v5"));
  for(const selector of ['.covers[data-view="list"]','data-library-theme="dark"','.library-statbar'])
    assert.ok(css.includes(selector),"missing style "+selector);
});
