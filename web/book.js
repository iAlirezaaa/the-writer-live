/* The book reader. A story opens as a book: a title page, the text set on paper pages (two pages side by side
   on wide screens), the critic's report at the back, and a margin with readers' notes. Any reader can select
   a passage and leave a note on it; notes on a passage are highlighted in the text. All text goes through
   textContent / text nodes, never innerHTML.

   Page turning (Persian book, right to left): a forward turn lifts the left page over the spine onto the right;
   a back turn is the same movement in reverse. The sheet is a chain of bending strips (page-curl.js), and it can
   be taken by its edge and carried by hand. Reduced-motion preferences get an instant swap instead. */

const STATUS_FA = { accepted: "پذیرفته", rejected: "رد شده", owner_shared: "منتشرشده با اجازهٔ صاحب اثر · در انتظار نقد" };
/* A margin note is a claim about a passage, so the writer is allowed to distrust it. The four states come
   straight from comments.state_of() and say honestly how far the note may be trusted — "unverified" means the
   passage was looked for in the real page but no model was awake to judge the claim, and the panel says so. */
const MARGIN_STATE_FA = {
  unchecked: "هنوز سنجیده نشده",
  verified: "با متنِ امروز جور است",
  unverified: "جای گذاره پیدا شد؛ ادعا سنجیده نشده",
  suspect: "مردود: با متن نمی‌خواند",
};
import { getJSON, isGitHubPages } from "./snapshot.js";
import { openPublicFeedback, openPublicVote, loadPublicStoryNotes } from "./feedback.js?v=reader-feedback-3";
import { applyCoverVisual, createCoverArt } from "./book-cover.js?v=reader-20261109-v7";
import { pageAnchor, locatePageByAnchor } from "./reader-position.js";
import { createLeaf, angleFromPointer, shouldCommit } from "./page-curl.js?v=library-20261111-v1";
let ui = null;          // the overlay, built once
let book = null;        // { story, comments, pages, index, turning }
let flipMs = 460;
let closeTransition = null;
let closing = false;
const PAPERS = [["paper","کرم","#f7f0e0",""],["ivory","عاج","#fcfaf3",""],["linen","کتان","#e9e6da","var(--tex-weave)"],["rice","دست‌ساز","#efe6d0","var(--tex-rice)"],["kraft","کرافت","#c9ad85",""],["ink","سنگ","#dcdad0",""],["night","شب","#1d2329",""]];
const PAPER_NAMES = PAPERS.map(p=>p[0]);

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const normalize = (s) => s.replace(/\s+/g, " ").trim();
const ownerToken = () => { try { return sessionStorage.getItem("the-writer-owner-token") || ""; } catch { return ""; } };
async function ownerPost(path, body) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(ownerToken() ? { "X-Admin-Token": ownerToken() } : {}) },
    body: JSON.stringify(body || {}),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(String(data.error || data.why || `کد ${r.status}`));
  return data;
}

function build() {
  const overlay = el("div", "book-overlay"); overlay.hidden = true;
  overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true");
  const bar = el("div", "book-bar");
  const title = el("span", "book-bar-title");
  const tools = el("div", "book-tools");
  const marginBtn = el("button", "", "حاشیه‌ها");
  const voteUp = el("button","reader-vote","پسندیدم");voteUp.type="button";
  voteUp.setAttribute("aria-label","پسندیدن این داستان");
  const voteDown = el("button","reader-vote","نپسندیدم");voteDown.type="button";
  voteDown.setAttribute("aria-label","نپسندیدن این داستان");
  const voteStatus = el("span","reader-vote-status","");
  voteStatus.setAttribute("role","status");
  const smallerBtn = el("button", "reader-font", "A−"); smallerBtn.title = "کوچک‌تر کردن نوشته"; smallerBtn.setAttribute("aria-label", smallerBtn.title);
  const largerBtn = el("button", "reader-font", "A+"); largerBtn.title = "بزرگ‌تر کردن نوشته"; largerBtn.setAttribute("aria-label", largerBtn.title);
  const find = el("input", "reader-find"); find.type = "search"; find.placeholder = "جست‌وجو در کتاب"; find.setAttribute("aria-label", find.placeholder);
  const themeSelect = el("select", "reader-theme");
  themeSelect.setAttribute("aria-label", "رنگ و نور صفحهٔ مطالعه");
  for(const [value,label] of PAPERS){
    const opt=el("option","",label);opt.value=value;themeSelect.appendChild(opt);
  }
  let preferredTheme="paper";
  try{preferredTheme=localStorage.getItem("the-writer-reader-theme")||"paper";}catch{}
  if(!PAPER_NAMES.includes(preferredTheme))preferredTheme="paper";
  themeSelect.value=preferredTheme;
  overlay.dataset.readerTheme=preferredTheme;
  const focusBtn=el("button", "reader-focus", "حالت تمرکز");
  focusBtn.type="button";focusBtn.setAttribute("aria-pressed","false");
  // Keep the toolbar compact: advanced type controls live in an accessible
  // native details menu instead of occupying the whole reading-room header.
  const settings = el("details", "reader-settings");
  const summary = el("summary", "", "ظاهر");
  const settingsPanel = el("div", "reader-settings-panel");
  function picker(name, choices) {
    const label=el("label", "reader-setting");
    label.append(el("span","",name));
    const select=el("select","");
    for(const [value,text] of choices){const option=el("option","",text);option.value=value;select.append(option);}
    label.append(select);
    settingsPanel.append(label);
    return select;
  }
  const fontSelect=picker("قلم فارسی",[
    ["vazir-classic","وزیر · Vazir"],["vazir","وزیرمتن · Vazirmatn"],
    ["naskh","نسخ · Noto Naskh"],["amiri","امیری · Amiri"]
  ]);
  const leadingSelect=picker("فاصلهٔ خطوط",[
    ["compact","فشرده"],["normal","معمولی"],["airy","باز"]
  ]);
  const marginsSelect=picker("حاشیهٔ صفحه",[
    ["narrow","کم"],["normal","معمولی"],["wide","زیاد"]
  ]);
  const alignSelect=picker("چینش متن",[
    ["justify","دوطرفه"],["right","راست‌چین"]
  ]);
  const modeSelect=picker("نمای کتاب",[
    ["auto","خودکار"],["single","تک‌صفحه‌ای"],["spread","دوصفحه‌ای روی نمایشگر بزرگ"]
  ]);
  const themeLabel=el("label","reader-setting");
  themeLabel.append(el("span","","رنگ صفحه"),themeSelect);
  settingsPanel.append(themeLabel);
  const typeButtons=el("div","reader-type-size");
  typeButtons.append(el("span","","اندازهٔ نوشته"),smallerBtn,largerBtn);
  settingsPanel.append(typeButtons);
  const syncBtn=el("button","reader-sync-button","اتصال مالک و همگام‌سازی");
  syncBtn.type="button";
  syncBtn.hidden=isGitHubPages();
  settingsPanel.append(syncBtn);
  settings.append(summary,settingsPanel);
  const closeBtn = el("button", "reader-close", "بستن");
  // The bar holds only what a reader reaches for mid-page; the rest waits in the settings sheet.
  const findLabel=el("label","reader-setting reader-setting-find");
  findLabel.append(el("span","","جست‌وجو در متن"),find);
  const voteRow=el("div","reader-setting reader-votes");
  voteRow.append(el("span","","نظر شما"),voteUp,voteDown,voteStatus);
  const focusRow=el("div","reader-setting");
  focusRow.append(el("span","","تمرکز"),focusBtn);
  settingsPanel.prepend(findLabel);
  settingsPanel.append(focusRow,voteRow);
  const fullBtn=el("button","reader-full","تمام‌صفحه");fullBtn.type="button";
  fullBtn.addEventListener("click",()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});});
  tools.append(marginBtn, settings, fullBtn, closeBtn);
  const turnSelect=picker("شیوهٔ ورق خوردن",[["curl","ورق واقعی"],["slide","محو نرم"],["none","بی‌حرکت"]]);
  const speedSelect=picker("سرعت ورق",[["slow","آرام"],["normal","معمولی"],["fast","تند"]]);
  const soundSelect=picker("صدای کاغذ",[["off","بی‌صدا"],["on","با صدا"]]);
  const fontRange=el("input");fontRange.type="range";fontRange.min="0.85";fontRange.max="1.65";fontRange.step="0.01";fontRange.setAttribute("aria-label","اندازهٔ نوشته");
  const lampRange=el("input");lampRange.type="range";lampRange.min="0";lampRange.max="1";lampRange.step="0.01";lampRange.setAttribute("aria-label","گرمای نور مطالعه");
  const segments=composePanel({settings,settingsPanel,fontSelect,leadingSelect,marginsSelect,alignSelect,modeSelect,turnSelect,speedSelect,soundSelect,fontRange,lampRange,findLabel,focusRow,voteRow,syncBtn});
  bar.append(title, tools);
  const shelf = el("div", "book-shelf");
  const bookEl = el("div", "book");
  const pageR = el("div", "page page-right");
  const pageL = el("div", "page page-left");
  const ribbon = el("div", "book-ribbon");
  bookEl.append(pageR, pageL, el("div","page-corner left"), el("div","page-corner right"), ribbon);   // RTL: the first page of a spread is on the right
  // Persian RTL book: right-hand arrow returns to the previous page;
  // left-hand arrow moves forward. Grid explicitly anchors their sides.
  const prev = el("button", "turn turn-prev", "→");
  prev.setAttribute("aria-label", "صفحهٔ قبل، سمت راست");
  prev.title="صفحهٔ قبل · کلید پیکان راست";
  const next = el("button", "turn turn-next", "←");
  next.setAttribute("aria-label", "صفحهٔ بعد، سمت چپ");
  next.title="صفحهٔ بعد · کلید پیکان چپ";
  shelf.append(prev, bookEl, next);
  const footer = el("div", "book-footer");
  const counter = el("span", "book-counter");
  const progress = el("input", "book-progress"); progress.type = "range"; progress.min = "0"; progress.max = "100"; progress.value = "0"; progress.setAttribute("aria-label", "رفتن به بخش دیگری از کتاب");
  const bookmark = el("button", "book-bookmark", "نشانک");
  const jump=el("select","book-jump");
  jump.setAttribute("aria-label","رفتن به بخش کتاب");
  const syncStatus=el("span","reader-sync-status","ذخیره روی این دستگاه");
  syncStatus.setAttribute("role","status");
  footer.append(progress, counter, jump, bookmark, syncStatus);
  const margin = el("aside", "book-margin"); margin.hidden = true;
  const selBtn = el("button", "sel-note", "نظر روی این بخش"); selBtn.hidden = true;
  const pop = el("form", "note-pop"); pop.hidden = true;
  const popQuote = el("blockquote", "note-quote");
  const popName = el("input"); popName.placeholder = "نام (اختیاری)"; popName.maxLength = 40;
  const popText = el("textarea"); popText.placeholder = "نظرتان درباره‌ی همین بخش"; popText.maxLength = 2500; popText.minLength = 10; popText.required = true; popText.rows = 3;
  const popCategory = el("select", "note-category"); popCategory.setAttribute("aria-label","موضوع نظر");
  for(const [value,label] of [["general","نظر کلی"],["plot","پیرنگ"],["character","شخصیت‌پردازی"],["language","نثر و دیالوگ"],["continuity","پیوستگی جهان"]]) { const opt=el("option","",label); opt.value=value;popCategory.append(opt); }
  const popRating = el("select", "note-rating"); popRating.setAttribute("aria-label","امتیاز به داستان");
  for(const [value,label] of [["","بدون امتیاز"],["1","۱ از ۵"],["2","۲ از ۵"],["3","۳ از ۵"],["4","۴ از ۵"],["5","۵ از ۵"]]) {const opt=el("option","",label);opt.value=value;popRating.append(opt);}
  const popRow = el("div", "note-row");
  const popSend = el("button", "", "ثبت نظر"); popSend.type = "submit";
  const popCancel = el("button", "", "انصراف"); popCancel.type = "button";
  const popStatus = el("span", "time");
  popRow.append(popSend, popCancel, popStatus);
  pop.append(popQuote, popName, popCategory, popRating, popText, popRow);
  // a hidden page used to measure how much text fits
  const measure = el("div", "page page-measure");
  overlay.append(bar, shelf, footer, margin, selBtn, pop, measure);
  document.body.appendChild(overlay);

  ui = { overlay, title, bookEl, pageR, pageL, prev, next, counter, progress, bookmark,
    jump, syncStatus, syncBtn, settings, fontSelect, leadingSelect, marginsSelect, alignSelect, modeSelect,
    find, margin, marginBtn, voteUp, voteDown, voteStatus, closeBtn, themeSelect, focusBtn,
    selBtn, pop, popQuote, popName, popCategory, popRating, popText, popStatus, popCancel, measure,
    ribbon, segments, turnSelect, speedSelect, soundSelect, fontRange, lampRange };

  themeSelect.addEventListener("change",()=>setReaderOption("theme",themeSelect.value));
  turnSelect.addEventListener("change",()=>setReaderOption("turnStyle",turnSelect.value));
  speedSelect.addEventListener("change",()=>setReaderOption("turnSpeed",speedSelect.value));
  soundSelect.addEventListener("change",()=>{setReaderOption("sound",soundSelect.value==="on");rustle();});
  fontRange.addEventListener("change",()=>{if(book){book.fontSize=Number(fontRange.value);applyReaderAppearance();storeGlobalReadingOptions();repaginate();}});
  lampRange.addEventListener("input",()=>setReaderOption("ambient",Number(lampRange.value)));
  fontSelect.addEventListener("change",()=>setReaderOption("fontFamily",fontSelect.value,true));
  leadingSelect.addEventListener("change",()=>setReaderOption("leading",leadingSelect.value,true));
  marginsSelect.addEventListener("change",()=>setReaderOption("margins",marginsSelect.value,true));
  alignSelect.addEventListener("change",()=>setReaderOption("align",alignSelect.value,true));
  modeSelect.addEventListener("change",()=>setReaderOption("mode",modeSelect.value,true));
  syncBtn.addEventListener("click",connectReaderOwner);
  focusBtn.addEventListener("click",()=>{
    if(!book)return;
    setReaderOption("focus",!book.focus,true);
    if(book.focus){margin.hidden=true;marginBtn.setAttribute("aria-pressed","false");}
  });
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  prev.addEventListener("click", () => turn(-1));
  next.addEventListener("click", () => turn(1));
  marginBtn.addEventListener("click", () => { margin.hidden = !margin.hidden; marginBtn.setAttribute("aria-pressed", String(!margin.hidden)); });
  voteUp.addEventListener("click",()=>sendReaderVote(1));
  voteDown.addEventListener("click",()=>sendReaderVote(-1));
  smallerBtn.addEventListener("click", () => adjustFont(-0.08));
  largerBtn.addEventListener("click", () => adjustFont(0.08));
  const riffleTip=el("div","riffle-tip");riffleTip.hidden=true;overlay.append(riffleTip);
  const riffleTarget=()=>{const per=spread(),fraction=Number(progress.value)/100;return Math.min(Math.floor(fraction*Math.max(0,book.pages.length-1)/per)*per,Math.max(0,book.pages.length-per));};
  progress.addEventListener("input",()=>{
    if(!book)return;
    const target=riffleTarget(),r=progress.getBoundingClientRect(),fraction=Number(progress.value)/100;
    riffleTip.hidden=false;riffleTip.textContent=`صفحهٔ ${target+1} از ${book.pages.length}`;
    riffleTip.style.left=`${r.right-r.width*fraction}px`;riffleTip.style.top=`${r.top-8}px`;
  });
  progress.addEventListener("change", () => { if(!book)return;riffleTip.hidden=true;goTo(riffleTarget()); });
  bookmark.addEventListener("click", toggleBookmark);
  jump.addEventListener("change",()=>{
    if(!book)return;
    const index=Math.max(0,Math.min(book.pages.length-1,Number(jump.value)||0));
    const per=spread();
    goTo(Math.floor(index/per)*per);
  });
  find.addEventListener("keydown", e => { if(e.key==="Enter"){e.preventDefault();findText(find.value);} });
  document.addEventListener("keydown", (e) => {
    if (overlay.hidden || overlay.classList.contains("book-entering")) return;
    if ((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="f"){e.preventDefault();ui.find.focus();ui.find.select();return;}
    if (e.target.closest?.("input, textarea, select, summary, details")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") turn(1);
    if (e.key === "ArrowRight") turn(-1);
    if (e.key === " ") { e.preventDefault(); turn(e.shiftKey ? -1 : 1); }
    if (e.key === "Home") goTo(0);
    if (e.key === "End") goTo(Math.max(0, book.pages.length - spread()));
  });
  bookEl.addEventListener("pointermove", hoverGrab);
  bookEl.addEventListener("pointerleave", () => { delete bookEl.dataset.grab; });
  bookEl.addEventListener("pointerdown", grabStart);
  window.addEventListener("pointermove", grabMove);
  window.addEventListener("pointerup", grabEnd);
  window.addEventListener("pointercancel", grabEnd);
  let idle = null;
  const wake = () => {
    overlay.classList.remove("chrome-idle");
    clearTimeout(idle);
    idle = setTimeout(() => { if (!settings.open && margin.hidden && pop.hidden && !grab) overlay.classList.add("chrome-idle"); }, 3400);
  };
  overlay.addEventListener("pointermove", wake);
  overlay.addEventListener("keydown", wake);
  bookEl.addEventListener("mouseup", (e) => { if (!onSelect(e)) edgeTurn(e); });
  bookEl.addEventListener("touchend", () => setTimeout(onSelect, 50));
  selBtn.addEventListener("mousedown", (e) => e.preventDefault());
  selBtn.addEventListener("click", openNoteForm);
  popCancel.addEventListener("click", () => { pop.hidden = true; });
  pop.addEventListener("submit", sendNote);
  let t = null;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { if (book && !overlay.hidden) repaginate(); }, 200); });
  // the reader keeps its own preferred flip speed; the room's polish loop can set it
  const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
  rm.addEventListener?.("change", () => { if (book && !overlay.hidden) show(); });
  // Reflow after webfonts load: first layout may use fallback metrics.
  if(document.fonts?.ready){
    document.fonts.ready.then(()=>{
      if(book && !overlay.hidden) repaginate();
    }).catch(()=>{});
  }
  overlay.addEventListener("click",e=>{
    if(settings.open && !settings.contains(e.target))settings.open=false;
  });
}

const READER_DEFAULTS=Object.freeze({
  fontSize:1.06,fontFamily:"vazir-classic",theme:"paper",leading:"normal",
  align:"justify",margins:"normal",mode:"auto",focus:false,
  turnStyle:"curl",turnSpeed:"normal",sound:false,ambient:.25
});
const READER_FONTS={
  naskh:'"Noto Naskh Arabic"',vazir:'"Vazirmatn"',
  "vazir-classic":'"Vazir"',amiri:'"Amiri"'
};
let syncTimer=null;
let syncQueue=Promise.resolve();
const opt=(value,accepted,fallback)=>accepted.includes(value)?value:fallback;
function readGlobalReadingOptions(){
  try{
    const value=JSON.parse(localStorage.getItem("the-writer-reader-options")||"{}");
    const legacy=localStorage.getItem("the-writer-reader-theme");
    return {...READER_DEFAULTS,...value,...(!value.theme&&legacy?{theme:legacy}:{})};
  }catch{return {...READER_DEFAULTS}}
}
function storeGlobalReadingOptions(){
  if(!book)return;
  const next=Object.fromEntries(Object.keys(READER_DEFAULTS).map(k=>[k,book[k]]));
  try{localStorage.setItem("the-writer-reader-options",JSON.stringify(next));}catch{}
}
function updateSyncState(note){
  if(!ui||!book)return;
  ui.syncStatus.textContent=note||(book.syncConnected?"همگام‌سازی سرور فعال":"پیشرفت روی این دستگاه ذخیره می‌شود");
  if(ui.syncBtn&&!isGitHubPages())ui.syncBtn.textContent=book.syncConnected?"بازخوانی از سرور":"اتصال مالک و همگام‌سازی";
}
function applyReaderAppearance(){
  if(!ui||!book)return;
  const v=book;
  v.fontSize=Math.max(.85,Math.min(1.65,Number(v.fontSize)||1.06));
  v.fontFamily=opt(v.fontFamily,["naskh","vazir","vazir-classic","amiri"],"vazir-classic");
  v.theme=opt(v.theme,PAPER_NAMES,"paper");
  v.turnStyle=opt(v.turnStyle,["curl","slide","none"],"curl");
  v.turnSpeed=opt(v.turnSpeed,["slow","normal","fast"],"normal");
  v.sound=Boolean(v.sound);
  v.ambient=Math.max(0,Math.min(1,Number(v.ambient)||0));
  v.leading=opt(v.leading,["compact","normal","airy"],"normal");
  v.align=opt(v.align,["justify","right"],"justify");
  v.margins=opt(v.margins,["narrow","normal","wide"],"normal");
  v.mode=opt(v.mode,["auto","single","spread"],"auto");
  ui.overlay.style.setProperty("--reader-font",`${v.fontSize}rem`);
  ui.overlay.dataset.readerFont=v.fontFamily;
  ui.overlay.dataset.readerTheme=v.theme;
  ui.overlay.dataset.readerLeading=v.leading;
  ui.overlay.dataset.readerAlign=v.align;
  ui.overlay.dataset.readerMargins=v.margins;
  ui.themeSelect.value=v.theme;
  ui.fontSelect.value=v.fontFamily;
  ui.leadingSelect.value=v.leading;
  ui.alignSelect.value=v.align;
  ui.marginsSelect.value=v.margins;
  ui.modeSelect.value=v.mode;
  ui.turnSelect.value=v.turnStyle;
  ui.speedSelect.value=v.turnSpeed;
  ui.soundSelect.value=v.sound?"on":"off";
  ui.fontRange.value=String(v.fontSize);
  ui.lampRange.value=String(v.ambient);
  ui.overlay.style.setProperty("--lamp",String(v.ambient));
  ui.segments.forEach(sync=>sync(v.theme));
  ui.overlay.classList.toggle("reader-focus-mode",Boolean(v.focus));
  ui.focusBtn.setAttribute("aria-pressed",String(Boolean(v.focus)));
}
function ensureReaderFont(){
  if(!book||!document.fonts?.load)return;
  const sid=book.story.id,family=book.fontFamily;
  document.fonts.load(`16px ${READER_FONTS[family]||READER_FONTS.naskh}`,"متن فارسی کتاب")
    .then(()=>{
      if(book?.story.id===sid&&book.fontFamily===family&&!ui.overlay.hidden)repaginate();
    }).catch(()=>{});
}
function setReaderOption(name,value,repaginateText=false){
  if(!book)return;
  if(name==="focus")value=Boolean(value);
  book[name]=value;
  applyReaderAppearance();
  storeGlobalReadingOptions();
  if(repaginateText){repaginate();if(name==="fontFamily")ensureReaderFont();}
  else writeProgress();
}
async function fetchServerReading(storyId){
  const token=ownerToken();
  if(!token||isGitHubPages())return null;
  const response=await fetch(`/api/reader/state?story_id=${encodeURIComponent(storyId)}`,{
    headers:{"X-Admin-Token":token},cache:"no-store"
  });
  if(!response.ok)throw new Error(`reader state GET: ${response.status}`);
  return await response.json();
}
async function sendServerReading(storyId,state){
  const token=ownerToken();
  if(!token||isGitHubPages())return;
  const response=await fetch("/api/reader/state",{
    method:"POST",
    headers:{"Content-Type":"application/json","X-Admin-Token":token},
    body:JSON.stringify({story_id:storyId,state}),keepalive:true
  });
  if(!response.ok)throw new Error(`reader state POST: ${response.status}`);
  return response.json();
}
function scheduleServerReading(storyId,state,immediate=false){
  if(!book?.syncConnected||isGitHubPages())return;
  if(syncTimer)clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>{
    syncTimer=null;
    // Serialize writes so slow network responses cannot put older pages after
    // later ones. Local progress remains usable when server sync fails.
    syncQueue=syncQueue.catch(()=>{}).then(()=>sendServerReading(storyId,state))
      .then(()=>{if(book?.story.id===storyId)updateSyncState();})
      .catch(()=>{if(book?.story.id===storyId){book.syncConnected=false;
        updateSyncState("سرور در دسترس نیست؛ پیشرفت محلی حفظ شد");}});
  },immediate?0:1100);
}
function readProgress(id=book?.story?.id){
  if(!id)return null;
  try{return JSON.parse(localStorage.getItem(`the-writer-reading:${id}`)||"null");}
  catch{return null}
}
function readerState(){
  const progress=book.pages.length<=1?0:book.index/(book.pages.length-1);
  book.progress=progress;
  return {
    progress,anchor:anchorOf(book.pages[book.index]),bookmark:book.bookmark,fontSize:book.fontSize,fontFamily:book.fontFamily,
    theme:book.theme,leading:book.leading,align:book.align,margins:book.margins,mode:book.mode,focus:book.focus,
    turnStyle:book.turnStyle,turnSpeed:book.turnSpeed,sound:book.sound,ambient:book.ambient,
    updated:new Date().toISOString()
  };
}
function writeProgress(){
  if(!book)return;
  const state=readerState();
  try{localStorage.setItem(`the-writer-reading:${book.story.id}`,JSON.stringify(state));}catch{}
  scheduleServerReading(book.story.id,state);
}
// Prefer a passage anchor across font and viewport changes, but continue to accept
// historical percentage-only state already stored on users' devices/servers.
function restoreReadingLocation(saved,resumeProgress){
  if(!book?.pages?.length)return;
  if(saved?.anchor&&["title","body","report"].includes(saved.anchor.kind)){
    book.index=locate(saved.anchor,spread());
    show();
  }else if(resumeProgress>0){
    const per=spread();
    book.index=Math.min(Math.floor(resumeProgress*Math.max(0,book.pages.length-1)/per)*per,
      Math.max(0,book.pages.length-per));
    show();
  }
}
function adoptStoredState(data){
  if(!book||!data||typeof data!=="object")return;
  for(const field of Object.keys(READER_DEFAULTS)){
    if(data[field]!==undefined)book[field]=data[field];
  }
  book.bookmark=data.bookmark??null;
  const resumeProgress=Math.max(0,Math.min(1,Number(data.progress)||0));
  book.progress=resumeProgress;
  applyReaderAppearance();
  storeGlobalReadingOptions();
  renderMargin();
  repaginate();
  restoreReadingLocation(data,resumeProgress);
}
async function connectReaderOwner(){
  if(!book||isGitHubPages())return;
  let token=ownerToken();
  if(!token){
    const entered=window.prompt("توکن مالک برای ذخیرهٔ پیشرفت در سرور خصوصی:");
    if(!entered?.trim())return;
    token=entered.trim();
    try{sessionStorage.setItem("the-writer-owner-token",token);}catch{
      updateSyncState("امکان ذخیرهٔ توکن در این نشست وجود ندارد");return;
    }
  }
  updateSyncState("در حال بررسی اتصال…");
  try{
    const remote=await fetchServerReading(book.story.id);
    book.syncConnected=true;
    if(remote?.state){
      const local=readProgress(book.story.id);
      if(Date.parse(remote.state.updated||0)>Date.parse(local?.updated||0))
        adoptStoredState(remote.state);
    }
    const state=readerState();
    scheduleServerReading(book.story.id,state,true);
    updateSyncState();
  }catch{
    book.syncConnected=false;
    updateSyncState("توکن یا ارتباط سرور معتبر نیست؛ پیشرفت محلی محفوظ است");
  }
}
/* Lay the reader out invisibly so the shelf animation can aim at the real page. */
export function prepareReader(){
  if(!ui)build();
  const prefs=readGlobalReadingOptions(),theme=opt(prefs.theme,PAPER_NAMES,"paper");
  ui.overlay.hidden=false;
  ui.overlay.classList.remove("book-entering");
  ui.overlay.dataset.readerTheme=theme;
  ui.overlay.style.setProperty("--lamp",String(Number(prefs.ambient)||0));
  const single=window.innerWidth<860||prefs.mode==="single"||(prefs.mode!=="spread"&&window.innerWidth<1060);
  ui.bookEl.classList.toggle("single",single);
  ui.pageL.hidden=single;
  const background=getComputedStyle(ui.overlay).background;
  ui.overlay.classList.add("book-entering");
  return {...readerGeometry(single),background,overlay:ui.overlay};
}
function readerGeometry(single){
  const right=ui.pageR.getBoundingClientRect(),left=(single?ui.pageR:ui.pageL).getBoundingClientRect();
  return {x:left.left,y:right.top,w:right.right-left.left,h:right.height,single};
}
/* Copies of what is on the page now, for the book on the stage. */
export function readerPages(){
  const single=spread()===1;
  return single?{left:ui.pageR.cloneNode(true),right:null}:{left:ui.pageL.cloneNode(true),right:ui.pageR.cloneNode(true)};
}
export function revealReader(){ui?.overlay.classList.remove("book-entering");}
export function setCloseTransition(fn){closeTransition=fn;}
export async function openBook(storyId,{staged=false}={}) {
  if(!ui)build();
  if(!staged)ui.overlay.classList.remove("book-entering");
  if(syncTimer){clearTimeout(syncTimer);syncTimer=null;}
  const [story,notes,publicNotes]=await Promise.all([
    getJSON(`/api/stories/${encodeURIComponent(storyId)}`),
    getJSON(`/api/stories/${encodeURIComponent(storyId)}/comments`).catch(()=>[]),
    isGitHubPages()?loadPublicStoryNotes(storyId).catch(()=>[]):Promise.resolve([])
  ]);
  const stored=readProgress(storyId)||{};
  const prefs=readGlobalReadingOptions();
  let remoteState=null,connected=false;
  if(!isGitHubPages()&&ownerToken()){
    try{const result=await fetchServerReading(storyId);
      remoteState=result?.state||null;connected=true;
    }catch{}
  }
  const hasNewerServer=remoteState&&Date.parse(remoteState.updated||0)>Date.parse(stored.updated||0);
  const saved=hasNewerServer?{...prefs,...stored,...remoteState}:{...prefs,...stored};
  const resumeProgress=Math.max(0,Math.min(1,Number(saved.progress)||0));
  book={
    story,comments:[...(Array.isArray(notes)?notes:[]),...publicNotes],pages:[],index:0,turning:null,
    repaginateLater:false,bookmark:saved.bookmark??null,progress:0,
    ...READER_DEFAULTS,...saved,syncConnected:connected
  };
  ui.title.textContent=story.title;
  ui.voteStatus.textContent=isGitHubPages()?"رأی با تأیید نهایی در GitHub ثبت می‌شود":"";
  ui.voteUp.textContent="پسندیدم";ui.voteDown.textContent="نپسندیدم";
  ui.overlay.hidden=false;
  ui.overlay.classList.remove("chrome-idle");
  if(!isGitHubPages())refreshReaderVotes(storyId);
  document.body.classList.add("book-open");
  applyReaderAppearance();
  storeGlobalReadingOptions();
  updateSyncState();
  renderMargin();
  repaginate();
  restoreReadingLocation(saved,resumeProgress);
  ensureReaderFont();
}

async function refreshReaderVotes(storyId){
  if(isGitHubPages())return;
  try{
    const response=await fetch("/api/stories/"+encodeURIComponent(storyId)+"/votes",{cache:"no-store"});
    if(!response.ok)return;
    const counts=await response.json();
    if(book?.story.id!==storyId)return;
    ui.voteUp.textContent="پسندیدم ("+Number(counts.likes||0)+")";
    ui.voteDown.textContent="نپسندیدم ("+Number(counts.dislikes||0)+")";
  }catch{/* static/offline readers still work */}
}
async function sendReaderVote(value){
  if(!book)return;
  const sid=book.story.id;
  ui.voteStatus.textContent="";
  if(isGitHubPages()){
    // A static Pages site needs a separately deployed write API.
    // Until configured, retain the explicit GitHub confirmation flow.
    const endpoint=String(window.THE_WRITER_FEEDBACK_API||"").replace(/[/]$/,"");
    if(endpoint){
      try{
        const response=await fetch(endpoint+"/api/stories/"+encodeURIComponent(sid)+"/votes",{
          method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({value})
        });
        const data=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(data.error||"ثبت رأی ممکن نشد");
        ui.voteStatus.textContent=data.updated?"رأی شما ثبت شد.":"رأی شما از قبل ثبت شده بود.";
      }catch(error){ui.voteStatus.textContent="ثبت مستقیم ناموفق بود: "+String(error.message||error);}
      return;
    }
    try{
      const result=openPublicVote({story:book.story,value});
      if(result.opened){
        ui.voteStatus.textContent="برای ثبت نهایی، فرم GitHub را ارسال کنید.";
      }else{
        const link=el("a","","باز کردن فرم رأی در GitHub");
        link.href=result.url;link.target="_blank";link.rel="noopener noreferrer";
        ui.voteStatus.replaceChildren(link);
      }
    }catch(error){ui.voteStatus.textContent=String(error.message||error);}
    return;
  }
  try{
    const response=await fetch("/api/stories/"+encodeURIComponent(sid)+"/votes",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({value})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(String(data.error||"ثبت رأی ممکن نشد"));
    if(book?.story.id!==sid)return;
    ui.voteStatus.textContent=data.updated?"رأی شما ثبت شد.":"رأی شما از قبل ثبت شده بود.";
    await refreshReaderVotes(sid);
  }catch(error){ui.voteStatus.textContent=String(error.message||error);}
}

function adjustFont(delta){
  if(!book)return;
  const anchor=anchorOf(book.pages[book.index]);
  book.fontSize=Math.max(.85,Math.min(1.65,Math.round((book.fontSize+delta)*100)/100));
  applyReaderAppearance();storeGlobalReadingOptions();repaginate();
  if(anchor){book.index=locate(anchor,spread());show();}
}
function toggleBookmark(){
  if(!book)return;
  if(book.bookmark===book.index)book.bookmark=null;
  else if(book.bookmark!=null){book.index=Math.min(book.bookmark,Math.max(0,book.pages.length-spread()));show();}
  else book.bookmark=book.index;
  if(book.bookmark==null){ui.bookmark.textContent="ثبت نشانک";ui.bookmark.setAttribute("aria-pressed","false");}
  else{ui.bookmark.textContent=book.bookmark===book.index?"نشانک اینجاست":"بازگشت به نشانک";ui.bookmark.setAttribute("aria-pressed",String(book.bookmark===book.index));}
  writeProgress();
}

async function close() {
  if(!ui||ui.overlay.hidden||closing||ui.overlay.classList.contains("book-entering"))return;
  closing=true;
  endTurn();
  if(syncTimer){clearTimeout(syncTimer);syncTimer=null;
    if(book?.syncConnected){
      const sid=book.story.id,state=readerState();
      syncQueue=syncQueue.catch(()=>{}).then(()=>sendServerReading(sid,state)).catch(()=>{});
    }
  }
  ui.settings.open=false;
  ui.selBtn.hidden = true; ui.pop.hidden = true;
  const hideReader=()=>{
    ui.overlay.hidden = true;
    document.body.classList.remove("book-open");
    closing=false;
    window.dispatchEvent(new Event("writer:reading-closed"));
  };
  if(closeTransition){
    show();
    const geometry={...readerGeometry(spread()===1),background:getComputedStyle(ui.overlay).background};
    try{await closeTransition({overlay:ui.overlay,geometry,pages:readerPages(),hideReader});}
    catch{ui.overlay.classList.remove("book-leaving");ui.overlay.style.background="";hideReader();}
  }else hideReader();
}

export function setTurnSpeed(ms) {
  if (Number.isFinite(ms) && ms >= 120 && ms <= 1400) flipMs = ms;
}

function spread() {
  if(window.innerWidth<860||book?.mode==="single")return 1;
  if(book?.mode==="spread")return 2;
  return window.innerWidth>=1060?2:1;
}
function reducedMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

// ---------- content ----------
function storyParagraphs() {
  return book.story.body.replace(/^# .*\n+/, "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
function checkLines() {
  return (book.story.check || "").split("\n").map((l) => l.replace(/^#+\s*/, "").replace(/^-\s*/, "• ").trim()).filter(Boolean);
}

function marked(text, quotes) {
  const frag = document.createDocumentFragment();
  let rest = text;
  while (rest) {
    let best = null;
    for (const q of quotes) {
      const i = rest.indexOf(q.quote);
      if (i >= 0 && (!best || i < best.i)) best = { i, q };
    }
    if (!best) { frag.appendChild(document.createTextNode(rest)); break; }
    if (best.i > 0) frag.appendChild(document.createTextNode(rest.slice(0, best.i)));
    const m = el("mark", "note-mark", best.q.quote);
    m.title = `${best.q.name}: ${best.q.text}`;
    m.dataset.cid = best.q.id;
    frag.appendChild(m);
    rest = rest.slice(best.i + best.q.quote.length);
  }
  return frag;
}

// Marks get their click handlers after mounting: cloneNode() drops listeners.
function bindMarks(root) {
  root.querySelectorAll("mark.note-mark").forEach((m) => {
    m.addEventListener("click", () => { ui.margin.hidden = false; focusNote(m.dataset.cid); });
  });
}

function titlePage() {
  const s = book.story;
  const page = el("div", "page-content title-page");
  const edition=applyCoverVisual(page,s);
  const ornament=createCoverArt();ornament.classList.add("tp-art");
  page.append(el("div", "tp-kicker", "از کتابخانهٔ هادس"), ornament,
    el("h1", "tp-title", s.title));
  const ribbon = el("div", `tp-status ${s.status}`, STATUS_FA[s.status] || s.status);
  const meta = el("div", "tp-meta");
  meta.append(
    el("div", "", `${s.stage} · ${s.words} واژه`),
    el("div", "", `امتیاز منتقد ${s.score} از ${s.threshold}`),
    el("div", "", (s.created || "").replace("T", " ").slice(0, 16)),
  );
  if (s.experiment) meta.append(el("div", "", `آزمایش این داستان: ${s.experiment}`));
  page.append(ribbon, meta, el("div", "tp-hint", "متن را انتخاب کنید تا روی آن بخش نظر بدهید."));
  return { node: page, kind: "title", firstPara: 0, firstWord: 0 };
}

// Fill measured pages paragraph by paragraph; split a paragraph by words when it does not fit.
// The binary search measures plain text, so the highlight pass runs once per accepted chunk.
function paginate(blocks, kind) {
  const pages = [];
  const quotes = book.comments.filter((c) => c.quote);
  const m = ui.measure;
  let content = el("div", `page-content ${kind}`);
  let firstPara = null;
  let firstWord = null;
  m.replaceChildren(content);
  const flush = () => {
    if (content.childElementCount) pages.push({ node: content, kind, firstPara, firstWord });
    content = el("div", `page-content ${kind}`);
    firstPara = null;
    firstWord = null;
    m.replaceChildren(content);
  };
  const fits = () => m.scrollHeight <= m.clientHeight + 1;
  for (const b of blocks) {
    let words = b.text.split(" ");
    let consumed = 0;
    while (words.length) {
      if (!content.childElementCount) {
        firstPara = b.index;
        firstWord = consumed;
      }
      const p = el(b.tag || "p", b.cls || "");
      p.textContent = words.join(" ");
      content.appendChild(p);
      if (fits()) { p.replaceChildren(marked(words.join(" "), quotes)); words = []; break; }
      content.removeChild(p);
      let lo = 0, hi = words.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        p.textContent = words.slice(0, mid).join(" ");
        content.appendChild(p);
        const ok = fits();
        content.removeChild(p);
        if (ok) lo = mid; else hi = mid - 1;
      }
      if (lo === 0) {
        if (content.childElementCount) { flush(); continue; }
        lo = 1;                       // one oversized word still needs a page of its own
      }
      const cut = words.slice(0, lo).join(" ");
      p.replaceChildren(marked(cut, quotes));
      p.classList.add("cont");
      content.appendChild(p);
      words = words.slice(lo);
      consumed += lo;
      flush();
    }
  }
  if (content.childElementCount) pages.push({ node: content, kind, firstPara, firstWord });
  return pages;
}

// Remember where the reader is by (kind, paragraph) rather than by page number, so adding a note or
// resizing keeps them in the same passage instead of throwing them back to the title page.
function anchorOf(page) { return pageAnchor(page); }
function locate(anchor, per) { return locatePageByAnchor(book.pages, anchor, per); }

function refreshReaderSections(){
  if(!ui?.jump||!book)return;
  const sections=[{at:0,label:"آغاز کتاب"}];
  const main=book.pages.findIndex(page=>page.kind==="body");
  const critique=book.pages.findIndex(page=>page.kind==="report");
  if(main>=0)sections.push({at:main,label:"متن داستان"});
  if(critique>=0)sections.push({at:critique,label:"گزارش منتقد"});
  ui.jump.replaceChildren(...sections.map(section=>{
    const option=el("option","",section.label);option.value=String(section.at);
    return option;
  }));
}

function repaginate() {
  if (book.turning) { book.repaginateLater = true; return; }
  const anchor = anchorOf(book.pages[book.index]);
  const per = spread();
  ui.bookEl.classList.toggle("single", per === 1);
  // size the measuring page exactly like a real page
  const r = ui.pageR.getBoundingClientRect();
  ui.measure.style.width = `${r.width}px`;
  ui.measure.style.height = `${r.height}px`;
  // Match the *actual* responsive page padding before measuring paragraphs.
  // Otherwise the hidden measuring page overestimates capacity and silently
  // clips several lines at the bottom of a real page.
  ui.measure.style.padding = getComputedStyle(ui.pageR).padding;
  const text = storyParagraphs().map((t, i) => ({ text: t, index: i }));
  book.pages = [titlePage(), ...paginate(text, "body")];
  const report = checkLines();
  if (report.length) {
    const rp = paginate(report.map((t, i) => ({ text: t, index: i, cls: "report-line" })), "report");
    if (rp.length) rp[0].node.prepend(el("h2", "report-title", "گزارش منتقد"));
    book.pages.push(...rp);
  }
  if (per === 2 && book.pages.length % 2) {
    book.pages.push({ node: el("div", "page-content blank"), kind: "blank", firstPara: null, firstWord: null });
  }
  book.index = locate(anchor, per);
  refreshReaderSections();
  show();
  if (book.repaginateLater) { book.repaginateLater = false; repaginate(); }
}

function mountPage(host, page, folio) {
  host.replaceChildren();
  if (!page) return;
  host.appendChild(page.node.cloneNode(true));
  host.appendChild(el("div", "folio", String(folio)));
}

function show() {
  const per = spread();
  mountPage(ui.pageR, book.pages[book.index], book.index + 1);
  mountPage(ui.pageL, per === 2 ? book.pages[book.index + 1] : null, book.index + 2);
  ui.pageL.hidden = per === 1;
  bindMarks(ui.bookEl);
  ui.prev.disabled = book.index === 0;
  ui.next.disabled = book.index + per >= book.pages.length;
  const last = Math.min(book.pages.length, book.index + per);
  const remain=Math.max(0,Math.ceil((Number(book.story.words)||0)*
    (1-Math.min(1,book.index/Math.max(1,book.pages.length-1)))/210));
  ui.counter.textContent = `صفحهٔ ${book.index + 1}${per===2&&last>book.index+1?`–${last}`:""} از ${book.pages.length}`;
  ui.counter.title=remain?`حدود ${remain} دقیقه مطالعه باقی مانده`:"پایان مطالعه";
  if(ui.jump?.options?.length){
    const available=[...ui.jump.options].map(o=>Number(o.value)).filter(i=>i<=book.index);
    ui.jump.value=String(available[available.length-1]??0);
  }
  ui.progress.value=String(Math.round(book.pages.length<=1?0:book.index/(book.pages.length-1)*100));
  ui.progress.title=`پیشرفت مطالعه: ${ui.progress.value}٪`;
  ui.bookmark.textContent=book.bookmark==null?"ثبت نشانک":book.bookmark===book.index?"نشانک اینجاست":"بازگشت به نشانک";
  ui.bookmark.setAttribute("aria-pressed",String(book.bookmark===book.index));
  ui.bookEl.style.setProperty("--done",ui.progress.value/100);
  const marked=book.bookmark!=null&&(book.bookmark===book.index||(per===2&&book.bookmark===book.index+1));
  ui.ribbon.classList.toggle("on",marked);
  ui.ribbon.style.left=per===2&&book.bookmark===book.index+1?"14%":"78%";
  writeProgress();
}

// ---------- turning ----------
function endTurn() {
  if (book?.turning) {
    const t = book.turning;
    cancelAnimationFrame(t.raf);
    t.leaf.destroy();
    t.casts.forEach((c) => c.remove());
    book.turning = null;
    ui.bookEl.classList.remove("is-dragging");
  }
}

const turnFactor = () => ({ slow: 2.4, normal: 1.75, fast: 1.05 }[book?.turnSpeed] || 1.75);
const easeTurn = (p) => (p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
function pageSheet(page, folio, side) {
  const host = el("div", `page page-${side}`);
  if (page) host.append(page.node.cloneNode(true), el("div", "folio", String(folio)));
  return host;
}

/* Lays a sheet over the book and shows what lies under it. Geometry: see page-curl.js. */
function startTurn(target) {
  const per = spread(), pages = book.pages, from = book.index, forward = target > from;
  ui.selBtn.hidden = true; ui.pop.hidden = true;
  const host = ui.bookEl.getBoundingClientRect();
  const lying = (per === 2 ? ui.pageL : ui.pageR).getBoundingClientRect();
  let front, back;
  if (per === 2) {
    const f = forward ? from + 1 : target + 1, b = forward ? target : from;
    front = pageSheet(pages[f], f + 1, "left");
    back = pageSheet(pages[b], b + 1, "right");
    const underL = forward ? target + 1 : from + 1, underR = forward ? from : target;
    mountPage(ui.pageL, pages[underL] || null, underL + 1);
    mountPage(ui.pageR, pages[underR] || null, underR + 1);
  } else {
    const f = forward ? from : target;
    front = pageSheet(pages[f], f + 1, "right");
    back = pageSheet(null, 0, "right");
    const under = forward ? target : from;
    mountPage(ui.pageR, pages[under] || null, under + 1);
  }
  const leaf = createLeaf({ host: ui.bookEl, left: lying.left - host.left, top: lying.top - host.top, width: lying.width, height: lying.height, front, back, strips: window.innerWidth < 700 ? 8 : 14 });
  const casts = [];
  if (per === 2) for (const [page, cls] of [[ui.pageL, "on-left"], [ui.pageR, "on-right"]]) {
    const r = page.getBoundingClientRect(), c = el("div", `cast ${cls}`);
    c.style.left = `${r.left - host.left}px`; c.style.width = `${r.width}px`;
    ui.bookEl.append(c); casts.push(c);
  }
  const t = { leaf, casts, target, forward, per, theta: forward ? 0 : 180, curl: 0, tilt: 0, velocity: 0, raf: 0, dragging: false, hinge: lying.right, width: lying.width };
  book.turning = t;
  paintTurn(t);
  return t;
}
function paintTurn(t) {
  t.leaf.set(t.theta, t.curl, t.tilt);
  if (t.casts.length) {
    const s = Math.sin(t.theta * Math.PI / 180);
    t.casts[0].style.opacity = t.theta < 90 ? s * .9 : 0;
    t.casts[1].style.opacity = t.theta >= 90 ? s * .9 : 0;
  }
}
function runTurn(t, { to, duration, curl, commit }) {
  cancelAnimationFrame(t.raf);
  const from = t.theta, tiltFrom = t.tilt, start = performance.now();
  const step = (now) => {
    if (book?.turning !== t) return;
    const p = Math.min(1, (now - start) / duration), e = easeTurn(p);
    t.theta = from + (to - from) * e;
    t.curl = curl(p);
    t.tilt = tiltFrom * (1 - p);
    paintTurn(t);
    if (p < 1) t.raf = requestAnimationFrame(step);
    else finishTurn(t, commit);
  };
  t.raf = requestAnimationFrame(step);
}
function finishTurn(t, commit) {
  if (book?.turning !== t) return;
  if (commit) book.index = t.target;
  endTurn();
  show();
  if (book.repaginateLater) { book.repaginateLater = false; repaginate(); }
  if (book.queuedTurn) { const dir = book.queuedTurn; book.queuedTurn = 0; turn(dir); }
}

function turn(dir) {
  if (!book) return;
  if (book.turning) { if (!book.turning.dragging) book.queuedTurn = dir; return; }
  const target = book.index + dir * spread();
  if (target < 0 || target >= book.pages.length) return;
  goTo(target);
}
/* Any move through the book. Distant jumps use one quick sheet: the reader sees the book move, not every page. */
function goTo(target) {
  if (!book || book.turning || target === book.index) return;
  ui.selBtn.hidden = true; ui.pop.hidden = true;
  if (book.turnStyle === "none" || reducedMotion()) { book.index = target; show(); return; }
  if (book.turnStyle === "slide") {
    const forward = target > book.index;
    book.index = target; show();
    for (const page of [ui.pageR, ui.pageL]) page.firstElementChild?.animate([{ opacity: 0, transform: `translateX(${forward ? 18 : -18}px)` }, { opacity: 1, transform: "none" }], { duration: flipMs * turnFactor() * .7, easing: "ease-out" });
    return;
  }
  const t = startTurn(target), sign = t.forward ? 1 : -1;
  rustle();
  runTurn(t, { to: t.forward ? 180 : 0, duration: flipMs * turnFactor(), curl: (p) => sign * 62 * Math.sin(Math.PI * p), commit: true });
}

// Taking a page by its edge.
let grab = null;
function grabSide(e) {
  if (!book || book.turning) return null;
  const r = ui.bookEl.getBoundingClientRect(), x = e.clientX - r.left, per = spread();
  const zone = e.pointerType === "touch" ? .5 : per === 2 ? .15 : .2;
  if (x < r.width * zone && book.index + per < book.pages.length) return "left";
  if (x > r.width * (1 - zone) && book.index > 0) return "right";
  return null;
}
function hoverGrab(e) {
  if (e.pointerType === "touch" || grab) return;
  const side = e.target.closest?.("mark, button, a") ? null : grabSide(e);
  if (side) ui.bookEl.dataset.grab = side; else delete ui.bookEl.dataset.grab;
}
function grabStart(e) {
  if (e.button || book?.turning || e.target.closest("mark, button, a, input, textarea")) return;
  if (window.getSelection()?.toString()) return;
  const side = grabSide(e);
  if (!side) return;
  if (e.pointerType !== "touch") e.preventDefault();
  grab = { id: e.pointerId, x: e.clientX, y: e.clientY, dir: side === "left" ? 1 : -1, t: null };
}
function grabMove(e) {
  if (!grab || e.pointerId !== grab.id || !book) return;
  if (!grab.t) {
    if (Math.hypot(e.clientX - grab.x, e.clientY - grab.y) < 6 || book.turnStyle !== "curl" || reducedMotion()) return;
    const target = book.index + grab.dir * spread();
    if (target < 0 || target >= book.pages.length) { grab = null; return; }
    grab.t = startTurn(target);
    grab.t.dragging = true;
    grab.goal = grab.t.theta; grab.last = performance.now();
    ui.bookEl.classList.add("is-dragging");
    delete ui.bookEl.dataset.grab;
    try { ui.bookEl.setPointerCapture(e.pointerId); } catch { /* the window listeners still follow it */ }
    rustle();
    dragFrame(grab.t);
  }
  const t = grab.t, raw = (t.hinge - e.clientX) / t.width, u = t.per === 2 ? raw : raw * 2 - 1;
  grab.goal = angleFromPointer(u);
  const r = ui.bookEl.getBoundingClientRect();
  grab.tilt = ((e.clientY - r.top) / r.height - .5) * -9;
}
function dragFrame(t) {
  if (book?.turning !== t || !t.dragging || !grab) return;
  const now = performance.now(), dt = Math.max(1, now - grab.last) / 1000, before = t.theta;
  grab.last = now;
  t.theta += (grab.goal - t.theta) * Math.min(1, dt * 16);
  t.velocity = t.velocity * .7 + ((t.theta - before) / dt) * .3;
  t.tilt += ((grab.tilt || 0) - t.tilt) * Math.min(1, dt * 10);
  t.curl = (t.forward ? 1 : -1) * (30 + Math.min(34, Math.abs(t.velocity) * .12));
  paintTurn(t);
  t.raf = requestAnimationFrame(() => dragFrame(t));
}
function grabEnd(e) {
  if (!grab || e.pointerId !== grab.id) return;
  const t = grab.t;
  grab = null;
  if (!t || book?.turning !== t) return;
  book.justDragged = true;
  t.dragging = false;
  ui.bookEl.classList.remove("is-dragging");
  const commit = e.type !== "pointercancel" && shouldCommit(t.theta, t.velocity, t.forward);
  const to = commit === t.forward ? 180 : 0, curl0 = t.curl;
  const left = Math.abs(to - t.theta) / 180;
  runTurn(t, { to, duration: 180 + left * flipMs * turnFactor() * .8, curl: (p) => curl0 * (1 - p), commit });
}

// A sheet of paper, made from filtered noise: no audio files, and silent unless the reader asks for it.
let audio = null;
function rustle() {
  if (!book?.sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const length = Math.floor(audio.sampleRate * .26), buffer = audio.createBuffer(1, length, audio.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) { const p = i / length; data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * p) ** 2 * (.6 + .4 * Math.sin(p * 37)); }
    const source = audio.createBufferSource(), band = audio.createBiquadFilter(), gain = audio.createGain();
    source.buffer = buffer; band.type = "bandpass"; band.frequency.value = 2600 + Math.random() * 1500; band.Q.value = .7; gain.gain.value = .16;
    source.connect(band).connect(gain).connect(audio.destination); source.start();
  } catch { /* no audio on this device */ }
}

/* The appearance drawer. Native selects stay the source of truth; the visible controls drive them. */
function composePanel(c) {
  const panel = c.settingsPanel, syncs = [];
  const head = el("div", "panel-head");
  const closePanel = el("button", "", "×"); closePanel.type = "button"; closePanel.setAttribute("aria-label", "بستن");
  closePanel.addEventListener("click", () => { c.settings.open = false; });
  head.append(el("h3", "", "ظاهر کتاب"), closePanel);
  const segment = (select, tiles) => {
    const label = select.closest("label"); label.className = "segment-host";
    const bar = el("div", `segment${tiles ? " font-tiles" : ""}`);
    const buttons = [...select.options].map((o) => {
      const b = el("button"); b.type = "button";
      if (tiles) { const [name] = o.textContent.split(" · "); const sample = el("b", "", "آب"); sample.style.fontFamily = READER_FONTS[o.value]; b.append(sample, el("small", "", name)); }
      else b.textContent = o.textContent;
      b.addEventListener("click", () => { select.value = o.value; select.dispatchEvent(new Event("change")); });
      bar.append(b);
      return [b, o.value];
    });
    label.append(bar);
    syncs.push(() => buttons.forEach(([b, v]) => b.setAttribute("aria-pressed", String(v === select.value))));
    return label;
  };
  const group = (title, ...items) => { const g = el("section", "panel-group"); g.append(el("h4", "", title), ...items); return g; };
  const range = (name, input) => { const r = el("label", "range-row"); r.append(el("span", "", name), input); return r; };
  // Paper: sheets in a fan.
  const fan = el("div", "paper-fan"), paperName = el("div", "paper-label");
  const sheets = PAPERS.map(([value, name, colour, texture], i) => {
    const sheet = el("button", "paper-sheet"); sheet.type = "button";
    sheet.style.setProperty("--sheet", colour);
    if (texture) sheet.style.setProperty("--sheet-tex", texture);
    sheet.style.setProperty("--fan", `${(i - (PAPERS.length - 1) / 2) * 9}deg`);
    sheet.setAttribute("aria-label", `کاغذ ${name}`); sheet.title = name;
    sheet.addEventListener("pointerenter", () => { paperName.textContent = name; });
    sheet.addEventListener("focus", () => { paperName.textContent = name; });
    bindSheet(sheet, value, colour, texture);
    fan.append(sheet);
    return [sheet, value, name];
  });
  fan.addEventListener("pointerleave", () => { const on = sheets.find(([, v]) => v === book?.theme); paperName.textContent = on ? on[2] : ""; });
  syncs.push((theme) => sheets.forEach(([sheet, v, name]) => { sheet.setAttribute("aria-pressed", String(v === theme)); if (v === theme) paperName.textContent = name; }));
  c.syncBtn.classList.add("plain");
  c.focusRow.querySelector("button")?.classList.add("plain");
  c.voteRow.querySelectorAll("button").forEach((b) => b.classList.add("plain"));
  panel.replaceChildren(head,
    group("کاغذ · برگه را روی کتاب بکشید یا بزنید", fan, paperName),
    group("نوشته", segment(c.fontSelect, true), range("اندازه", c.fontRange), segment(c.leadingSelect), segment(c.alignSelect)),
    group("صفحه", segment(c.marginsSelect), segment(c.modeSelect)),
    group("حرکت", segment(c.turnSelect), segment(c.speedSelect), segment(c.soundSelect)),
    group("نور", range("گرمای چراغ", c.lampRange)),
    group("بیشتر", c.findLabel, c.focusRow, c.voteRow, c.syncBtn));
  return syncs;
}

/* A sheet can be tapped, or carried over and put down on the book. */
function bindSheet(sheet, value, colour, texture) {
  let start = null, ghost = null;
  const makeGhost = (r) => {
    const g = el("div", "paper-fly");
    g.style.setProperty("--sheet", colour);
    if (texture) g.style.setProperty("--sheet-tex", texture);
    g.style.width = `${r.width}px`; g.style.height = `${r.height}px`;
    ui.overlay.append(g);
    return g;
  };
  const move = (e) => {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!ghost) { if (Math.hypot(dx, dy) < 6) return; ghost = makeGhost(start.r); sheet.classList.add("is-lifted"); }
    ghost.style.transform = `translate(${start.r.left + dx}px,${start.r.top + dy}px) rotate(${Math.max(-14, Math.min(14, dx * .04))}deg) scale(1.08)`;
  };
  const up = (e) => {
    window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
    if (!start) return;
    const r = start.r; start = null;
    if (!ghost) { layPaper(value, makeGhost(r), r); return; }
    const g = ghost, b = ui.bookEl.getBoundingClientRect(), box = g.getBoundingClientRect(); ghost = null;
    sheet.classList.remove("is-lifted");
    const over = e.type === "pointerup" && e.clientX > b.left && e.clientX < b.right && e.clientY > b.top && e.clientY < b.bottom;
    if (over) layPaper(value, g, box);
    else g.animate([{ transform: g.style.transform }, { transform: `translate(${r.left}px,${r.top}px)` }], { duration: 260, easing: "cubic-bezier(.3,.9,.3,1)" }).finished.finally(() => g.remove());
  };
  sheet.addEventListener("pointerdown", (e) => {
    if (e.button) return;
    e.preventDefault();
    start = { x: e.clientX, y: e.clientY, r: sheet.getBoundingClientRect() };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  });
  sheet.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setReaderOption("theme", value); } });
}
async function layPaper(value, sheet, from) {
  if (!book) { sheet.remove(); return; }
  if (value === book.theme || reducedMotion()) { sheet.remove(); setReaderOption("theme", value); return; }
  const b = ui.bookEl.getBoundingClientRect(), sx = b.width / from.width, sy = b.height / from.height;
  const start = `translate(${from.left}px,${from.top}px) rotate(-7deg)`;
  const fly = sheet.animate([
    { transform: start, offset: 0 },
    { transform: `translate(${(from.left + b.left) / 2}px,${Math.min(from.top, b.top) - 20}px) rotate(5deg) scale(${(1 + sx) / 2},${(1 + sy) / 2})`, offset: .55 },
    { transform: `translate(${b.left}px,${b.top}px) rotate(0deg) scale(${sx},${sy})`, offset: 1 },
  ], { duration: 640, easing: "cubic-bezier(.45,.05,.2,1)", fill: "forwards" });
  await fly.finished.catch(() => {});
  setReaderOption("theme", value);
  await sheet.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: "ease", fill: "forwards" }).finished.catch(() => {});
  sheet.remove();
}

// ---------- notes ----------
let pendingQuote = "";
function onSelect() {
  const sel = window.getSelection();
  const text = sel ? normalize(sel.toString()) : "";
  if (!sel || sel.rangeCount === 0 || text.length < 3 || !ui.bookEl.contains(sel.anchorNode)) { ui.selBtn.hidden = true; return false; }
  pendingQuote = text.slice(0, 300);
  const rect = sel.getRangeAt(0).getBoundingClientRect();
  ui.selBtn.hidden = false;
  ui.selBtn.style.top = `${Math.max(8, rect.top - 44)}px`;
  ui.selBtn.style.left = `${Math.min(window.innerWidth - 170, Math.max(8, rect.left + rect.width / 2 - 80))}px`;
  return true;
}
function edgeTurn(e) {
  if (book?.justDragged) { book.justDragged = false; return; }
  if (e.button !== 0 || book?.turning) return;
  if (e.target.closest("mark, button, a, input, textarea")) return;
  const r = ui.bookEl.getBoundingClientRect();
  const x = e.clientX - r.left;
  if (x < r.width * 0.2) turn(1);            // RTL: the outer left edge advances
  else if (x > r.width * 0.8) turn(-1);
}
function openNoteForm(quote) {
  const q = typeof quote === "string" ? quote : pendingQuote;
  ui.selBtn.hidden = true;
  ui.pop.hidden = false;
  ui.popQuote.textContent = q ? `«${q}»` : "نظر کلی درباره‌ی این داستان";
  ui.pop.dataset.quote = q || "";
  ui.popRating.hidden = !!q;
  ui.popCategory.value = q ? "continuity" : "general";
  ui.popStatus.textContent = isGitHubPages() ? "ثبت نهایی در GitHub انجام می‌شود و نیاز به حساب GitHub دارد." : "";
  ui.popText.value = "";
  ui.popText.focus();
}
async function sendNote(e) {
  e.preventDefault();
  if (isGitHubPages()) {
    const endpoint=String(window.THE_WRITER_FEEDBACK_API||"").replace(/[/]$/,"");
    if(endpoint){
      try{
        const response=await fetch(endpoint+"/api/stories/"+encodeURIComponent(book.story.id)+"/comments",{
          method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({name:ui.popName.value,text:ui.popText.value,quote:ui.pop.dataset.quote})
        });
        const data=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(data.error||"ثبت نظر ممکن نشد");
        ui.popStatus.textContent="نظر شما ثبت شد.";
        book.comments.push(data);ui.pop.hidden=true;renderMargin();repaginate();
      }catch(error){ui.popStatus.textContent="ثبت مستقیم ناموفق بود: "+String(error.message||error);}
      return;
    }
    try {
      const result=openPublicFeedback({story:book.story,quote:ui.pop.dataset.quote,name:ui.popName.value,
        text:ui.popText.value,rating:ui.popRating.value,category:ui.popCategory.value});
      ui.popStatus.replaceChildren(document.createTextNode("پیش‌نویس آماده شد؛ برای ثبت نهایی روی Submit در GitHub بزنید. "));
      if(!result.opened){const a=el("a","","باز کردن فرم GitHub");a.href=result.url;a.target="_blank";a.rel="noopener noreferrer";ui.popStatus.append(a);}
    }catch(error){ui.popStatus.textContent=String(error.message||error);}
    return;
  }
  const r = await fetch(`/api/stories/${encodeURIComponent(book.story.id)}/comments`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: ui.popName.value, text: ui.popText.value, quote: ui.pop.dataset.quote }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { ui.popStatus.textContent = r.status === 429 ? "کمی صبر کنید" : (data.error || "ثبت نشد"); return; }
  book.comments.push(data);
  ui.pop.hidden = true;
  window.getSelection()?.removeAllRanges();
  renderMargin();
  repaginate();
  ui.margin.hidden = false;
  focusNote(data.id);
}
function renderMargin() {
  const m = ui.margin;
  m.replaceChildren();
  const head = el("div", "margin-head");
  head.append(el("h3", "", `حاشیه‌ها (${book.comments.length})`));
  const general = el("button", "", "نظر کلی");
  general.addEventListener("click", () => openNoteForm(""));
  head.append(general);
  m.append(head);
  if (!book.comments.length) m.append(el("p", "time", "هنوز کسی چیزی ننوشته. بخشی از متن را انتخاب کنید یا نظر کلی بدهید."));
  for (const c of [...book.comments].reverse()) {
    const card = el("div", "note-card");
    card.dataset.cid = c.id;
    if (c.state === "suspect") card.classList.add("suspect");
    if (c.quote) card.append(el("blockquote", "note-quote", `«${c.quote}»`));
    card.append(el("div", "", c.text), el("div", "time", `${c.name} · ${(c.time || "").replace("T", " ").slice(0, 16)}`));
    if(c.source_url){const link=el("a","","مشاهدهٔ نظر در GitHub");link.href=c.source_url;link.target="_blank";link.rel="noopener noreferrer";card.append(link);}
    card.append(noteState(c));
    if (c.quote) card.addEventListener("click", () => goToQuote(c.quote));
    m.append(card);
  }
  ui.marginBtn.textContent = `حاشیه‌ها (${book.comments.length})`;
}
// One note's check line: the derived state, what the check rested on, and (for the owner) the two verbs.
function noteState(c) {
  const row = el("div", "note-state");
  const chk = c.check || {};
  const badge = el("span", `state state-${c.state || "unchecked"}`, MARGIN_STATE_FA[c.state] || MARGIN_STATE_FA.unchecked);
  row.append(badge);
  if (chk.why) row.append(el("span", "state-why", chk.why));
  if (chk.via) row.append(el("span", "state-via", chk.via === "model" ? "سنجیده با ماشین نوشتن" : "سنجشِ مکانیکی (آفلاین)"));
  if (chk.evidence) row.append(el("span", "state-ev", chk.evidence));
  if (ownerToken() && !c.source_url) {
    const actions = el("div", "note-actions");
    const check = el("button", "", "بسنج");
    check.title = "گذاره را دوباره در متنِ امروزِ نوشته پیدا کنید و حرفِ این حاشیه را با آن بسنجید";
    check.addEventListener("click", (e) => { e.stopPropagation(); checkNote(c.id, check); });
    const wipe = el("button", "", "پاکش کنم");
    wipe.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!wipe.dataset.armed) { wipe.dataset.armed = "1"; wipe.textContent = "قطعی؟"; return; }
      removeNote(c.id, wipe);
    });
    actions.append(check, wipe);
    row.append(actions);
  }
  return row;
}
async function checkNote(cid, btn) {
  btn.disabled = true; btn.textContent = "…";
  try {
    const res = await ownerPost("/api/margins/check", { id: cid });
    const c = book.comments.find((x) => x.id === cid);
    if (c) { c.state = res.state; c.check = res.check; c.suspect = res.state === "suspect"; }
    renderMargin();
  } catch (err) {
    btn.disabled = false; btn.textContent = "بسنج";
    btn.closest(".note-actions")?.append(el("span", "time", String(err.message || err)));
  }
}
async function removeNote(cid, btn) {
  btn.disabled = true;
  try {
    await ownerPost("/api/margins/remove", { id: cid, by: "مالک", reason: "حاشیه‌ای که دیگر نباید خوانده شود" });
    book.comments = book.comments.filter((c) => c.id !== cid);
    renderMargin();
    repaginate();          // the note's highlight must leave the page too
  } catch (err) {
    btn.disabled = false; btn.textContent = "پاکش کنم";
    btn.closest(".note-actions")?.append(el("span", "time", String(err.message || err)));
  }
}
function focusNote(cid) {
  ui.margin.querySelectorAll(".note-card").forEach((c) => c.classList.toggle("focus", c.dataset.cid === cid));
  ui.margin.querySelector(`.note-card[data-cid="${CSS.escape(cid)}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
function goToQuote(q) {
  const needle = normalize(q);
  const head = needle.slice(0, 24);
  let i = book.pages.findIndex((p) => (p.kind === "body" || p.kind === "report") && normalize(p.node.textContent).includes(needle));
  // a quote that straddles a page break only shows its first words on the page it started in
  if (i < 0) i = book.pages.findIndex((p) => (p.kind === "body" || p.kind === "report") && normalize(p.node.textContent).includes(head));
  if (i < 0) return;
  const per = spread();
  goTo(Math.min(i - (i % per), Math.max(0, book.pages.length - per)));
}
function findText(value){
  const needle=normalize(value).toLocaleLowerCase("fa");if(!needle||!book)return;
  const start=book.index+spread();
  const order=[...Array(book.pages.length-start)].map((_,i)=>start+i).concat([...Array(start)].map((_,i)=>i));
  const textAt=i=>normalize(book.pages[i]?.node.textContent||"").toLocaleLowerCase("fa");
  const match=order.find(i=>textAt(i).includes(needle))??order.find(i=>textAt(i).includes(needle.slice(0,Math.min(12,needle.length))));
  if(match==null){ui.find.setCustomValidity("این عبارت در کتاب پیدا نشد.");ui.find.reportValidity();setTimeout(()=>ui.find.setCustomValidity(""),1600);return;}
  const per=spread();goTo(Math.floor(match/per)*per);
}
