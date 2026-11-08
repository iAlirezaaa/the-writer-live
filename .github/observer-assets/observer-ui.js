/* The Writer / Observatory
 * Reframes the existing complete dashboard as a coherent observation studio.
 * No navigation destinations or API actions are deleted, and no new backend
 * permissions are introduced. Panels are the same live DOM nodes.
 */
import {installPersianPresentation,persianDigits} from "./persian-display.js?v=observatory-20261108-v2";

export const PANEL_GROUPS=Object.freeze([
  {title:"زندگی نویسنده",hint:"اکنون، عادت‌ها و روند رشد",ids:["p-status","p-planner","p-diary","p-inner","p-self"]},
  {title:"نوشته‌ها و انتشار",hint:"متن، کتاب و ارتباط با خوانندگان",ids:["p-stories","p-books","p-notebook","p-comments","p-publish"]},
  {title:"شهر و جهان",hint:"مردم، مکان‌ها و واقعیت داستان",ids:["p-town","p-world"]},
  {title:"ذهن و مسیر پیشرفت",hint:"مهارت، حافظه و موانع",ids:["p-graph","p-flaws"]},
  {title:"ابزار و نگهداری",hint:"آرشیو و وضعیت زیرساخت",ids:["p-care"]}
]);
const PANEL_CONTEXT=Object.freeze({
  "p-status":{view:"follow",label:"همراه نویسنده",description:"وضعیت فعلی و آنچه نویسنده انجام می‌دهد"},
  "p-planner":{view:"overview",label:"نمای اتاق",description:"برنامهٔ روز و کارهای پیشِ رو"},
  "p-diary":{view:"desk",label:"میز نویسنده",description:"ردّ روزهای گذشته در نوشته‌های شخصی"},
  "p-inner":{view:"follow",label:"همراه نویسنده",description:"پرسش‌ها، آرزوها و عادت‌ها"},
  "p-self":{view:"follow",label:"همراه نویسنده",description:"رشد، پرسونا و هستهٔ شخصیت"},
  "p-stories":{view:"desk",label:"میز کار",description:"داستان‌ها و دست‌نوشته‌های واقعی"},
  "p-books":{view:"library",label:"کتابخانهٔ خانه",description:"آثار و کتاب‌هایی که در جهان او هستند"},
  "p-notebook":{view:"desk",label:"دفترچهٔ روی میز",description:"ایده‌هایی که می‌توانند به داستان تبدیل شوند"},
  "p-comments":{view:"library",label:"کتابخانه",description:"نامه‌ها و نظرهای خوانندگان"},
  "p-publish":{view:"publisher",label:"دفتر ناشر",description:"بازخوردها، چاپ و هویت ناشر"},
  "p-town":{view:"town",label:"شهر",description:"شهروندان، برنامه‌ها و مکان‌های قابل‌تماشا"},
  "p-world":{view:"town",label:"شهر",description:"قوانین و منابع جهان داستانی"},
  "p-graph":{view:"desk",label:"محیط کار",description:"شبکهٔ دانش، مهارت و تجربه"},
  "p-flaws":{view:"desk",label:"میز کار",description:"خطاهای ثبت‌شده و تلاش برای رفعشان"},
  "p-care":{view:"building",label:"ساختمان",description:"بایگانی، پشتیبان و تنظیمات نگهداری"}
});
const VIEW_CONTEXT=Object.freeze({
  town:{panel:"p-town",title:"زندگی در محله"},
  cars:{panel:"p-town",title:"رفت‌وآمد شهر"},
  publisher:{panel:"p-publish",title:"دفتر ناشر"},
  bookstore:{panel:"p-town",title:"کتاب‌فروشی"},
  building:{panel:"p-care",title:"خانهٔ نویسنده"},
  overview:{panel:"p-status",title:"اتاق نویسنده"},
  follow:{panel:"p-status",title:"همراه نویسنده"},
  desk:{panel:"p-stories",title:"میز نوشتن"},
  window:{panel:"p-diary",title:"پنجره و محله"},
  library:{panel:"p-books",title:"کتابخانهٔ خانه"}
});
const SCENE_GROUPS=[
  {name:"بیرون از خانه",ids:["town","cars","publisher","bookstore"]},
  {name:"خانه و نویسنده",ids:["building","overview","follow","desk","window","library"]}
];

export function initObserverUI({selectTab,setView,onShowPanel,getSceneHour}){
  const $=id=>document.getElementById(id);
  installPersianPresentation(document.body);
  const nav=document.querySelector(".tabbar");
  if(!nav)throw new Error("The complete original tab menu is required");
  const tabs=[...nav.querySelectorAll("button[data-panel]")];
  const camera=document.querySelector(".stage-tools");
  const originalViews=[...camera.querySelectorAll("button[data-view]")];
  const allIds=PANEL_GROUPS.flatMap(group=>group.ids);
  if(allIds.length!==tabs.length||
     new Set(allIds).size!==tabs.length||
     !tabs.every(tab=>allIds.includes(tab.dataset.panel)))
    throw new Error("Observer navigation must preserve every original panel");
  if(SCENE_GROUPS.flatMap(group=>group.ids).length!==originalViews.length)
    throw new Error("Observer camera groups must preserve every original view");
  const tabById=new Map(tabs.map(b=>[b.dataset.panel,b]));
  const sceneById=new Map(originalViews.map(b=>[b.dataset.view,b]));
  nav.setAttribute("aria-label","فهرست کامل زندگی و آثار نویسنده");
  nav.setAttribute("role","navigation");
  nav.replaceChildren();
  for(const group of PANEL_GROUPS){
    const sec=document.createElement("section");sec.className="observer-nav-group";
    const header=document.createElement("div");header.className="observer-nav-header";
    const title=document.createElement("h3");title.textContent=group.title;
    const hint=document.createElement("span");hint.textContent=group.hint;
    header.append(title,hint);
    const buttons=document.createElement("div");buttons.className="observer-nav-options";
    buttons.setAttribute("role","tablist");buttons.setAttribute("aria-label",group.title);
    const groupTabs=[];
    for(const id of group.ids){
      const tab=tabById.get(id);
      tab.id="observer-tab-"+id;
      tab.setAttribute("aria-controls",id);
      tab.setAttribute("type","button");
      tab.tabIndex=tab.getAttribute("aria-selected")==="true"?0:-1;
      const pane=$(id);
      if(pane){
        pane.setAttribute("role","tabpanel");
        pane.setAttribute("aria-labelledby",tab.id);
        pane.tabIndex=0;
      }
      buttons.append(tab);groupTabs.push(tab);
    }
    // Right-to-left keyboard traversal: arrow-right moves to the previous
    // tab, arrow-left to the next. Home/End jump to the group boundaries.
    buttons.addEventListener("keydown",event=>{
      const tab=event.target.closest?.("button[data-panel]");
      if(!tab)return;
      const i=groupTabs.indexOf(tab);
      let next=i;
      if(event.key==="ArrowLeft")next=(i+1)%groupTabs.length;
      else if(event.key==="ArrowRight")next=(i-1+groupTabs.length)%groupTabs.length;
      else if(event.key==="Home")next=0;
      else if(event.key==="End")next=groupTabs.length-1;
      else return;
      event.preventDefault();
      groupTabs[next].focus();
      groupTabs[next].click();
    });
    sec.append(header,buttons);nav.append(sec);
  }
  camera.setAttribute("aria-label","همهٔ نماهای دوربین");
  camera.replaceChildren();
  for(const group of SCENE_GROUPS){
    const el=document.createElement("div");el.className="observer-camera-group";
    const heading=document.createElement("strong");heading.className="observer-camera-heading";heading.textContent=group.name;
    const options=document.createElement("div");options.className="observer-camera-options";
    options.setAttribute("role","group");options.setAttribute("aria-label",group.name);
    for(const id of group.ids){
      const b=sceneById.get(id);if(!b)throw new Error("Missing scene control: "+id);
      b.type="button";b.title=group.name+" · "+b.textContent.trim();
      options.append(b);
    }
    el.append(heading,options);camera.append(el);
  }
  let currentTab="p-stories",currentView="overview";
  function syncTab(id){
    if(!PANEL_CONTEXT[id])return;
    currentTab=id;
    tabs.forEach(tab=>{tab.tabIndex=tab.dataset.panel===id?0:-1;});
    const panel=$(id),details=PANEL_CONTEXT[id];
    const group=PANEL_GROUPS.find(g=>g.ids.includes(id));
    if($("observer-panel-title"))$("observer-panel-title").textContent=panel?.dataset.title||tabById.get(id)?.textContent||"مشاهده";
    if($("observer-panel-path"))$("observer-panel-path").textContent=group.title+" / "+(panel?.dataset.title||"");
    if($("observer-panel-description"))$("observer-panel-description").textContent=details.description;
    if($("panel-scene-link"))$("panel-scene-link").textContent="دیدن «"+details.label+"» در صحنه";
    nav.querySelectorAll(".observer-nav-group").forEach(g=>{
      g.classList.toggle("has-selection",g.querySelector('button[aria-selected="true"]')!==null);
    });
  }
  function syncView(view){
    if(!VIEW_CONTEXT[view])return;
    currentView=view;
    const info=VIEW_CONTEXT[view];
    if($("observer-scene-context"))$("observer-scene-context").textContent=info.title;
    if($("scene-data-link"))$("scene-data-link").textContent="مشاهدهٔ پروندهٔ «"+info.title+"»";
  }
  $("panel-scene-link")?.addEventListener("click",()=>{
    const dest=PANEL_CONTEXT[currentTab];
    if(dest)setView(dest.view);
  });
  $("scene-data-link")?.addEventListener("click",()=>{
    const dest=VIEW_CONTEXT[currentView];
    if(dest)onShowPanel(dest.panel);
  });
  document.querySelectorAll("[data-observe-panel]").forEach(button=>{
    button.addEventListener("click",()=>onShowPanel(button.dataset.observePanel));
  });
  document.querySelectorAll("[data-observe-view]").forEach(button=>{
    button.addEventListener("click",()=>setView(button.dataset.observeView));
  });
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
    const message=mode==="auto"?"هماهنگ با ساعت صحنه":value==="dark"?"نمای شب":"نمای روز";
    if($("observer-theme-status"))$("observer-theme-status").textContent=message;
    if(theme)theme.setAttribute("aria-label","حالت رابط کاربری: "+message);
  }
  theme?.addEventListener("change",()=>{
    mode=["auto","light","dark"].includes(theme.value)?theme.value:"auto";
    try{localStorage.setItem(themeKey,mode);}catch{}
    updateTheme();
  });
  $("scene-time")?.addEventListener("change",updateTheme);
  function updateTime(date=new Date()){
    if(Number.isNaN(date.getTime()))return;
    const formatted=new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-arabext",{
      timeZone:"Asia/Tehran",weekday:"long",day:"numeric",month:"long",year:"numeric"
    }).format(date);
    if($("observer-date"))$("observer-date").textContent=formatted;
    if($("observer-scene-date"))$("observer-scene-date").textContent=formatted;
    updateTheme();
  }
  function updateStatus(status){
    const description=status?.activity||"در حال مشاهدهٔ زندگی نویسنده";
    if($("observer-live-action"))$("observer-live-action").textContent=description;
    if($("observer-mode-label"))$("observer-mode-label").textContent=
      status?.asleep?"نویسنده خواب است":"داستان زندگی در جریان است";
  }
  $("observer-watch")?.addEventListener("click",()=>{
    const hidden=document.body.classList.contains("side-collapsed");
    onShowPanel(hidden?currentTab:null); // null => watch mode, no panel change
  });
  syncTab("p-stories");syncView("overview");updateTime();
  return {syncTab,syncView,updateTime,updateStatus,updateTheme,
    panelCount:tabs.length,viewCount:originalViews.length,
    activePanel:()=>currentTab,activeView:()=>currentView};
}
