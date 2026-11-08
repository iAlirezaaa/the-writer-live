// Public, persistent reader feedback via GitHub Issues (no API token in the browser).
// The confirmation happens on GitHub after the reader signs in and presses Submit.
const REPO="https://github.com/iAlirezaaa/the-writer-live";
const container=document.querySelector("#reader-feedback");
if(container){
 const form=document.createElement("form");form.className="public-feedback-form";
 const heading=document.createElement("h2");heading.textContent="نظر شما دربارهٔ داستان";
 const intro=document.createElement("p");intro.textContent="نظرها پس از تأیید شما در GitHub Issues ثبت و برای نویسنده قابل پیگیری می‌شوند. برای ارسال، ورود به حساب GitHub لازم است.";
 const select=document.createElement("select");select.required=true;select.setAttribute("aria-label","انتخاب داستان");
 const empty=new Option("انتخاب داستان…","");select.append(empty);
 const rating=document.createElement("select");rating.required=true;rating.setAttribute("aria-label","امتیاز خواننده");
 rating.append(new Option("امتیاز (۱ تا ۵)",""));for(let n=1;n<=5;n++)rating.append(new Option(String(n).replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[+d]),String(n)));
 const category=document.createElement("select");category.setAttribute("aria-label","موضوع نظر");
 [["general","نظر کلی"],["plot","پیرنگ و منطق داستان"],["character","شخصیت‌پردازی"],["prose","نثر و گفت‌وگو"],["continuity","پیوستگی جهان"]].forEach(([v,t])=>category.append(new Option(t,v)));
 const comment=document.createElement("textarea");comment.required=true;comment.minLength=15;comment.maxLength=2500;comment.rows=4;comment.placeholder="دقیق بگویید چه چیزی خوب یا ضعیف بود، ترجیحاً با اشاره به صحنه یا جمله…";
 const submit=document.createElement("button");submit.type="submit";submit.textContent="ادامه و ثبت نظر در GitHub";
 const status=document.createElement("p");status.setAttribute("role","status");status.className="feedback-status";
 form.append(heading,intro,select,rating,category,comment,submit,status);container.append(form);
 const fa=new Intl.NumberFormat("fa-IR");
 async function load(){
  try{
   const response=await fetch("../snapshot/stories.json",{cache:"no-store"});
   if(!response.ok)throw Error("stories");
   const stories=await response.json();
   for(const story of stories.filter(s=>s.status==="accepted"))select.append(new Option(story.title+" · "+fa.format(Number(story.id)),String(story.id)));
   const hash=decodeURIComponent(location.hash.slice(1));if([...select.options].some(o=>o.value===hash))select.value=hash;
  }catch{status.textContent="فهرست داستان‌ها بارگذاری نشد. صفحه را تازه‌سازی کنید.";submit.disabled=true}
 }
 window.addEventListener("hashchange",()=>{const id=decodeURIComponent(location.hash.slice(1));if([...select.options].some(o=>o.value===id))select.value=id});
 form.addEventListener("submit",e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const title=select.selectedOptions[0]?.textContent||select.value;
  const body=["## Reader feedback","Story: "+title,"Story ID: "+select.value,"Rating: "+rating.value+"/5","Category: "+category.selectedOptions[0].textContent,"","## Reader's words",comment.value.trim(),"","---","Submitted by a reader from the public The Writer library. This is reader feedback, not a verified editorial judgment."].join("\n");
  const url=REPO+"/issues/new?"+new URLSearchParams({title:"[Reader feedback] "+title+" — "+category.selectedOptions[0].textContent,body}).toString();
  window.open(url,"_blank","noopener,noreferrer");
  status.textContent="فرم GitHub در پنجرهٔ جدید باز شد. نظر تا زمانی که آنجا Submit را نزنید ثبت نمی‌شود.";
 });
 load();
}
