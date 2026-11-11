/* The moment between shelf and page. The chosen book leaves its place, turns to show its cover, opens,
 * and the open book is drawn at exactly the size and position of the reading page, so the change is only a dissolve.
 */
import {applyCoverVisual,createCoverArt} from './book-cover.js?v=reader-20261109-v7';

const make=(cls,parent)=>{const n=document.createElement('div');n.className=cls;parent?.append(n);return n;};
const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const finish=a=>a.finished.catch(()=>{});

/* Transforms for each pose. Exported for tests: the last pose must place the book exactly on the reading page. */
export function stagePoses({spine,page,single,view,depth}){
 const W=page.w,H=page.h;
 // At -90 degrees the spine faces the reader; the root's centre sits half a book behind it.
 const s=spine.h/H,cx=W/2,cy=H/2;
 const spineX=spine.x+spine.w/2-cx,spineY=spine.y+spine.h/2-cy;
 const centreX=view.w/2-cx,centreY=view.h/2-cy;
 const show=Math.min(.94,(view.h*.78)/H);
 const f=(x,y,z,ry,sc,rx=0)=>`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc.toFixed(4)})`;
 return {
  scale:s,
  shelf:f(spineX,spineY,-s*W/2,-90,s),
  pulled:f(spineX,spineY-8,-s*W/2+Math.min(240,view.w*.18),-90,s),
  shown:f(centreX,centreY,0,-8,show,4),
  held:f(centreX,centreY,0,0,show),
  open:f(page.x,page.y,-depth/2,0,1),
  single,
 };
}

function buildBook(story,{w,h,depth},snapshot){
 const root=make('b3d');root.style.width=w+'px';root.style.height=h+'px';root.style.setProperty('--d',depth+'px');
 applyCoverVisual(root,story);
 make('b3d-back',root);
 const inner=make('b3d-inner',root);
 if(snapshot.left)inner.append(snapshot.left);
 make('b3d-fore',root);make('b3d-head',root);make('b3d-tail',root);
 const spine=make('b3d-spine',root);
 const label=document.createElement('span');label.textContent=story.title||'';spine.append(label);
 const cover=make('b3d-cover',root);
 const front=make('b3d-front',cover);
 const art=createCoverArt();
 const title=document.createElement('strong');title.textContent=story.title||'اثر بی‌عنوان';
 const sub=document.createElement('small');sub.textContent=story.stage||'داستان';
 front.append(art,title,sub);
 const inside=make('b3d-inside',cover);
 if(snapshot.right)inside.append(snapshot.right);
 return {root,cover,inner,inside};
}

function place(overlay,story,geometry,snapshot){
 const stage=make('stage');
 const dim=make('stage-dim',stage);dim.style.background=geometry.background;
 const view=make('stage-view',stage);
 const parts=buildBook(story,geometry,snapshot);
 view.append(parts.root);
 overlay.append(stage);
 return {stage,dim,...parts};
}

/* Opens `source` (a spine on the shelf) into the reading page. `ready` resolves once the reader has laid out its pages. */
export async function playOpen({overlay,source,story,measure,ready,snapshot,reveal}){
 const m=measure(),spine=source.getBoundingClientRect();
 const view={w:innerWidth,h:innerHeight};
 const page={x:m.x,y:m.y,w:m.single?m.w:m.w/2,h:m.h};
 if(reduced()){await ready;reveal();return;}
 // A book's thickness on the shelf, scaled up with the book.
 const scaleUp=page.h/Math.max(1,spine.height),depth=Math.max(26,Math.min(96,spine.width*scaleUp));
 const poses=stagePoses({spine:{x:spine.left,y:spine.top,w:spine.width,h:spine.height},page,single:m.single,view,depth});
 const background=m.background;
 overlay.style.background='transparent';
 const s=place(overlay,story,{w:page.w,h:page.h,depth,background},{left:null,right:null});
 source.style.visibility='hidden';
 s.root.style.transform=poses.shelf;
 const fast=()=>{for(const a of s.stage.getAnimations({subtree:true}))a.playbackRate=2.6;};
 s.stage.addEventListener('pointerdown',fast,{once:true});
 s.dim.animate([{opacity:0},{opacity:1}],{duration:1500,easing:'ease-in',fill:'forwards'});
 await finish(s.root.animate([{transform:poses.shelf},{transform:poses.pulled}],{duration:420,easing:'cubic-bezier(.3,.05,.2,1)',fill:'forwards'}));
 await finish(s.root.animate([{transform:poses.pulled},{transform:poses.shown,offset:.86},{transform:poses.held}],{duration:760,easing:'cubic-bezier(.45,.02,.2,1)',fill:'forwards'}));
 // Text goes on the inner pages only now, when the reader knows what it is.
 await ready;
 const pages=snapshot();
 if(pages.left)s.inner.append(pages.left);
 if(pages.right)s.inside.append(pages.right);
 const opening=s.cover.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(180deg)'}],{duration:880,easing:'cubic-bezier(.5,.03,.22,1)',fill:'forwards',delay:60});
 const moving=s.root.animate([{transform:poses.held},{transform:poses.open}],{duration:940,easing:'cubic-bezier(.45,.02,.2,1)',fill:'forwards'});
 await Promise.all([finish(opening),finish(moving)]);
 // The open book now sits on the real page. Dissolve the stage into it.
 // The room behind the book is now the reader's own background, so nothing of the shelf shows through.
 overlay.style.background='';
 reveal();
 await finish(s.stage.animate([{opacity:1},{opacity:0}],{duration:520,easing:'ease',fill:'forwards'}));
 s.stage.remove();
 source.style.visibility='';
}

/* The same journey backwards: the page closes and the book goes back into its gap. */
export async function playClose({overlay,source,story,geometry,pages,hideReader}){
 if(reduced()||!source){hideReader();return;}
 source.scrollIntoView?.({block:'nearest'});
 const spine=source.getBoundingClientRect(),view={w:innerWidth,h:innerHeight};
 const page={x:geometry.x,y:geometry.y,w:geometry.single?geometry.w:geometry.w/2,h:geometry.h};
 const scaleUp=page.h/Math.max(1,spine.height),depth=Math.max(26,Math.min(96,spine.width*scaleUp));
 const poses=stagePoses({spine:{x:spine.left,y:spine.top,w:spine.width,h:spine.height},page,single:geometry.single,view,depth});
 overlay.classList.add('book-leaving');overlay.style.background='transparent';
 const s=place(overlay,story,{w:page.w,h:page.h,depth,background:geometry.background},pages);
 source.style.visibility='hidden';
 s.root.style.transform=poses.open;s.cover.style.transform='rotateY(180deg)';
 s.dim.animate([{opacity:1},{opacity:0}],{duration:1300,easing:'ease-out',fill:'forwards',delay:200});
 const closing=s.cover.animate([{transform:'rotateY(180deg)'},{transform:'rotateY(0deg)'}],{duration:640,easing:'cubic-bezier(.5,.03,.22,1)',fill:'forwards'});
 await Promise.all([finish(closing),finish(s.root.animate([{transform:poses.open},{transform:poses.held}],{duration:640,easing:'cubic-bezier(.45,.02,.2,1)',fill:'forwards'}))]);
 await finish(s.root.animate([{transform:poses.held},{transform:poses.pulled}],{duration:560,easing:'cubic-bezier(.45,.02,.2,1)',fill:'forwards'}));
 await finish(s.root.animate([{transform:poses.pulled},{transform:poses.shelf}],{duration:340,easing:'cubic-bezier(.3,.05,.2,1)',fill:'forwards'}));
 source.style.visibility='';
 s.stage.remove();overlay.style.background='';overlay.classList.remove('book-leaving');
 hideReader();
}
