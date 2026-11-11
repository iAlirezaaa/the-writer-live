// The Writer: the library is one bookcase. A book leaves the shelf, opens, and dissolves into the reading page.
import { openBook, prepareReader, readerPages, revealReader, setCloseTransition } from "./book.js?v=library-20261111-v1";
import { applyCoverVisual, createCoverArt, coverVisual } from "./book-cover.js?v=reader-20261109-v7";
import { playOpen, playClose } from "./library-stage.js?v=library-20261111-v2";
import { appHref, getJSON, isGitHubPages } from "./snapshot.js";
import { installPersianPresentation } from "./persian-display.js?v=observatory-20261108-v2";

const STATUS = { accepted:"پذیرفته‌شده", rejected:"ردشده", pending:"در جریان", owner_shared:"با اجازهٔ صاحب اثر" };
const $ = id => document.getElementById(id);
const nfa = number => new Intl.NumberFormat("fa-IR").format(number);
// Match Persian and Arabic keyboard variants without changing displayed titles.
const searchKey = value => String(value ?? "").normalize("NFKC").replace(/[ـً-ٰٟ]/g, "").replace(/ي/g, "ی").replace(/ك/g, "ک").toLocaleLowerCase("fa");
let stories = [];
let favoritesOnly = false;
let readingFilter = "all";
let libraryTheme = "dark";
try {
  if(localStorage.getItem("the-writer-library-theme")==="light")libraryTheme="light";
}catch{}
const favoriteMemory = new Map();
const favoriteKey = id => `the-writer-favorite:${id}`;
function isFavorite(id) {
  const key=String(id??"");
  if(!key)return false;
  if(favoriteMemory.has(key))return favoriteMemory.get(key);
  try{return localStorage.getItem(favoriteKey(key))==="1"}catch{return false}
}
function toggleFavorite(id) {
  const key=String(id??"");
  if(!key)return false;
  const active=!isFavorite(key);
  favoriteMemory.set(key,active);
  try{if(active)localStorage.setItem(favoriteKey(key),"1");else localStorage.removeItem(favoriteKey(key))}catch{}
  return active;
}
function updateFavoritesBadge() {
  const button=$("story-favorites");
  button.setAttribute("aria-pressed",String(favoritesOnly));
  button.textContent=`نشان‌شده‌ها · ${nfa(stories.filter(story=>isFavorite(story.id)).length)}`;
}
function toggleFavoritesFilter() {
  favoritesOnly=!favoritesOnly;
  renderShelf();
  $("story-favorites").focus();
}
function toggleLibraryTheme() {
  libraryTheme=libraryTheme==="dark"?"light":"dark";
  try{localStorage.setItem("the-writer-library-theme",libraryTheme)}catch{}
  updateLibraryControls();
}
function updateLibraryControls() {
  document.body.dataset.libraryTheme=libraryTheme;
  paintRoom();
  $("library-theme").setAttribute("aria-pressed",String(libraryTheme==="light"));
  $("library-stories-count").textContent=nfa(stories.length);
  $("library-progress-count").textContent=nfa(stories.filter(story=>{const p=savedProgress(story.id);return p>0 && p<1}).length);
  $("library-saved-count").textContent=nfa(stories.filter(story=>isFavorite(story.id)).length);
}
function savedProgress(id) {
  if (id == null) return 0;
  try {
    const value = JSON.parse(localStorage.getItem(`the-writer-reading:${id}`) || "{}");
    return Math.max(0, Math.min(1, Number(value?.progress) || 0));
  } catch { return 0; }
}
function make(tag, cls, value) {
  const node=document.createElement(tag);
  if(cls) node.className=cls;
  if(value != null) node.textContent=String(value);
  return node;
}
function minutesOf(story){return Number(story.words)>0?Math.max(1,Math.ceil(Number(story.words)/220)):0;}

/* A book's size says something true: thickness follows its word count, height its form. */
function bookShape(story,index){
  const words=Math.max(80,Number(story.words)||400);
  const thickness=Math.round(Math.max(26,Math.min(66,20+Math.log2(words/120)*8.5)));
  const form=String(story.format||story.stage||"");
  const tall=/novel|رمان/i.test(form)?1:/flash|کوتاه/i.test(form)?.84:.92;
  const seed=[...String(story.id||index)].reduce((a,c)=>(a*31+c.codePointAt(0))>>>0,7);
  return {thickness,height:Math.min(1,tall+((seed%7)-3)/100),faceOut:index%12===0};
}
function paintFavorite(button,active,title){
  button.setAttribute("aria-pressed",String(active));
  button.setAttribute("aria-label",`${active?"برداشتن نشان":"نشان کردن"}: ${title}`);
  button.title=active?"برداشتن نشان":"نشان کردن";
}
function makeCover(story, index=0) {
  const title=story.title||"اثر بی‌عنوان",shape=bookShape(story,index),p=savedProgress(story.id);
  const item=make("article","shelf-book");
  item.dataset.key=String(story.key??story.id??index);
  item.style.setProperty("--book-h",shape.height);
  const button=make("button","cover");button.type="button";button.tabIndex=-1;
  applyCoverVisual(button,story);
  if(shape.faceOut){
    item.classList.add("is-face");
    button.append(createCoverArt(),make("span","c-title",title),make("span","cover-subject",story.stage||"داستان"));
  }else{
    item.style.setProperty("--book-w",shape.thickness+"px");
    button.append(make("span","shelf-spine",title),make("span","spine-mark",coverVisual(story).edition));
  }
  if(p>0&&p<1){const ribbon=make("span","book-progress-ribbon");ribbon.style.setProperty("--p",p);button.append(ribbon);}
  if(p>=1)item.classList.add("is-finished");
  if(story.status==="rejected")item.classList.add("is-rejected");
  button.setAttribute("aria-label",`${title}، ${STATUS[story.status]||story.status||"نامشخص"}، ${story.stage||"داستان"}، ${p>0?`ادامه از ${Math.round(p*100)} درصد`:"شروع خواندن"}`);
  button.addEventListener("click",()=>openFromShelf(story,button));
  const favoriteBtn=make("button","cover-favorite");favoriteBtn.type="button";favoriteBtn.tabIndex=-1;
  paintFavorite(favoriteBtn,isFavorite(story.id),title);
  favoriteBtn.addEventListener("click",event=>{
    event.stopPropagation();
    const active=toggleFavorite(story.id);
    if(favoritesOnly)renderShelf();
    else{paintFavorite(favoriteBtn,active,title);updateFavoritesBadge();updateLibraryControls();}
  });
  item.append(button,favoriteBtn);
  item._story=story;
  return item;
}
function renderShelf() {
  const shelf=$("covers");
  if(!shelf)return;
  const query=searchKey($("story-search").value.trim());
  const status=$("story-status").value;
  const list=stories.filter(story=>
    (!favoritesOnly||isFavorite(story.id)) &&
    (readingFilter==="all"||(readingFilter==="unread"&&savedProgress(story.id)===0)||(readingFilter==="reading"&&savedProgress(story.id)>0&&savedProgress(story.id)<1)||(readingFilter==="finished"&&savedProgress(story.id)>=1)) &&
    (status==="all"||story.status===status) &&
    (!query||searchKey(`${story.title||""} ${story.stage||""}`).includes(query))
  );
  const sort=$("story-sort").value;
  $("story-reset").hidden=!(query||status!=="all"||sort!=="newest"||favoritesOnly||readingFilter!=="all");
  updateFavoritesBadge();
  updateLibraryControls();
  list.sort((a,b)=>{
    if(sort==="title")return String(a.title||"").localeCompare(String(b.title||""),"fa");
    if(sort==="score")return (Number(b.score)||0)-(Number(a.score)||0);
    const dates=(Date.parse(a.created)||0)-(Date.parse(b.created)||0);
    return sort==="newest"?-dates:dates;
  });
  const cards=list.map(makeCover);
  shelf.replaceChildren(...cards);
  $("shelf-count").textContent=list.length===stories.length?`${nfa(stories.length)} اثر از ${nfa(stories.length)}`:`${nfa(list.length)} اثر از ${nfa(stories.length)}`;
  if(!list.length)shelf.append(make("p","reading-empty",!stories.length?"هنوز کتابی روی قفسه نیست.":favoritesOnly?"هنوز کتابی نشان نکرده‌اید. روی کتاب بروید و روبان بالایش را بزنید.":"کتابی با این جست‌وجو پیدا نشد."));
}
function resetShelfFilters(){
  $("story-search").value="";
  $("story-status").value="all";
  $("story-sort").value="newest";
  favoritesOnly=false;
  readingFilter="all";
  $("reading-filter").value="all";
  renderShelf();
  $("story-search").focus();
}

/* ---- after every render: shelves, labels, the empty places, and books gliding to their new spots ---- */
let lastPositions=new Map(),arranging=false;
const motionOK=()=>!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
function shelfLabel(story){
  const sort=$("story-sort").value;
  if(!story)return "";
  if(sort==="title")return `از «${String(story.title||"").trim().charAt(0)}»`;
  if(sort==="score")return `امتیاز ${nfa(Math.round(Number(story.score)||0))}`;
  const d=Date.parse(story.created);
  return Number.isFinite(d)?new Intl.DateTimeFormat("fa-IR-u-ca-persian",{month:"long",year:"numeric"}).format(d):"";
}
const OBJECTS=["frame","stack","box","vase"];
function arrangeShelf(){
  const shelf=$("covers");
  if(arranging)return;
  arranging=true;
  shelf.querySelectorAll(".shelf-ghost,.shelf-plaque,.shelf-object").forEach(n=>n.remove());
  const books=[...shelf.querySelectorAll(".shelf-book")];
  // A working shelf is not only books: every couple of dozen, something else is kept there.
  books.forEach((b,i)=>{if(i&&i%23===17){const o=make("span",`shelf-object is-${OBJECTS[Math.floor(i/23)%OBJECTS.length]}`);o.setAttribute("aria-hidden","true");o.append(make("i",""));b.after(o);}});
  const box=shelf.getBoundingClientRect();
  // Rows, read straight from layout.
  const rows=[];
  for(const b of books){const top=b.offsetTop;let row=rows.at(-1);if(!row||Math.abs(row.top-top)>4){row={top,books:[]};rows.push(row);}row.books.push(b);}
  // Each shelf carries a small brass label for what starts on it.
  const rail=$("shelf-rail");rail.replaceChildren();
  rows.forEach((row,i)=>{
    const label=shelfLabel(row.books[0]?._story);
    const plaque=make("span","shelf-plaque",label);plaque.setAttribute("aria-hidden","true");
    plaque.style.top=(row.top+row.books[0].offsetHeight)+"px";
    shelf.append(plaque);
    const jump=make("button","",nfa(i+1));jump.type="button";jump.title=label;jump.setAttribute("aria-label",`قفسهٔ ${nfa(i+1)} ${label}`);
    jump.addEventListener("click",()=>row.books[0].scrollIntoView({behavior:motionOK()?"smooth":"auto",block:"center"}));
    rail.append(jump);
  });
  rail.hidden=rows.length<4;
  // Empty places: the rest of the last shelf, and one shelf more, drawn as dust outlines.
  const last=books.at(-1);
  if(last){
    const rowEnd=last.offsetLeft;
    let room=rowEnd-16,seed=books.length*7+3;
    const ghost=()=>{seed=(seed*1103515245+12345)&0x7fffffff;const w=26+seed%28,g=make("span","shelf-ghost");g.setAttribute("aria-hidden","true");g.style.setProperty("--book-w",w+"px");g.style.setProperty("--book-h",.8+(seed%18)/100);shelf.append(g);return w+3;};
    while(room>40)room-=ghost();
    let extra=box.width-32;
    while(extra>40)extra-=ghost();
  }
  // FLIP: every book that moved glides from where it was.
  const next=new Map();
  for(const b of books){
    const r=b.getBoundingClientRect(),key=b.dataset.key,was=lastPositions.get(key);
    next.set(key,{x:r.left+scrollX,y:r.top+scrollY});
    if(!motionOK())continue;
    if(was){const dx=was.x-(r.left+scrollX),dy=was.y-(r.top+scrollY);if(Math.abs(dx)+Math.abs(dy)>2)b.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:"none"}],{duration:520,easing:"cubic-bezier(.3,.7,.2,1)"});}
    else if(lastPositions.size)b.animate([{opacity:0,transform:"translateY(26px)"},{opacity:1,transform:"none"}],{duration:380,easing:"ease-out"});
  }
  lastPositions=next;
  // Keyboard: one tab stop for the whole case, arrows move along the books.
  const buttons=books.map(b=>b.querySelector(".cover"));
  if(buttons.length&&!buttons.some(b=>b.tabIndex===0))buttons[0].tabIndex=0;
  queueMicrotask(()=>{arranging=false;});
  updateContinue();
}
function updateContinue(){
  const button=$("lib-continue");
  const list=stories.filter(s=>{const p=savedProgress(s.id);return p>0&&p<1;});
  const current=list.sort((a,b)=>readStamp(b.id)-readStamp(a.id))[0];
  button.hidden=!current;
  if(current){button.textContent=`ادامهٔ «${current.title}» از ${nfa(Math.round(savedProgress(current.id)*100))}٪`;button.onclick=()=>{const el=sourceFor(current);if(el)openFromShelf(current,el);else location.hash=encodeURIComponent(String(current.id));};}
}
function readStamp(id){try{return Date.parse(JSON.parse(localStorage.getItem(`the-writer-reading:${id}`)||"{}").updated)||0}catch{return 0}}
function sourceFor(story){return [...$("covers").querySelectorAll(".shelf-book")].find(b=>b._story?.id===story.id)?.querySelector(".cover")||null;}

/* ---- the room: the window shows this hour over Civita, the clock is real ---- */
const SKIES=[[0,"#0b1224","#1c2a44","#141c2c","#0c121c"],[6,"#3c5a8c","#f0b37e","#6a6f7c","#39404a"],[9,"#5f9ad2","#cfe3ef","#8fa3a0","#59705f"],[17,"#4b6aa0","#f6b27a","#7a7482","#47454f"],[20,"#16203c","#6a4a6a","#262c40","#161b28"]];
function paintRoom(){
  const now=new Date(),hour=now.getHours()+now.getMinutes()/60,style=document.body?.style;
  if(!style?.setProperty)return;
  const sky=[...SKIES].reverse().find(s=>hour>=s[0])||SKIES[0],day=hour>=7&&hour<18;
  style.setProperty("--sky-a",sky[1]);style.setProperty("--sky-b",sky[2]);style.setProperty("--hill-far",sky[3]);style.setProperty("--hill-near",sky[4]);
  style.setProperty("--window-lit",day?"transparent":"#ffcf86");style.setProperty("--bridge",day?"#d9d6cc":"#3a4150");style.setProperty("--sun",day?"#fff6df":"#e8ecf5");style.setProperty("--shaft",day?".5":"0");
  const h=$("clock-h"),m=$("clock-m");
  if(h?.style&&m?.style){h.style.transform=`rotate(${(hour%12)*30}deg)`;m.style.transform=`rotate(${now.getMinutes()*6}deg)`;}
}
setInterval(paintRoom,30000);

/* ---- the note that appears over a book you are looking at ---- */
let talkerTimer=null;
function showTalker(item){
  const story=item._story,talker=$("shelf-talker");
  if(!story||matchMedia("(hover:none)").matches)return;
  clearTimeout(talkerTimer);
  const minutes=minutesOf(story),p=savedProgress(story.id);
  const facts=[story.stage||"داستان",minutes?`${nfa(minutes)} دقیقه`:"",story.score==null?"":`امتیاز منتقد ${nfa(Math.round(Number(story.score)))}`].filter(Boolean).join(" · ");
  talker.replaceChildren(make("strong","",story.title||"اثر بی‌عنوان"),make("span","",facts),make("em","",p>=1?"خوانده‌اید":p>0?`تا ${nfa(Math.round(p*100))}٪ خوانده‌اید`:story.status==="rejected"?"منتقد نپذیرفت":"برای خواندن بزنید"));
  talker.hidden=false;
  const r=item.getBoundingClientRect(),w=talker.offsetWidth,h=talker.offsetHeight;
  talker.style.left=Math.max(10,Math.min(innerWidth-w-10,r.left+r.width/2-w/2))+"px";
  talker.style.top=Math.max(70,r.top-h-14)+"px";
  talker.classList.add("is-on");
}
function hideTalker(){const t=$("shelf-talker");t.classList.remove("is-on");clearTimeout(talkerTimer);talkerTimer=setTimeout(()=>{t.hidden=true;},180);}

/* ---- opening ---- */
let opening=false,openStory=null,openSource=null;
async function openFromShelf(story,source){
  const id=String(story.id||"");
  if(!id||opening)return;
  opening=true;hideTalker();
  openStory=story;openSource=source;
  try{
    history.replaceState(null,"",`#${encodeURIComponent(id)}`);
    const measure=()=>prepareReader();
    const geometry=measure();
    const ready=openBook(id,{staged:true});
    await playOpen({overlay:geometry.overlay,source,story,measure:()=>geometry,ready,snapshot:()=>readerPages(),reveal:revealReader});
  }catch{
    source.style.visibility="";revealReader();
  }finally{opening=false;}
}
async function route(){
  let id="";
  try{id=decodeURIComponent(location.hash.slice(1))}catch{location.hash="";return}
  if(!id||opening)return;
  try{
    const story=stories.find(s=>String(s.id)===id);
    openStory=story||null;openSource=story?sourceFor(story):null;
    await openBook(id);
  }catch{location.hash="";}
}
setCloseTransition(async({overlay,geometry,pages,hideReader})=>{
  const source=openSource?.isConnected?openSource:openStory?sourceFor(openStory):null;
  await playClose({overlay,source,story:openStory||{},geometry,pages,hideReader});
  history.replaceState(null,"",location.pathname+location.search);
});

async function showShelf(){
  const result=await getJSON("/api/stories");
  stories=Array.isArray(result)?result:[];
  // Local preview of a full case: ?demo=100 repeats the real books. Never on a public host.
  const demo=Number(new URLSearchParams(location.search).get("demo"));
  if(demo>0&&["127.0.0.1","localhost"].includes(location.hostname)&&stories.length){
    const base=stories;stories=Array.from({length:demo},(_,i)=>({...base[i%base.length],key:"demo-"+i,words:Number(base[i%base.length].words)*(1+(i*37%90)/9)}));
  }
  renderShelf();
}
new MutationObserver(records=>{
  if(arranging)return;
  if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.classList?.contains("shelf-book")||n.classList?.contains("reading-empty"))))arrangeShelf();
}).observe($("covers"),{childList:true});
let resizeTimer=null;
window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{lastPositions=new Map();arrangeShelf();},180);});
window.addEventListener("hashchange",route);
window.addEventListener("writer:reading-closed",()=>{renderShelf();});
if(isGitHubPages()){
  $("reader-note").hidden=false;$("reader-note").textContent="نسخهٔ عمومی فقط آثار مجاز به انتشار را نمایش می‌دهد. پیشرفت و نشان‌ها در مرورگر شما می‌مانند.";
  $("story-status").querySelector('option[value="rejected"]')?.remove();
}
$("home-link").href=appHref("");
$("story-search").addEventListener("input",renderShelf);
$("story-status").addEventListener("change",renderShelf);
$("story-sort").addEventListener("change",renderShelf);
$("reading-filter").addEventListener("change",value=>{
  readingFilter=$("reading-filter").value;
  renderShelf();
});
$("library-theme").addEventListener("click",()=>{
  const cord=$("library-theme");
  if(motionOK())cord.firstElementChild.animate([{transform:"none"},{transform:"translateY(16px)",offset:.35},{transform:"translateY(-3px)",offset:.7},{transform:"none"}],{duration:520,easing:"ease-out"});
  toggleLibraryTheme();
});
$("story-favorites").addEventListener("click",toggleFavoritesFilter);
$("story-reset").addEventListener("click",resetShelfFilters);
$("story-search").addEventListener("keydown",event=>{
  if(event.key==="Escape"){
    event.preventDefault();
    resetShelfFilters();
  }
});
$("library-filter-toggle").addEventListener("click",()=>{
  const panel=$("library-filters"),open=panel.hidden;
  panel.hidden=!open;
  $("library-filter-toggle").setAttribute("aria-expanded",String(open));
  if(open)$("story-search").focus();
});
const covers=$("covers");
covers.addEventListener("pointerover",e=>{const b=e.target.closest(".shelf-book");if(b)showTalker(b);});
covers.addEventListener("pointerout",e=>{if(!e.relatedTarget?.closest?.(".shelf-book"))hideTalker();});
covers.addEventListener("focusin",e=>{const b=e.target.closest(".shelf-book");if(b)showTalker(b);});
covers.addEventListener("focusout",hideTalker);
covers.addEventListener("keydown",e=>{
  const item=e.target.closest?.(".shelf-book");
  if(!item)return;
  if(e.key==="f"||e.key==="ب"){item.querySelector(".cover-favorite").click();return;}
  const list=[...covers.querySelectorAll(".shelf-book")],i=list.indexOf(item);
  const step={ArrowLeft:1,ArrowRight:-1,Home:-i,End:list.length-1-i}[e.key];
  let next=step==null?null:list[i+step];
  if(e.key==="ArrowUp"||e.key==="ArrowDown"){
    const dir=e.key==="ArrowDown"?1:-1,x=item.getBoundingClientRect().left;
    const others=list.filter(b=>Math.sign(b.offsetTop-item.offsetTop)===dir);
    const row=others.length?(dir>0?others[0].offsetTop:others.at(-1).offsetTop):null;
    next=others.filter(b=>b.offsetTop===row).sort((a,b)=>Math.abs(a.getBoundingClientRect().left-x)-Math.abs(b.getBoundingClientRect().left-x))[0];
  }
  if(!next)return;
  e.preventDefault();
  item.querySelector(".cover").tabIndex=-1;
  const button=next.querySelector(".cover");button.tabIndex=0;button.focus();
});
installPersianPresentation(document.body);
updateLibraryControls();
showShelf().then(route).catch(()=>{
  $("shelf-count").textContent="اتصال برقرار نشد";
  $("covers").replaceChildren(make("p","reading-empty","کتابخانه در دسترس نیست. اتصال یا انتشار فایل‌های داستان را بررسی کنید."));
});
