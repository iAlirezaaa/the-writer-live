// The Writer — editorial library. Covers are stable per story and rendered without remote images.
import { openBook } from "./book.js?v=reader-20261109-v8";
import { applyCoverVisual, createCoverArt } from "./book-cover.js?v=reader-20261109-v7";
import { appHref, getJSON, isGitHubPages } from "./snapshot.js";
import { installPersianPresentation } from "./persian-display.js?v=observatory-20261108-v2";

const STATUS = { accepted:"پذیرفته‌شده", rejected:"ردشده", pending:"در جریان", owner_shared:"انتشار با اجازهٔ صاحب اثر" };
const $ = id => document.getElementById(id);
const nfa = number => new Intl.NumberFormat("fa-IR").format(number);
// Match Persian and Arabic keyboard variants without changing displayed titles.
const searchKey = value => String(value ?? "").normalize("NFKC").replace(/[\u0640\u064B-\u065F\u0670]/g, "").replace(/ي/g, "ی").replace(/ك/g, "ک").toLocaleLowerCase("fa");
let stories = [];
let favoritesOnly = false;
let readingFilter = "all";
let libraryView = "grid";
let libraryTheme = "light";
try {
  if(["list","shelf"].includes(localStorage.getItem("the-writer-library-view")))libraryView=localStorage.getItem("the-writer-library-view");
  if(localStorage.getItem("the-writer-library-theme")==="dark")libraryTheme="dark";
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
  button.textContent=`☆ علاقه‌مندی‌های من · ${nfa(stories.filter(story=>isFavorite(story.id)).length)}`;
}
function toggleFavoritesFilter() {
  favoritesOnly=!favoritesOnly;
  renderShelf();
  $("story-favorites").focus();
}

function setLibraryView(view) {
  if(!["grid","list","shelf"].includes(view))return;
  libraryView=view;
  try{localStorage.setItem("the-writer-library-view",view)}catch{}
  renderShelf();
  $(view==="list"?"library-list":view==="shelf"?"library-shelf":"library-grid").focus();
}
function toggleLibraryTheme() {
  libraryTheme=libraryTheme==="dark"?"light":"dark";
  try{localStorage.setItem("the-writer-library-theme",libraryTheme)}catch{}
  updateLibraryControls();
}
function updateLibraryControls() {
  const body=document.body;
  body.dataset.libraryTheme=libraryTheme;
  $("library-theme").setAttribute("aria-pressed",String(libraryTheme==="dark"));
  $("library-theme").textContent=libraryTheme==="dark"?"حالت روشن":"حالت شب";
  $("library-grid").setAttribute("aria-pressed",String(libraryView==="grid"));
  $("library-list").setAttribute("aria-pressed",String(libraryView==="list"));
  $("library-shelf").setAttribute("aria-pressed",String(libraryView==="shelf"));
  $("covers").dataset.view=libraryView;
  const room=$("library-room");
  if(room){
    room.dataset.mode=libraryView==="shelf"?"shelf":"plain";
    const hour=new Date().getHours();
    room.dataset.light=libraryTheme==="dark"||(hour<7||hour>=18)?"night":"day";
    const clock=$("library-room-clock");
    if(clock)clock.textContent=new Intl.DateTimeFormat("fa-IR",{hour:"2-digit",minute:"2-digit"}).format(new Date());
  }
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
function makeCover(story) {
  const item=make("article","cover-item");
  const button=make("button","cover");
  button.type="button";
  const visual=applyCoverVisual(button,story);
  const heading=make("span","cover-heading");
  heading.append(make("span","cover-imprint","THE WRITER"),make("span","cover-series",`EDITION  /  ${visual.edition}`));
  const title=make("span","c-title",story.title||"اثر بی‌عنوان");
  const subject=make("span","cover-subject",story.stage||"داستان");
  const signature=make("span","cover-signature","یک داستان از جهان نویسنده");
  const base=make("span","cover-bottom");
  base.append(make("span","cover-issue",`TW — ${visual.edition}`),make("span","cover-symbol","●"));
  const spine=make("span","shelf-spine",story.title||"اثر بی‌عنوان");
  spine.setAttribute("aria-hidden","true");
  button.append(heading,createCoverArt(),title,subject,signature,base,spine);
  const meta=make("div","cover-caption");
  const metaTop=make("div","cover-meta-top");
  const status=make("span",`c-status ${story.status||"pending"}`,STATUS[story.status]||story.status||"نامشخص");
  const stage=make("span","c-meta",`${nfa(story.words||0)} واژه`);
  const favoriteBtn=make("button","cover-favorite",isFavorite(story.id)?"★ ذخیره شده":"☆ ذخیره");
  favoriteBtn.type="button";
  favoriteBtn.setAttribute("aria-pressed",String(isFavorite(story.id)));
  favoriteBtn.setAttribute("aria-label",`${isFavorite(story.id)?"حذف از":"افزودن به"} علاقه‌مندی‌ها: ${story.title||"اثر بی‌عنوان"}`);
  favoriteBtn.addEventListener("click",()=>{
    const active=toggleFavorite(story.id);
    if(favoritesOnly){
      renderShelf();
      $("story-favorites").focus();
    }else{
      favoriteBtn.textContent=active?"★ ذخیره شده":"☆ ذخیره";
      favoriteBtn.setAttribute("aria-pressed",String(active));
      favoriteBtn.setAttribute("aria-label",`${active?"حذف از":"افزودن به"} علاقه‌مندی‌ها: ${story.title||"اثر بی‌عنوان"}`);
      updateFavoritesBadge();
      updateLibraryControls();
    }
  });
  metaTop.append(status,stage,favoriteBtn);
  const score=make("span","c-score",story.score==null?"بدون امتیاز":`امتیاز منتقد · ${nfa(story.score)}`);
  const p=savedProgress(story.id);
  const reading=make("div","cover-reading");
  const text=make("span","cover-reading-label",p>0?`ادامهٔ مطالعه · ${nfa(Math.round(p*100))}٪`:"باز کردن و مطالعه");
  const rail=make("span","c-progress-track");
  const fill=make("span","");
  fill.style.width=`${Math.round(p*100)}%`;
  rail.append(fill);
  reading.append(text,rail);
  const minutes=Number(story.words)>0?Math.max(1,Math.ceil(Number(story.words)/220)):0;
  const estimate=make("span","cover-estimate",minutes?`زمان تقریبی مطالعه · ${nfa(minutes)} دقیقه`:"زمان مطالعه نامشخص");
  meta.append(metaTop,score,estimate,reading);
  button.setAttribute("aria-label",`${story.title||"اثر بی‌عنوان"}، ${STATUS[story.status]||story.status||"نامشخص"}، ${story.stage||"داستان"}، ${p>0?`ادامه از ${Math.round(p*100)} درصد`:"شروع مطالعه"}`);
  button.addEventListener("click",()=>{
    const id=String(story.id||"");
    if(!id)return;
    const enter=()=>{
      try {
        if(decodeURIComponent(location.hash.slice(1))===id) route();
        else location.hash=encodeURIComponent(id);
      }catch{location.hash=encodeURIComponent(id)}
    };
    // Load the removable room interaction only when a shelf book is selected.
    // Grid/list keep their immediate, familiar reader navigation.
    if(libraryView==="shelf"){
      import("./interaction-library/reader-shelf-room.js?v=shelf-room-v4")
        .then(({openShelfBook})=>{
          if(libraryView==="shelf"&&button.isConnected)openShelfBook(button,story,enter);
        })
        .catch(()=>{if(libraryView==="shelf"&&button.isConnected)enter();});
    }else enter();
  });
  item.append(button,meta);
  if(libraryView==="shelf"){
    const preview=make("aside","shelf-floating-sample");
    preview.setAttribute("aria-hidden","true");
    preview.append(
      make("strong","",story.title||"اثر بی‌عنوان"),
      make("small","",story.stage||"داستان"),
      make("small","",`${nfa(story.words||0)} واژه · برای دیدن کتاب انتخاب کنید`)
    );
    item.append(preview);
  }
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
  $("shelf-count").textContent=`${nfa(list.length)} اثر از ${nfa(stories.length)}`;
  if(!list.length)shelf.append(make("p","reading-empty",!stories.length?"هنوز داستانی در کتابخانه نیست.":favoritesOnly?"هنوز کتابی در علاقه‌مندی‌ها نیست؛ با دکمهٔ ☆ ذخیره کنار جلد، کتابی اضافه کنید.":"کتابی با این فیلتر پیدا نشد. برای مشاهدهٔ همهٔ کتاب‌ها فیلترها را پاک کنید."));
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
async function route(){
  let id="";
  try{id=decodeURIComponent(location.hash.slice(1))}catch{location.hash="";return}
  if(!id)return;
  try{await openBook(id)}
  catch{location.hash="";}
}
async function showShelf(){
  const result=await getJSON("/api/stories");
  stories=Array.isArray(result)?result:[];
  renderShelf();
}
window.addEventListener("hashchange",route);
window.addEventListener("writer:reading-closed",renderShelf);
if(isGitHubPages()){
  $("reader-note").textContent="نسخهٔ عمومی فقط آثار مجاز به انتشار را نمایش می‌دهد. مطالعه و نشانک در مرورگر شما ذخیره می‌شوند؛ برای ثبت نظر کلی، کتاب را باز کنید؛ برای حاشیه‌نویسی بخشی از متن را انتخاب کنید.";
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
$("library-grid").addEventListener("click",()=>setLibraryView("grid"));
$("library-list").addEventListener("click",()=>setLibraryView("list"));
$("library-shelf").addEventListener("click",()=>setLibraryView("shelf"));
$("library-theme").addEventListener("click",toggleLibraryTheme);
$("library-explore").addEventListener("click",()=>{
  const reduce=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  $("library-collection").scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
  $("story-search").focus({preventScroll:true});
});
$("story-favorites").addEventListener("click",toggleFavoritesFilter);
$("story-reset").addEventListener("click",resetShelfFilters);
$("story-search").addEventListener("keydown",event=>{
  if(event.key==="Escape"){
    event.preventDefault();
    resetShelfFilters();
  }
});
installPersianPresentation(document.body);
showShelf().then(route).catch(()=>{
  $("shelf-count").textContent="اتصال برقرار نشد";
  $("covers").replaceChildren(make("p","reading-empty","کتابخانه در دسترس نیست. اتصال یا انتشار فایل‌های داستان را بررسی کنید."));
});
