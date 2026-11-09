// The Writer — editorial library. Covers are stable per story and rendered without remote images.
import { openBook } from "./book.js?v=reader-20261109-v7";
import { applyCoverVisual, createCoverArt } from "./book-cover.js?v=reader-20261109-v7";
import { appHref, getJSON, isGitHubPages } from "./snapshot.js";
import { installPersianPresentation } from "./persian-display.js?v=observatory-20261108-v2";

const STATUS = { accepted:"پذیرفته‌شده", rejected:"ردشده", pending:"در جریان" };
const $ = id => document.getElementById(id);
const nfa = number => new Intl.NumberFormat("fa-IR").format(number);
// Match Persian and Arabic keyboard variants and ignore vowel marks in catalog search.
const searchKey = value => String(value ?? "").normalize("NFKC").replace(/[\u064B-\u065F\u0670]/g, "").replace(/ي/g, "ی").replace(/ك/g, "ک").toLocaleLowerCase("fa");
let stories = [];

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
  button.append(heading,createCoverArt(),title,subject,signature,base);
  const meta=make("div","cover-caption");
  const metaTop=make("div","cover-meta-top");
  const status=make("span",`c-status ${story.status||"pending"}`,STATUS[story.status]||story.status||"نامشخص");
  const stage=make("span","c-meta",`${nfa(story.words||0)} واژه`);
  metaTop.append(status,stage);
  const score=make("span","c-score",story.score==null?"بدون امتیاز":`امتیاز منتقد · ${nfa(story.score)}`);
  const p=savedProgress(story.id);
  const reading=make("div","cover-reading");
  const text=make("span","cover-reading-label",p>0?`ادامهٔ مطالعه · ${nfa(Math.round(p*100))}٪`:"باز کردن و مطالعه");
  const rail=make("span","c-progress-track");
  const fill=make("span","");
  fill.style.width=`${Math.round(p*100)}%`;
  rail.append(fill);
  reading.append(text,rail);
  meta.append(metaTop,score,reading);
  button.setAttribute("aria-label",`${story.title||"اثر بی‌عنوان"}، ${STATUS[story.status]||story.status||"نامشخص"}، ${story.stage||"داستان"}، ${p>0?`ادامه از ${Math.round(p*100)} درصد`:"شروع مطالعه"}`);
  button.addEventListener("click",()=>{
    const id=String(story.id||"");
    if(!id)return;
    try {
      if(decodeURIComponent(location.hash.slice(1))===id) route();
      else location.hash=encodeURIComponent(id);
    }catch{location.hash=encodeURIComponent(id)}
  });
  item.append(button,meta);
  return item;
}
function renderShelf() {
  const shelf=$("covers");
  if(!shelf)return;
  const query=searchKey($("story-search").value.trim());
  const status=$("story-status").value;
  const list=stories.filter(story=>
    (status==="all"||story.status===status) &&
    (!query||searchKey(`${story.title||""} ${story.stage||""}`).includes(query))
  );
  const sort=$("story-sort").value;
  list.sort((a,b)=>{
    if(sort==="title")return String(a.title||"").localeCompare(String(b.title||""),"fa");
    if(sort==="score")return (Number(b.score)||0)-(Number(a.score)||0);
    const dates=(Date.parse(a.created)||0)-(Date.parse(b.created)||0);
    return sort==="newest"?-dates:dates;
  });
  const cards=list.map(makeCover);
  shelf.replaceChildren(...cards);
  $("shelf-count").textContent=`${nfa(list.length)} اثر از ${nfa(stories.length)}`;
  if(!list.length)shelf.append(make("p","reading-empty",stories.length?"اثری با این جست‌وجو یا فیلتر پیدا نشد.":"هنوز داستانی در کتابخانه نیست."));
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
  $("reader-note").textContent="نسخهٔ عمومی فقط آثار مجاز به انتشار را نمایش می‌دهد. مطالعه و نشانک در مرورگر شما ذخیره می‌شوند؛ حاشیه‌نویسی در نسخهٔ محلی فعال است.";
  $("story-status").querySelector('option[value="rejected"]')?.remove();
}
$("home-link").href=appHref("");
$("story-search").addEventListener("input",renderShelf);
$("story-status").addEventListener("change",renderShelf);
$("story-sort").addEventListener("change",renderShelf);
installPersianPresentation(document.body);
showShelf().then(route).catch(()=>{
  $("shelf-count").textContent="اتصال برقرار نشد";
  $("covers").replaceChildren(make("p","reading-empty","کتابخانه در دسترس نیست. اتصال یا انتشار فایل‌های داستان را بررسی کنید."));
});
