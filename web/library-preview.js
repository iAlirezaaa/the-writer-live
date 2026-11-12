/* Optional shelf discovery. No manuscript mutation, generated book records,
 * external image service or eager manuscript downloads. Remove the HTML
 * script/style pair to return to the original shelf behavior. */
import {getJSON,appHref} from './snapshot.js';
import {readerEditorial} from './reader-editorial.js?v=reader-20261112-editorial-v1';
import {applyCoverVisual,createCoverArt} from './book-cover.js?v=reader-20261109-v7';

// These are editorial descriptions of already-public manuscripts, NOT an
// authorization list. Only a currently rendered catalog book can be requested.
// The fingerprint is a revision check, not a security/cryptographic boundary.
const EDITORIAL = Object.freeze({
 "owner-20261110-jaye-doxt": {
  "title": "جای دوخت",
  "status": "owner_shared",
  "fingerprint": "6310:9bc165e9",
  "summary": "کمی پیش از مصاحبهٔ شغلی ناهید، درز کت سرمه‌ای او باز می‌شود. پروین باید میان پنهان‌کردن خطای خیاطی و پذیرفتن مسئولیت آن انتخاب کند؛ روناک راهی پیشنهاد می‌دهد که کت را قابل‌استفاده می‌کند، اما جای تعمیر را پنهان نمی‌کند. داستانی دربارهٔ اعتماد، کار و هزینهٔ درست‌کردن یک اشتباه.",
  "themes": "مسئولیت · اعتماد · انتخاب"
 },
 "0003": {
  "title": "نامی که از پل برگشت",
  "status": "accepted",
  "fingerprint": "6944:e6eab995",
  "summary": "نام آدم‌ها و مکان‌های شهر آرام‌آرام از حافظه و نوشته‌ها پاک می‌شود. مهتاب، کارمند بایگانی، رد نامی محوشده را تا پروندهٔ «شب میدان» و زیرزمینی ممنوع دنبال می‌کند. دفتر به‌جامانده از مادرش او را به رازی نزدیک می‌کند که بازگرداندن نام‌ها را به بهایی شخصی گره می‌زند.",
  "themes": "حافظه · راز · بایگانی"
 },
 "0005": {
  "title": "کوچه‌ی بازگشت",
  "status": "accepted",
  "fingerprint": "6723:d7769e20",
  "summary": "با بریدن کابل دستگاه حافظه‌زدا، مهتاب به صدای ضبط‌شدهٔ مادرش و نشانیِ پل شرقی می‌رسد. برای آزادکردن نام‌های گرفتار، باید قانون نام‌ها و دروازه را بفهمد. در شهری بارانی، جست‌وجوی او میان میل بازگشت به گذشته و بازگذاشتن راهی برای دیگران پیش می‌رود.",
  "themes": "بازگشت · فراموشی · انتخاب"
 }
});
export function bodyFingerprint(body){
 const text=String(body??'').replace(/\r\n/g,'\n');let hash=2166136261;
 for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619)>>>0;
 return `${text.length}:${hash.toString(16)}`;
}
export function previewContent(story){
 const body=typeof story?.body==='string'?story.body:'';
 const entry=EDITORIAL[String(story?.id??'')];
 const verified=Boolean(entry&&entry.title===story.title&&entry.status===story.status&&entry.fingerprint===bodyFingerprint(body));
 const first=body.split(/\n\s*\n/).map(s=>s.trim()).find(s=>s&&!s.startsWith('#'))||'';
 let excerpt=first;
 if(excerpt.length>210){const end=excerpt.lastIndexOf(' ',210);excerpt=excerpt.slice(0,end>100?end:210)+'…';}
 const illustration=verified?readerEditorial(story):null;
 return {summary:verified?entry.summary:'',themes:verified?entry.themes:'',excerpt,verified,image:illustration?.image||'',alt:illustration?.alt||''};
}

export function installLibraryPreview(){
 const shelf=document.getElementById('covers'),actions=document.querySelector('.lib-actions');
 if(!shelf||!actions||document.getElementById('library-preview'))return;
 const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!=null)n.textContent=text;return n;};
 const button=(cls,text,label)=>{const n=node('button',cls,text);n.type='button';if(label)n.setAttribute('aria-label',label);return n;};
 const nfa=n=>new Intl.NumberFormat('fa-IR').format(n);
 const books=()=>[...shelf.querySelectorAll('.shelf-book')].filter(n=>n._story?.id);
 const entry=button('lib-preview-toggle','معرفی کتاب‌ها');entry.id='library-preview-toggle';
 entry.setAttribute('aria-controls','library-preview');entry.setAttribute('aria-expanded','false');entry.disabled=true;actions.prepend(entry);
 const panel=node('aside','library-preview');panel.id='library-preview';panel.hidden=true;panel.dir='rtl';
 panel.setAttribute('aria-labelledby','library-preview-title');panel.setAttribute('role','dialog');
 const header=node('div','preview-head'),label=node('span','preview-eyebrow','از قفسه تا داستان');
 const close=button('preview-close','×','بستن معرفی کتاب');header.append(label,close);
 const spread=node('div','preview-spread'),jacket=node('div','preview-jacket');jacket.setAttribute('aria-hidden','true');
 const art=createCoverArt(),jacketTitle=node('strong','preview-jacket-title'),jacketForm=node('small','preview-jacket-form');jacket.append(art,jacketTitle,jacketForm);
 const info=node('div','preview-info'),title=node('h2','preview-title');title.id='library-preview-title';
 const meta=node('p','preview-meta'),status=node('p','preview-status'),summary=node('p','preview-summary'),themes=node('p','preview-themes');
 info.append(meta,title,status,summary,themes);spread.append(jacket,info);
 const sample=node('details','preview-sample'),sampleLabel=node('summary','preview-eyebrow','خواندن نمونهٔ متن'),quote=node('blockquote','preview-excerpt');sample.append(sampleLabel,quote);
 const scene=node('img','preview-scene');scene.hidden=true;scene.width=480;scene.height=280;scene.loading='lazy';scene.decoding='async';scene.addEventListener('error',()=>{scene.hidden=true;position();});scene.addEventListener('load',position);
 const controls=node('div','preview-controls'),read=button('preview-read','شروع خواندن'),previous=button('preview-nav','→','کتاب قبلی'),next=button('preview-nav','←','کتاب بعدی'),counter=node('span','preview-counter');
 controls.append(read,previous,counter,next);panel.append(header,scene,spread,sample,controls);document.body.append(panel);
 let active=null,last=null,pinned=false,returnTo=null,timer=null,hideTimer=null,token=0,frame=0;
 const cache=new Map();
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function position(){
  if(panel.hidden||!active?.isConnected)return;
  panel.classList.toggle('is-pinned',pinned);
  // Hover is a non-modal preview; the user-pinned sheet is a keyboard dialog.
  if(pinned)panel.setAttribute('aria-modal','true');else panel.removeAttribute('aria-modal');
  const v=window.visualViewport,w=v?.width||innerWidth,h=v?.height||innerHeight;
  const mobile=w<640||matchMedia('(hover:none)').matches;
  panel.classList.toggle('is-sheet',mobile);
  panel.style.maxHeight=Math.max(180,!mobile&&w>=1240?h-352:h-24)+'px';
  const r=active.getBoundingClientRect(),pw=panel.offsetWidth,ph=panel.offsetHeight;
  let x=(w-pw)/2,y=h-ph-12;
  if(!mobile){
   x=r.left>pw+30?r.left-pw-18:r.right+pw+30<w?r.right+18:r.left+r.width/2-pw/2;
   y=r.top>ph+85?r.top-ph-18:Math.max(78,r.top+12);
   const cabinet=shelf.closest('.case').getBoundingClientRect();
   if(w>=1240&&w-cabinet.right>=pw+32){x=cabinet.right+20;y=Math.min(Math.max(352,r.top),h-ph-16);}
  }
  panel.style.left=Math.max(12,Math.min(w-pw-12,x))+'px';
  panel.style.top=Math.max(12,Math.min(h-ph-12,y))+'px';
 }
 function hide(restore=false){
  clearTimeout(timer);clearTimeout(hideTimer);token++;
  const was=returnTo;active?.classList.remove('is-previewed');active=null;pinned=false;panel.hidden=true;
  entry.setAttribute('aria-expanded','false');panel.removeAttribute('aria-modal');document.body.classList.remove('is-previewing');
  if(restore&&was?.isConnected)was.focus({preventScroll:true});
 }
 const scheduleHide=()=>{clearTimeout(hideTimer);if(!pinned)hideTimer=setTimeout(()=>hide(),260);};
 async function contentFor(story){
  const key=JSON.stringify([String(story.id),story.title,story.words,story.created]);
  if(cache.has(key))return cache.get(key);
  const response=await getJSON(`/api/stories/${encodeURIComponent(story.id)}`);
  if(!response||String(response.id)!==String(story.id)||response.title!==story.title||typeof response.body!=='string')throw new Error('Mismatched preview');
  const data=previewContent(response);cache.set(key,data);
  if(cache.size>100)cache.delete(cache.keys().next().value);
  return data;
 }
 async function show(item,{pin=false,focus=false}={}){
  if(!books().includes(item)||document.body.classList.contains('book-open'))return;
  clearTimeout(timer);clearTimeout(hideTimer);
  if(active===item&&!panel.hidden){if(pin){pinned=true;position();}if(focus){returnTo=document.activeElement;close.focus({preventScroll:true});}return;}
  active?.classList.remove('is-previewed');active=item;last=item;pinned=pin;const current=++token;
  if(focus)returnTo=document.activeElement;else if(!pin)returnTo=null;
  item.classList.add('is-previewed');const story=item._story,list=books(),i=list.indexOf(item);
  title.textContent=story.title||'اثر بی‌عنوان';jacketTitle.textContent=title.textContent;jacketForm.textContent=story.stage||'داستان';applyCoverVisual(jacket,story);
  const minutes=Number(story.words)>0?Math.max(1,Math.ceil(Number(story.words)/220)):0;
  meta.textContent=[story.stage||'داستان',minutes?`${nfa(minutes)} دقیقه مطالعه`:''].filter(Boolean).join(' · ');
  status.textContent=story.status==='owner_shared'?'انتشار با اجازهٔ صاحب اثر':story.status==='accepted'?'پذیرفته‌شده برای انتشار':story.status==='rejected'?'پذیرفته‌نشده توسط منتقد':'در حال بررسی';
  status.dataset.kind=story.status||'pending';summary.dataset.verified='false';summary.textContent='در حال دریافت معرفی کتاب…';themes.hidden=true;sample.hidden=true;sample.open=false;scene.hidden=true;scene.removeAttribute('src');
  let progress=0;try{progress=Number(JSON.parse(localStorage.getItem(`the-writer-reading:${story.id}`)||'{}').progress)||0;}catch{}
  read.textContent=progress>0&&progress<1?`ادامهٔ خواندن · ${nfa(Math.round(progress*100))}٪`:'شروع خواندن';
  counter.textContent=`${nfa(i+1)} از ${nfa(list.length)}`;previous.disabled=i<=0;next.disabled=i>=list.length-1;
  panel.hidden=false;entry.setAttribute('aria-expanded','true');document.body.classList.add('is-previewing');position();
  if(focus)close.focus({preventScroll:true});
  if(!reduced())panel.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:180,easing:'ease-out'});
  try{
   const data=await contentFor(story);
   if(current!==token||active!==item||panel.hidden)return;
   summary.textContent=data.summary||(data.excerpt?'خلاصهٔ بازبینی‌شده برای این نسخه هنوز آماده نیست. بخشی از متن اصلی را بخوانید.':'متن معرفی برای این اثر در دسترس نیست.');
   summary.dataset.verified=String(data.verified);themes.textContent=data.themes;themes.hidden=!data.themes;
   quote.textContent=data.excerpt;sample.hidden=!data.excerpt;
   if(data.image){scene.alt=data.alt;scene.src=appHref('web/reader-illustrations/'+data.image);scene.hidden=false;}
   position();
  }catch{
   if(current!==token||active!==item||panel.hidden)return;
   summary.textContent='دریافت معرفی ممکن نشد؛ می‌توانید خود کتاب را باز کنید.';summary.dataset.verified='false';position();
  }
 }
 const queued=item=>{if(pinned||active===item)return;clearTimeout(timer);timer=setTimeout(()=>show(item),140);};
 function step(delta){const list=books(),i=list.indexOf(active);const item=list[i+delta];if(!item)return;item.scrollIntoView({block:'nearest',behavior:'auto'});show(item,{pin:true});}
 entry.addEventListener('click',()=>{if(pinned&&!panel.hidden){hide(true);return;}const list=books();show(list.includes(last)?last:list[0],{pin:true,focus:true});});
 sample.addEventListener('toggle',position);
 close.addEventListener('click',()=>hide(true));previous.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
 read.addEventListener('click',()=>{const source=active?.querySelector('.cover');hide();source?.click();});
 shelf.addEventListener('pointerover',e=>{if(e.pointerType==='touch'||!matchMedia('(hover:hover)').matches)return;const item=e.target.closest('.shelf-book');if(item){clearTimeout(hideTimer);queued(item);}});
 shelf.addEventListener('pointerout',e=>{if(e.relatedTarget?.closest?.('.shelf-book')||panel.contains(e.relatedTarget))return;clearTimeout(timer);scheduleHide();});
 shelf.addEventListener('focusin',e=>{const item=e.target.closest('.shelf-book');if(item){last=item;if(matchMedia('(hover:hover)').matches)queued(item);}});
 shelf.addEventListener('focusout',e=>{if(!panel.contains(e.relatedTarget)&&!shelf.contains(e.relatedTarget))scheduleHide();});
 panel.addEventListener('pointerenter',()=>clearTimeout(hideTimer));panel.addEventListener('pointerleave',scheduleHide);
 panel.addEventListener('focusin',()=>{pinned=true;if(!returnTo)returnTo=active?.querySelector('.cover')||entry;clearTimeout(hideTimer);position();});
 document.addEventListener('keydown',e=>{
  if(e.key==='Tab'&&!panel.hidden&&pinned){
   // A pinned preview is a true keyboard surface. Ignore disabled, hidden,
   // and collapsed controls: never send focus back into the moving bookcase.
   const controls=[...panel.querySelectorAll('button:not(:disabled),summary,[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')]
    .filter(el=>el.getClientRects().length&&!el.closest('[hidden],[inert]'));
   if(!controls.length){e.preventDefault();close.focus({preventScroll:true});return;}
   const first=controls[0],last=controls[controls.length-1],current=controls.indexOf(document.activeElement);
   if(e.shiftKey&&current<=0){e.preventDefault();last.focus({preventScroll:true});}
   else if(!e.shiftKey&&(current<0||current===controls.length-1)){e.preventDefault();first.focus({preventScroll:true});}
   return;
  }
  if(e.key==='Escape'&&!panel.hidden){e.preventDefault();e.stopImmediatePropagation();hide(true);}
  else if((e.key==='i'||e.key==='I')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.target.closest?.('.shelf-book')){e.preventDefault();show(e.target.closest('.shelf-book'),{pin:true,focus:true});}
 },true);
 document.addEventListener('pointerdown',e=>{if(panel.hidden||panel.contains(e.target)||entry.contains(e.target))return;if(pinned||!e.target.closest('.shelf-book'))hide();},true);
 const hint=node('p','library-preview-hint','روی کتاب مکث کنید؛ یا برای دیدن خلاصه و نمونهٔ متن، «معرفی کتاب‌ها» را بزنید.');shelf.closest('.case').after(hint);
 const architecture=installRoomArchitecture(shelf);
 function sync(){
  const list=books();
  if(architecture)architecture.hidden=!list.length||list.some(item=>item.offsetTop>4); entry.disabled=!list.length;hint.hidden=!list.length;
  shelf.closest('.case').classList.toggle('has-catalog-books',Boolean(list.length));
  if(active&&!list.includes(active))hide();
 }
 new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.classList?.contains('shelf-book')||n.classList?.contains('reading-empty')))){cancelAnimationFrame(frame);frame=requestAnimationFrame(sync);}}).observe(shelf,{childList:true});
 new MutationObserver(()=>{if(document.body.classList.contains('book-open')&&!panel.hidden)hide();}).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.addEventListener('resize',position);window.addEventListener('scroll',()=>{if(!pinned)hide();else position();},{passive:true});window.visualViewport?.addEventListener('resize',position);
 document.body.classList.add('has-book-previews');sync();
}
if(typeof document!=='undefined')installLibraryPreview();

/* Reference room details are isolated from catalog records and reading transforms. */
function installRoomArchitecture(shelf){
 const room=document.querySelector('.room-scene');
 if(room&&!room.querySelector('.room-panels')){
  const panels=document.createElement('div');panels.className='room-panels';panels.setAttribute('aria-hidden','true');
  for(let i=0;i<8;i++)panels.append(document.createElement('i'));
  const cornice=document.createElement('div');cornice.className='room-cornice';
  const rug=document.createElement('div');rug.className='room-rug';room.append(panels,cornice,rug);
 }
 const cabinet=shelf.closest('.case');if(!cabinet)return null;
 let detail=cabinet.querySelector('.case-still-life');
 if(!detail){detail=document.createElement('div');detail.className='case-still-life';detail.setAttribute('aria-hidden','true');
  for(const cls of ['room-frame','room-archive']){const n=document.createElement('span');n.className=cls;detail.append(n);}cabinet.append(detail);}
 const note=document.getElementById('reader-note'),footer=document.querySelector('.lib-foot');
 if(note&&footer){const place=()=>{if(note.getAttribute('role')==='alert')cabinet.before(note);else footer.prepend(note);};place();new MutationObserver(place).observe(note,{attributes:true,attributeFilter:['role']});}
 // Resizing can move real books onto the formerly empty row.
 let queued=0;window.addEventListener('resize',()=>{cancelAnimationFrame(queued);queued=requestAnimationFrame(()=>{detail.hidden=![...shelf.querySelectorAll('.shelf-book')].length||[...shelf.querySelectorAll('.shelf-book')].some(n=>n.offsetTop>4);});},{passive:true});
 return detail;
}
