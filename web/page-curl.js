/* A page that bends. The leaf is a chain of narrow strips, each hinged to the one before, so a turning sheet
 * curves like paper instead of swinging like a door. Text stays live DOM, sharp at any size.
 *
 * Geometry is the same for every turn: the leaf lies on the left of its hinge at angle 0 and on the right at 180.
 * A forward turn in a Persian book runs 0 -> 180, a backward turn 180 -> 0.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* Each strip's absolute angle. `curl` is how far the free edge leads the spine side, in degrees, at mid-turn. */
export function bendAngles(theta,curl,n){
 const lift=Math.sin(clamp(theta,0,180)*Math.PI/180),out=[];
 for(let i=0;i<n;i++){const u=n>1?i/(n-1):0;out.push(clamp(theta+curl*lift*(u-.5),0,180));}
 return out;
}

/* Where a pointer at `u` (1 = free edge flat on the left, -1 = flat on the right) puts the page. */
export function angleFromPointer(u){return Math.acos(clamp(u,-1,1))*180/Math.PI;}

/* A turn completes if it is past the point of no return, or was thrown hard enough. */
export function shouldCommit(theta,velocity,forward){
 const progress=forward?theta/180:1-theta/180,speed=forward?velocity:-velocity;
 if(speed>260)return true;
 if(speed<-260)return false;
 return progress>.42;
}

/* Freeze the already-shaped lines once, not once per curved strip. Persian
 * justification is expensive; rewrapping 28 full page clones stalls a turn.
 * Only plain justified paragraphs are optimized. Rich notes, digits that need
 * presentation conversion and unsupported geometry keep their original DOM.
 * This affects inert animation copies only, never the real reading pages. */
function prepareSurfaces(host, pages, width, height) {
 if(!pages.some(page=>page.querySelector('.page-content.body > p,.page-content.report > p')))return pages;
 const staging=document.createElement('div');
 Object.assign(staging.style,{position:'absolute',left:'0',top:'0',width:width+'px',height:height+'px',visibility:'hidden',pointerEvents:'none'});
 const copies=pages.map(page=>{const side=document.createElement('div');side.className='leaf-side';const copy=page.cloneNode(true);Object.assign(copy.style,{width:width+'px',height:height+'px',left:'0',top:'0',bottom:'auto'});side.append(copy);staging.append(side);return copy;});
 host.append(staging);
 try {
  const plans=[];
  // Read all geometry first. No DOM writes in the word/range measurement loop.
  for(const page of copies)for(const p of page.querySelectorAll('.page-content.body > p,.page-content.report > p')){
   if(p.childNodes.length!==1||p.firstChild.nodeType!==3||/[0-9\t\n]/.test(p.textContent))continue;
   const style=getComputedStyle(p);if(style.textAlign!=='justify')continue;
   const box=p.getBoundingClientRect(),text=p.textContent,words=[...text.matchAll(/\S+/gu)],lines=[];
   if(!box.width||!box.height||!words.length)continue;
   const range=document.createRange();let valid=true;
   for(const word of words){range.setStart(p.firstChild,word.index);range.setEnd(p.firstChild,word.index+word[0].length);const rects=[...range.getClientRects()];
    if(rects.length!==1){valid=false;break;}const r=rects[0];let line=lines.at(-1);
    if(!line||Math.abs(r.top-line.top)>1){line={start:word.index,end:0,left:r.left,right:r.right,top:r.top,height:r.height};lines.push(line);}
    line.end=word.index+word[0].length;line.left=Math.min(line.left,r.left);line.right=Math.max(line.right,r.right);
   }
   if(!valid)continue;
   plans.push({p,box,text,lines,lineHeight:style.lineHeight,direction:style.direction});
  }
  const measures=[];
  for(const plan of plans){const {p,box,text,lines,lineHeight,direction}=plan,fragment=document.createDocumentFragment();
   for(const line of lines){const span=document.createElement('span');span.textContent=text.slice(line.start,line.end);Object.assign(span.style,{position:'absolute',display:'block',whiteSpace:'pre',width:'max-content',maxWidth:'none',margin:'0',padding:'0',textIndent:'0',textAlign:'start',wordSpacing:'0px',lineHeight,direction,top:(line.top-box.top)+'px'});
    if(direction==='rtl')span.style.right=(box.right-line.right)+'px';else span.style.left=(line.left-box.left)+'px';
    fragment.append(span,document.createTextNode(' '));measures.push({span,line,box,spaces:(span.textContent.match(/ /g)||[]).length});
   }
   p.dataset.curlLines=String(lines.length);
   Object.assign(p.style,{position:'relative',height:box.height+'px',minHeight:'0',textIndent:'0',textAlign:'start'});p.replaceChildren(fragment);
  }
  // One un-justified layout gives natural widths and exact baseline offsets.
  const adjustments=measures.map(m=>{const range=document.createRange();range.selectNodeContents(m.span);const r=range.getBoundingClientRect();return {...m,delta:m.line.right-m.line.left-r.width,dy:m.line.top-r.top};});
  for(const m of adjustments){m.span.style.top=(m.line.top-m.box.top+m.dy)+'px';if(m.spaces)m.span.style.wordSpacing=(m.delta/m.spaces)+'px';}
  for(const copy of copies){copy.setAttribute('aria-hidden','true');copy.inert=true;}
  return copies;
 } catch {return pages;} finally {staging.remove();}
}

export function createLeaf({host,left,top,width,height,front,back,strips=12}){
 const leaf=document.createElement('div');leaf.className='leaf-curl';
 leaf.setAttribute('aria-hidden','true');leaf.inert=true;
 Object.assign(leaf.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px'});
 const [frontSurface,backSurface]=prepareSurfaces(host,[front,back],width,height);
 const sw=width/strips,overlap=1,parts=[];
 let parent=leaf;
 for(let k=0;k<strips;k++){
  const strip=document.createElement('div');strip.className='leaf-strip';
  strip.style.width=(sw+(k<strips-1?overlap:0))+'px';
  strip.style.right=k?sw+'px':'0';
  const face=(node,offset,cls)=>{
   const f=document.createElement('div');f.className='leaf-side '+cls;
   const clip=node.cloneNode(true);clip.style.width=width+'px';clip.style.left=-offset+'px';
   const shade=document.createElement('div');shade.className='leaf-shade';
   f.append(clip,shade);strip.append(f);return shade;
  };
  // Front lies left of the hinge; its slice counts in from the right edge. Back lies right; it counts from the left.
  const frontShade=face(frontSurface,width-(k+1)*sw-(k<strips-1?overlap:0),'leaf-front');
  const backShade=face(backSurface,k*sw,'leaf-back');
  parent.append(strip);parent=strip;
  parts.push({strip,frontShade,backShade});
 }
 host.append(leaf);
 let lastTheta=null,lastCurl=null,lastTilt=null;
 function set(theta,curl=0,tilt=0){
  if(theta===lastTheta&&curl===lastCurl&&tilt===lastTilt)return;
  lastTheta=theta;lastCurl=curl;lastTilt=tilt;
  const angles=bendAngles(theta,curl,strips);
  leaf.style.transform=`rotateZ(${(tilt*Math.sin(theta*Math.PI/180)).toFixed(3)}deg)`;
  let previous=0;
  angles.forEach((a,k)=>{
   const p=parts[k];
   p.strip.style.transform=`rotateY(${(a-previous).toFixed(3)}deg)`;previous=a;
   // Light from above the reader's left shoulder: the rising face dims, the falling face catches a little.
   const s=Math.sin(a*Math.PI/180);
   p.frontShade.style.opacity=(s*s*.46).toFixed(3);
   p.backShade.style.opacity=(s*.3).toFixed(3);
  });
 }
 return {element:leaf,set,destroy(){leaf.remove();}};
}
