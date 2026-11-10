/** Removable shelf-to-notebook transition, loaded on demand. No APIs or extra renderer. */
let activeDialog=null;
function element(tag,className,text){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!=null)node.textContent=String(text);
  return node;
}
const reduced=()=>window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches===true;
export function openShelfBook(button,story,readStory){
  if(activeDialog?.open||!button?.isConnected)return;
  const dialog=element("dialog","shelf-notebook-dialog");
  const spread=element("div","shelf-notebook-spread");
  const info=element("section","shelf-notebook-information");
  const kicker=element("span","shelf-notebook-kicker","THE WRITER  /  NOTEBOOK");
  const title=element("h2","shelf-notebook-title",story.title||"اثر بی‌عنوان");
  title.id="shelf-notebook-title";
  dialog.setAttribute("aria-labelledby",title.id);
  const category=element("p","shelf-notebook-subtitle",story.stage||"داستان");
  const summary=element("p","shelf-notebook-summary","هر کتاب دری به جهان نویسنده است. این اثر را باز کنید و از همان جایی که قبلاً خوانده‌اید ادامه بدهید.");
  const detail=element("p","shelf-notebook-stat",new Intl.NumberFormat("fa-IR").format(story.words||0)+" واژه");
  const controls=element("div","shelf-notebook-actions");
  const start=element("button","shelf-notebook-read","باز کردن و مطالعه");
  start.type="button";
  const closeButton=element("button","shelf-notebook-close","بازگشت به قفسه");
  closeButton.type="button";
  controls.append(start,closeButton);
  info.append(kicker,title,category,summary,detail,controls);
  const visual=element("div","shelf-notebook-visual");
  const page=element("div","shelf-notebook-page");
  const label=element("span","shelf-notebook-paper-label","THE WRITER · EDITION");
  const art=button.cloneNode(true);
  art.className="cover shelf-notebook-front";
  art.removeAttribute("id");
  art.removeAttribute("aria-expanded");
  art.removeAttribute("aria-busy");
  art.disabled=true;
  art.tabIndex=-1;
  art.querySelector(".shelf-spine")?.remove();
  page.append(label,art);
  visual.append(page);
  spread.append(info,visual);
  dialog.append(spread);
  document.body.append(dialog);
  activeDialog=dialog;
  let exitRequested=false,animation=null;
  const origin=button.getBoundingClientRect();
  const cleanup=()=>{
    animation?.cancel();
    if(dialog.open)dialog.close();
    dialog.remove();
    if(activeDialog===dialog)activeDialog=null;
    if(button.isConnected)button.focus({preventScroll:true});
  };
  const close=()=>{
    if(exitRequested)return;
    exitRequested=true;
    if(reduced()){cleanup();return;}
    animation?.cancel();
    animation=spread.animate([
      {opacity:1,transform:"translate3d(0,0,0) scale(1) rotateY(0deg)"},
      {opacity:0,transform:"translate3d(0,18px,0) scale(.94) rotateY(-7deg)"}
    ],{duration:210,easing:"ease-in",fill:"forwards"});
    animation.finished.then(cleanup,cleanup);
  };
  const enterReader=()=>{
    if(exitRequested)return;
    exitRequested=true;
    if(reduced()){cleanup();readStory();return;}
    animation?.cancel();
    animation=spread.animate([
      {opacity:1,transform:"translate3d(0,0,0) scale(1)"},
      {opacity:0,transform:"translate3d(0,0,0) scale(1.13)"}
    ],{duration:300,easing:"cubic-bezier(.22,.75,.2,1)",fill:"forwards"});
    animation.finished.then(()=>{cleanup();readStory();},()=>{cleanup();readStory();});
  };
  closeButton.addEventListener("click",close);
  start.addEventListener("click",enterReader);
  dialog.addEventListener("cancel",event=>{event.preventDefault();close();});
  dialog.addEventListener("click",event=>{if(event.target===dialog)close();});
  dialog.addEventListener("close",()=>{if(activeDialog===dialog)cleanup();},{once:true});
  dialog.showModal();
  if(!reduced()){
    const target=spread.getBoundingClientRect();
    const dx=origin.left+origin.width/2-(target.left+target.width/2);
    const dy=origin.top+origin.height/2-(target.top+target.height/2);
    const scale=Math.max(.1,Math.min(.65,origin.width/target.width));
    animation=spread.animate([
      {opacity:.5,transform:"translate3d("+dx+"px,"+dy+"px,0) scale("+scale+") rotateY(-48deg)"},
      {opacity:1,transform:"translate3d(0,0,0) scale(1) rotateY(0deg)"}
    ],{duration:760,easing:"cubic-bezier(.13,.8,.14,1)",fill:"both"});
  }
  closeButton.focus({preventScroll:true});
}
