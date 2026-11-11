/* The Writer / main page.
 * The scene fills the page. One small dock has three jobs: read, go somewhere, see the writer's life.
 * Everything else opens on request and closes again. Panels stay the same live DOM nodes.
 */
import {installPersianPresentation} from "./persian-display.js?v=observatory-20261108-v2";

export const PANEL_GROUPS=Object.freeze([
  {title:"نوشته‌ها",ids:["p-stories","p-books","p-notebook","p-comments","p-publish"]},
  {title:"زندگی",ids:["p-planner","p-diary","p-inner","p-self","p-status"]},
  {title:"جهان",ids:["p-town","p-world","p-graph","p-flaws","p-care"]}
]);
const PANEL_CONTEXT=Object.freeze({
  "p-status":{view:"follow",label:"همراه نویسنده",description:"انرژی، خلق و آمار کار"},
  "p-planner":{view:"overview",label:"اتاق بالا",description:"امروز چه کارهایی دارد"},
  "p-diary":{view:"desk",label:"میز نوشتن",description:"چیزهایی که هر روز برای خودش می‌نویسد"},
  "p-inner":{view:"groundfloor",label:"طبقهٔ پایین",description:"پرسش‌ها، آرزوها و عادت‌ها"},
  "p-self":{view:"follow",label:"همراه نویسنده",description:"چطور عوض شده و چه یاد گرفته"},
  "p-stories":{view:"desk",label:"میز نوشتن",description:"هر چه نوشته، حتی آنچه رد شده"},
  "p-books":{view:"library",label:"کتابخانه",description:"کتاب‌هایی که دارد و می‌خواند"},
  "p-notebook":{view:"desk",label:"میز نوشتن",description:"ایده‌هایی که شاید داستان شوند"},
  "p-comments":{view:"library",label:"کتابخانه",description:"حرف خواننده‌ها. شما هم بنویسید"},
  "p-publish":{view:"publisher",label:"دفتر ناشر",description:"نظر ناشر، چاپ و فروش"},
  "p-town":{view:"town",label:"شهر",description:"مردم و جاهای شهر"},
  "p-world":{view:"town",label:"شهر",description:"قوانین و منابع جهان داستان‌ها"},
  "p-graph":{view:"desk",label:"میز نوشتن",description:"چیزهایی که بلد است و به یاد دارد"},
  "p-flaws":{view:"desk",label:"میز نوشتن",description:"ایرادهای کارش و تلاش برای رفعشان"},
  "p-care":{view:"building",label:"برش خانه",description:"بایگانی، پشتیبان و تنظیمات مالک"}
});
const VIEW_CONTEXT=Object.freeze({
  civita:{panel:"p-town",title:"شهر و پل از بالا"},
  town:{panel:"p-town",title:"شهر"},
  cars:{panel:"p-town",title:"رفت‌وآمد شهر"},
  piazza:{panel:"p-town",title:"میدان سان دوناتو"},
  gate:{panel:"p-town",title:"دروازهٔ شهر"},
  bridge:{panel:"p-town",title:"پل"},
  cliffs:{panel:"p-town",title:"صخره‌ها و دره"},
  publisher:{panel:"p-publish",title:"دفتر ناشر"},
  bookstore:{panel:"p-town",title:"کتاب‌فروشی"},
  home:{panel:"p-status",title:"جلوی خانه"},
  building:{panel:"p-care",title:"برش خانه"},
  groundfloor:{panel:"p-inner",title:"طبقهٔ پایین"},
  overview:{panel:"p-status",title:"اتاق بالا"},
  follow:{panel:"p-status",title:"همراه نویسنده"},
  desk:{panel:"p-stories",title:"میز نوشتن"},
  window:{panel:"p-diary",title:"پنجره"},
  library:{panel:"p-books",title:"کتابخانه"}
});
const SCENE_GROUPS=[
  {name:"شهر",ids:["town","civita","piazza","gate","bridge","cliffs"]},
  {name:"خانهٔ نویسنده",ids:["home","building","groundfloor","overview","desk","library","window","follow"]},
  {name:"جاهای دیگر",ids:["publisher","bookstore"]}
];
const HINT_KEY="the-writer-hint-seen-v1";

// One keyboard entry per group; inactive groups remember their previous entry.
export function observerTabStops(activeId, previous={}){
  const stops={};
  for(const group of PANEL_GROUPS){
    const remembered=previous[group.title];
    stops[group.title]=group.ids.includes(activeId)?activeId:
      group.ids.includes(remembered)?remembered:group.ids[0];
  }
  return stops;
}

export function initObserverUI({selectTab,setView,onShowPanel,onOpenSheet,getSceneHour}){
  const $=id=>document.getElementById(id);
  installPersianPresentation(document.body);
  const nav=document.querySelector(".tabbar");
  if(!nav)throw new Error("The section list is required");
  const tabs=[...nav.querySelectorAll("button[data-panel]")];
  const camera=document.querySelector(".stage-tools");
  const originalViews=[...camera.querySelectorAll("button[data-view]")];
  const allIds=PANEL_GROUPS.flatMap(group=>group.ids);
  if(allIds.length!==tabs.length||new Set(allIds).size!==tabs.length||!tabs.every(tab=>allIds.includes(tab.dataset.panel)))
    throw new Error("Navigation must keep every panel");
  if(SCENE_GROUPS.flatMap(group=>group.ids).length!==originalViews.length)
    throw new Error("Place list must keep every view");
  const tabById=new Map(tabs.map(b=>[b.dataset.panel,b]));
  const sceneById=new Map(originalViews.map(b=>[b.dataset.view,b]));
  const sheet=$("side");

  nav.setAttribute("role","navigation");nav.setAttribute("aria-label","بخش‌ها");nav.replaceChildren();
  for(const group of PANEL_GROUPS){
    const sec=document.createElement("section");sec.className="sheet-group";
    const title=document.createElement("h3");title.textContent=group.title;
    const list=document.createElement("div");list.className="sheet-rows";list.setAttribute("role","tablist");list.setAttribute("aria-label",group.title);
    const groupTabs=[];
    for(const id of group.ids){
      const tab=tabById.get(id),name=tab.textContent.trim();
      tab.id="observer-tab-"+id;tab.type="button";tab.setAttribute("aria-controls",id);
      tab.tabIndex=tab.getAttribute("aria-selected")==="true"?0:-1;
      tab.replaceChildren();
      const strong=document.createElement("strong");strong.textContent=name;
      const small=document.createElement("small");small.textContent=PANEL_CONTEXT[id].description;
      tab.append(strong,small);
      tab.dataset.name=name;
      tab.addEventListener("click",()=>openDetail());
      const pane=$(id);
      if(pane){pane.setAttribute("role","tabpanel");pane.setAttribute("aria-labelledby",tab.id);pane.tabIndex=0;}
      list.append(tab);groupTabs.push(tab);
    }
    // Right-to-left: arrow-left moves forward.
    list.addEventListener("keydown",event=>{
      const tab=event.target.closest?.("button[data-panel]");if(!tab)return;
      const i=groupTabs.indexOf(tab);let next=i;
      if(event.key==="ArrowLeft"||event.key==="ArrowDown")next=(i+1)%groupTabs.length;
      else if(event.key==="ArrowRight"||event.key==="ArrowUp")next=(i-1+groupTabs.length)%groupTabs.length;
      else if(event.key==="Home")next=0;
      else if(event.key==="End")next=groupTabs.length-1;
      else return;
      event.preventDefault();groupTabs[next].focus();
    });
    sec.append(title,list);nav.append(sec);
  }

  camera.replaceChildren();
  for(const group of SCENE_GROUPS){
    const el=document.createElement("div");el.className="place-group";
    const heading=document.createElement("h3");heading.textContent=group.name;
    const options=document.createElement("div");options.className="place-options";
    options.setAttribute("role","group");options.setAttribute("aria-label",group.name);
    for(const id of group.ids){
      const b=sceneById.get(id);if(!b)throw new Error("Missing place: "+id);
      b.type="button";options.append(b);
    }
    el.append(heading,options);camera.append(el);
  }

  const pops=[{button:$("open-places"),pop:$("places")},{button:$("open-settings"),pop:$("settings")}];
  function closePops(except){
    for(const {button,pop} of pops){if(pop===except)continue;pop.hidden=true;button.setAttribute("aria-expanded","false");}
  }
  for(const {button,pop} of pops){
    button.addEventListener("click",event=>{
      event.stopPropagation();
      const opening=pop.hidden;closePops(pop);pop.hidden=!opening;button.setAttribute("aria-expanded",String(opening));
      if(opening)onShowPanel(null);
    });
    pop.addEventListener("click",event=>event.stopPropagation());
  }
  // Choosing a place is the end of that task, so the list goes away and the scene is what's left.
  camera.addEventListener("click",event=>{if(event.target.closest("button[data-view]"))closePops();});
  document.addEventListener("pointerdown",event=>{if(!event.target.closest(".pop,.dock"))closePops();});
  document.addEventListener("keydown",event=>{
    if(event.key!=="Escape")return;
    closePops();
    if(!document.body.classList.contains("side-collapsed")){
      if(sheet.dataset.sheet==="detail")openHome();else closeSheet();
    }
  });

  function openHome(){
    sheet.dataset.sheet="home";
    $("observer-panel-title").textContent="زندگی نویسنده";
    $("observer-panel-description").textContent="الان چه می‌کند و چه نوشته است";
    sheet.querySelector(".sheet-scroll").scrollTop=0;
  }
  function openDetail(){
    sheet.dataset.sheet="detail";
    showHeading(currentTab);
    sheet.querySelector(".sheet-scroll").scrollTop=0;
  }
  function closeSheet(){
    onShowPanel(null);$("open-life").setAttribute("aria-expanded","false");
  }
  function showHeading(id){
    const tab=tabById.get(id),details=PANEL_CONTEXT[id];
    $("observer-panel-title").textContent=tab?.dataset.name||"";
    $("observer-panel-description").textContent=details?.description||"";
    if($("panel-scene-link"))$("panel-scene-link").textContent="دیدن «"+details.label+"» در صحنه";
  }
  $("open-life").addEventListener("click",event=>{
    event.stopPropagation();closePops();
    if(!document.body.classList.contains("side-collapsed")){closeSheet();return;}
    openHome();onOpenSheet?.();$("open-life").setAttribute("aria-expanded","true");
  });
  $("sheet-close").addEventListener("click",closeSheet);
  $("sheet-back").addEventListener("click",openHome);

  let currentTab="p-stories",currentView="town";
  function syncTab(id){
    if(!PANEL_CONTEXT[id])return;
    currentTab=id;
    const previousStops=Object.fromEntries(PANEL_GROUPS.map(group=>[group.title,group.ids.find(panelId=>tabById.get(panelId)?.tabIndex===0)]));
    const groupStops=observerTabStops(id,previousStops);
    for(const group of PANEL_GROUPS)for(const panelId of group.ids)tabById.get(panelId).tabIndex=groupStops[group.title]===panelId?0:-1;
    if(sheet.dataset.sheet==="detail")showHeading(id);
  }
  function syncView(view){
    if(!VIEW_CONTEXT[view])return;
    currentView=view;
    const info=VIEW_CONTEXT[view];
    if($("observer-scene-context"))$("observer-scene-context").textContent=info.title;
    if($("location-label"))$("location-label").textContent=info.title;
  }
  $("panel-scene-link")?.addEventListener("click",()=>{const dest=PANEL_CONTEXT[currentTab];if(dest){setView(dest.view);closeSheet();}});
  $("scene-data-link")?.addEventListener("click",()=>{const dest=VIEW_CONTEXT[currentView];if(dest){onShowPanel(dest.panel);$("open-life").setAttribute("aria-expanded","true");}});

  // One-time orientation, then it never comes back.
  const hint=$("hud-hint");
  let seen=false;try{seen=localStorage.getItem(HINT_KEY)==="1";}catch{}
  if(hint&&!seen){
    hint.hidden=false;
    $("hud-hint-close").addEventListener("click",()=>{hint.hidden=true;try{localStorage.setItem(HINT_KEY,"1");}catch{}});
  }

  const theme=$("observer-theme"),themeKey="the-writer-observer-theme-v1";
  let mode="auto";
  try{const saved=localStorage.getItem(themeKey);if(["auto","light","dark"].includes(saved))mode=saved;}catch{}
  if(theme)theme.value=mode;
  function updateTheme(){
    const hour=Number(getSceneHour?.());
    const sceneNight=Number.isFinite(hour)?hour<7||hour>=18:false;
    const value=mode==="auto"?(sceneNight?"dark":"light"):mode;
    document.documentElement.dataset.theme=value;
    document.body.dataset.observerTheme=value;
  }
  theme?.addEventListener("change",()=>{
    mode=["auto","light","dark"].includes(theme.value)?theme.value:"auto";
    try{localStorage.setItem(themeKey,mode);}catch{}
    updateTheme();
  });
  $("scene-time")?.addEventListener("change",updateTheme);
  function updateTime(date=new Date()){
    if(Number.isNaN(date.getTime()))return;
    const formatted=new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-arabext",{weekday:"long",day:"numeric",month:"long"}).format(date);
    if($("observer-date"))$("observer-date").textContent=formatted;
    updateTheme();
  }
  function updateStatus(){}
  syncTab("p-stories");syncView("town");updateTime();
  return {syncTab,syncView,updateTime,updateStatus,updateTheme,openDetail,openHome,
    panelCount:tabs.length,viewCount:originalViews.length,
    activePanel:()=>currentTab,activeView:()=>currentView};
}
