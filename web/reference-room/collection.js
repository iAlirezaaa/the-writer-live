// Reader-owned collection; saved IDs never change the author's catalogue.
import { readerEditorial } from '../reader-editorial.js';
export function installCollection(catalog){
 const previews=new Map();
 async function preview(book){
  if(previews.has(book.id))return previews.get(book.id);
  const path=location.hostname.endsWith('github.io')?`../../snapshot/stories/${encodeURIComponent(book.id)}.json`:`../../api/stories/${encodeURIComponent(book.id)}`;
  const response=await fetch(new URL(path,import.meta.url));if(!response.ok)throw new Error('preview unavailable');
  const story=await response.json(),editorial=readerEditorial(story);
  const excerpt=String(story.body||'').replace(/^# [^\n]*\n+/, '').trim().replace(/\s+/g,' ');
  const result=editorial?.summary?['دربارهٔ داستان',editorial.summary]:['آغاز داستان',excerpt?excerpt.slice(0,300)+(excerpt.length>300?'…':''):'معرفی این اثر هنوز آماده نیست.'];
  previews.set(book.id,result);return result;
 }
 const key='the-writer-saved-books';let saved=new Set();
 try{const value=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(value))saved=new Set(value.filter(id=>typeof id==='string'));}catch{}
 const trigger=document.createElement('button');trigger.className='collection-trigger';trigger.textContent='گشتن میان کتاب‌ها';
 const dialog=document.createElement('dialog');dialog.className='collection-dialog';dialog.dir='rtl';dialog.setAttribute('aria-label','گشتن میان کتاب‌ها');
 const header=document.createElement('header'),heading=document.createElement('h2'),close=document.createElement('button');heading.textContent='کتابی برای لحظهٔ تو';close.textContent='بستن';close.addEventListener('click',()=>dialog.close());header.append(heading,close);
 const input=document.createElement('input');input.type='search';input.placeholder='نام کتاب را جست‌وجو کن';input.setAttribute('aria-label','جست‌وجوی کتاب');
 const filter=document.createElement('button');filter.textContent='ذخیره‌شده‌های من';filter.setAttribute('aria-pressed','false');let onlySaved=false;
 const note=document.createElement('p');note.className='collection-note';note.textContent='ذخیره‌ها در همین مرورگر نگهداری می‌شوند.';note.setAttribute('role','status');
 const list=document.createElement('div');list.className='collection-grid';
 const count=document.createElement('p');count.className='collection-note';count.setAttribute('role','status');
 dialog.addEventListener('keydown',event=>event.stopPropagation());
 dialog.addEventListener('close',()=>trigger.focus());
 const normalize=text=>text.normalize('NFKC').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u064b-\u065f]/g,'').trim();
 function render(focusId){
  list.replaceChildren();const matches=catalog.filter(book=>(!onlySaved||saved.has(book.id))&&normalize(book.title).includes(normalize(input.value)));
  count.textContent=`${new Intl.NumberFormat('fa-IR').format(matches.length)} کتاب`;
  for(const book of matches){
   const card=document.createElement('article'),title=document.createElement('h3'),read=document.createElement('a'),save=document.createElement('button');
   title.textContent=book.title;read.textContent='خواندن کتاب';read.href=new URL(`../../reader/?from=room#${encodeURIComponent(book.id)}`,import.meta.url).href;
   let progress=0;try{const state=JSON.parse(localStorage.getItem(`the-writer-reading:${book.id}`)||'null');progress=Math.max(0,Math.min(1,Number(state?.progress)||0));}catch{}
   if(progress>0){read.textContent=progress>=1?'دوباره بخوان':'ادامهٔ خواندن';const status=document.createElement('p');status.className='collection-note';status.textContent=`${new Intl.NumberFormat('fa-IR',{style:'percent',maximumFractionDigits:0}).format(progress)} خوانده‌شده`;card.append(status);}
   save.textContent=saved.has(book.id)?'حذف از ذخیره‌ها':'ذخیره برای بعد';save.setAttribute('aria-pressed',String(saved.has(book.id)));save.setAttribute('aria-label',`${save.textContent}: ${book.title}`);
   save.addEventListener('click',()=>{const next=new Set(saved);next.has(book.id)?next.delete(book.id):next.add(book.id);try{localStorage.setItem(key,JSON.stringify([...next]));saved=next;note.textContent=saved.has(book.id)?'کتاب در این مرورگر ذخیره شد.':'کتاب از ذخیره‌ها حذف شد.';render(book.id);}catch{note.textContent='مرورگر اجازهٔ ذخیره‌کردن نداد. تنظیمات ذخیره‌سازی را بررسی کن.';}});
   const details=document.createElement('details'),summary=document.createElement('summary'),description=document.createElement('p');summary.textContent='نگاهی به کتاب';description.className='collection-excerpt';details.append(summary,description);
   let loading=false,loaded=false;
   details.addEventListener('toggle',async()=>{if(!details.open||loading||loaded)return;loading=true;description.textContent='در حال دریافت معرفی…';description.setAttribute('aria-busy','true');try{const [label,text]=await preview(book);summary.textContent=label;description.textContent=text;loaded=true;}catch{description.textContent='معرفی دریافت نشد. برای تلاش دوباره این بخش را ببند و باز کن.';}finally{loading=false;description.removeAttribute('aria-busy');}});
   card.append(title,details,read,save);list.append(card);
   if(focusId===book.id)save.focus();
  }
  if(!matches.length){const empty=document.createElement('p');empty.textContent=onlySaved?'هنوز کتابی با این مشخصات ذخیره نکرده‌ای.':'کتابی با این نام پیدا نشد.';list.append(empty);}
  if(focusId&&!matches.some(book=>book.id===focusId))filter.focus();
 }
 input.addEventListener('input',()=>render());filter.addEventListener('click',()=>{onlySaved=!onlySaved;filter.setAttribute('aria-pressed',String(onlySaved));render();});
 dialog.append(header,input,filter,note,count,list);document.body.append(trigger,dialog);trigger.addEventListener('click',()=>{render();dialog.showModal();input.focus();});
}
