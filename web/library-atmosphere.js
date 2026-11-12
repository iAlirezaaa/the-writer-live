/* Presentation only. Real catalog buttons, keys and listeners stay intact. */
import {createCoverArt,applyCoverVisual,registerCoverScene} from './book-cover.js?v=reader-20261109-v7';
import {getJSON,appHref} from './snapshot.js';
import {previewContent} from './library-preview.js?v=aisles-20261112-v1';
export function installLibraryAtmosphere(){
 const shelf=document.getElementById('covers');
 if(!shelf||!document.body.classList.contains('reading-room')||shelf.dataset.atmosphereMounted)return;
 shelf.dataset.atmosphereMounted='true';
 const entry=document.getElementById('library-preview-toggle');
 const collection=document.querySelector('.room-collection-line');
 if(entry&&collection)collection.append(entry);
 const requested=new Set(),pending=[];
 function applyScenes(){
  if(!pending.length||document.body.classList.contains('book-open'))return;
  for(const {story,image} of pending.splice(0))registerCoverScene(story,image);
  for(const item of shelf.querySelectorAll('.shelf-book')){const cover=item.querySelector(':scope > .cover');if(cover&&item._story)applyCoverVisual(cover,item._story);}
 }
 function requestScene(story){
  const key=JSON.stringify([story.id,story.title,story.status]);if(requested.has(key))return;requested.add(key);
  getJSON(`/api/stories/${encodeURIComponent(story.id)}`).then(full=>{
   if(String(full?.id)!==String(story.id)||full?.title!==story.title||full?.status!==story.status)return;
   const art=previewContent(full);if(!art.verified||!art.image||!/^[A-Za-z0-9_-]+\.svg$/.test(art.image))return;
   pending.push({story:full,image:appHref('web/reader-illustrations/'+art.image)});applyScenes();
  }).catch(()=>{requested.delete(key);});
 }
 window.addEventListener('writer:reading-closed',applyScenes);
 const prepare=()=>{
  const books=[...shelf.querySelectorAll('.shelf-book')];
  const gallery=books.length>0&&books.length<=4;
  shelf.dataset.presentation=gallery?'gallery':'spines';
  for(const item of books){
   if(gallery&&item._story)requestScene(item._story);
   if(!gallery||item.classList.contains('is-face'))continue;
   const cover=item.querySelector(':scope > .cover'),story=item._story;
   if(!cover||!story)continue;
   const title=document.createElement('span');title.className='c-title';title.textContent=story.title||'اثر بی‌عنوان';
   const form=document.createElement('span');form.className='cover-subject';form.textContent=story.stage||'داستان';
   const ribbon=cover.querySelector('.book-progress-ribbon');
   cover.replaceChildren(createCoverArt(),title,form);
   if(ribbon)cover.append(ribbon);
   item.classList.add('is-face');
  }
  applyScenes();
 };
 // Prepare face-out dimensions before the existing measured packing handler.
 shelf.addEventListener('writer:shelf-layout',prepare,{capture:true});
 prepare();
}
if(typeof document!=='undefined')installLibraryAtmosphere();
