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

export function createLeaf({host,left,top,width,height,front,back,strips=12}){
 const leaf=document.createElement('div');leaf.className='leaf-curl';
 Object.assign(leaf.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px'});
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
  const frontShade=face(front,width-(k+1)*sw-(k<strips-1?overlap:0),'leaf-front');
  const backShade=face(back,k*sw,'leaf-back');
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
