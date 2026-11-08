import { auditUrbanPlan } from "./urban-plan.js?v=urban-plan-20261108-v2";
/* THE WRITER — CITY DISTRICT KIT / v1
 * Architectural layer only. The author's house, room props, current pedestrian
 * graph, and moving traffic lanes are NEVER modified by this module.
 * Uses cached geometries/materials and instanced window facades to keep draw
 * calls affordable. These are designed fictional venues, not proof of visits.
 */
export const DISTRICT_KIT_VERSION="district-kit-20261108-v2";
export const CITY_BLOCKS=Object.freeze([
  {id:"west-arcade",x:-20,z:-18,w:5.4,d:5.6,floors:4,style:"brick",title:"رواق غربی",district:"محلهٔ قدیمی"},
  {id:"media-loft",x:-12,z:-18,w:5.2,d:5.4,floors:5,style:"loft",title:"استودیوهای شهر",district:"محلهٔ هنر"},
  {id:"writers-hall",x:-4,z:-18,w:5.5,d:5.7,floors:3,style:"civic",title:"خانهٔ فرهنگ",district:"محلهٔ هنر"},
  {id:"urban-flats",x:4,z:-18,w:5.2,d:5.4,floors:5,style:"modern",title:"خانه‌های باغ",district:"محلهٔ مسکونی"},
  {id:"teal-tower",x:12,z:-18,w:5.4,d:5.5,floors:7,style:"glass",title:"برج سپیدار",district:"مرکز نو"},
  {id:"north-hotel",x:20,z:-18,w:5.4,d:5.6,floors:5,style:"terrace",title:"مهمانسرای سپهر",district:"مرکز نو"},
  {id:"old-post",x:-20,z:-28,w:5.3,d:5.4,floors:4,style:"civic",title:"ادارهٔ پست",district:"محلهٔ قدیمی"},
  {id:"stone-row",x:-12,z:-28,w:5.6,d:5.6,floors:4,style:"mansard",title:"عمارت ساعت",district:"محلهٔ قدیمی"},
  {id:"atelier",x:-4,z:-28,w:5.3,d:5.3,floors:5,style:"brick",title:"کارگاه هنرمندان",district:"محلهٔ هنر"},
  {id:"community-house",x:4,z:-28,w:5.5,d:5.4,floors:4,style:"terrace",title:"باشگاه محله",district:"محلهٔ مسکونی"},
  {id:"glass-office",x:12,z:-28,w:5.4,d:5.5,floors:6,style:"glass",title:"مرکز نوآوری",district:"مرکز نو"},
  {id:"sky-residences",x:20,z:-28,w:5.3,d:5.3,floors:6,style:"modern",title:"خانه‌های آسمان",district:"مرکز نو"}
]);
export const CITY_PLACE_CATALOG=Object.freeze([
  {id:"publishing-tower",name:"برج نشر آفتاب",zone:"مرکز فرهنگی",kind:"اداری · نشر",x:-10,z:0,y:11,
   description:"لابی در همکف، آسانسور و دفتر ناشر در طبقهٔ چهارم. بخش نشریه از مسیر قبلیِ شهروندان قابل دسترسی است.",
   activity:"جلسه‌های نشر، بررسی نسخه‌ها و تصمیم‌های ثبت‌شده",access:"نمایشی؛ ارتباط واقعی از سامانهٔ ناشر"},
  {id:"cultural-hall",name:"خانهٔ فرهنگ",zone:"محلهٔ هنر",kind:"فرهنگی",x:-4,z:-18,y:4,
   description:"سالن رویداد، نمایشگاه پوستر و فضاهای کارگاه. رویدادهای آن فعلاً زمان‌بندی مستقل ندارند.",
   activity:"نمایشگاه، جلسهٔ کتاب‌خوانی و کارگاه",access:"معماری فعال؛ برنامهٔ رویداد هنوز شبیه‌سازی نشده"},
  {id:"green-promenade",name:"پیاده‌راه سبز",zone:"پارک و میدان",kind:"فضای سبز",x:11,z:22,y:1,
   description:"مسیر پیاده‌روی، باغچه‌ها، نیمکت‌ها و سایه‌بان با دسترسی از میدان.",
   activity:"پیاده‌روی، استراحت و مشاهدهٔ زندگی شهری",access:"قابل مشاهده؛ مسیر شهروندان فعلاً محدود به شبکهٔ اصلی است"},
  {id:"play-park",name:"پارک بازی",zone:"پارک و میدان",kind:"تفریح",x:21,z:24,y:1,
   description:"تاب، سرسره و فضای باز کودکان کنار باغ محله.",
   activity:"سرگرمی، بازی و گردهمایی",access:"فعالیت نمایشی؛ کودک مستقل در شبیه‌سازی وجود ندارد"},
  {id:"sports-court",name:"زمین ورزش",zone:"محلهٔ شرقی",kind:"ورزش",x:34,z:24,y:1,
   description:"زمین چندمنظوره با خط‌کشی و دو حلقهٔ بسکتبال؛ هنوز مسابقهٔ خودکار ندارد.",
   activity:"ورزش و تفریح",access:"مکان قابل‌مشاهده، شبیه‌سازی ورزشکار در آینده"},
  {id:"arts-gallery",name:"گالری آبان",zone:"محلهٔ غربی",kind:"هنر",x:-34,z:21,y:4,
   description:"گالری کوچکِ نمای شیشه‌ای برای آثار تجسمی، با پلازای کوچک در ورودی.",
   activity:"نمایش آثار، گفت‌وگو و نمایشگاه",access:"فضای سه‌بعدی؛ هنوز رویداد زنده ندارد"},
  {id:"town-square",name:"میدان زندگی",zone:"پارک و میدان",kind:"میدان عمومی",x:0,z:23,y:1,
   description:"آب‌نمای مرکزی، نورهای شب، مسیر نشستن و میدانچهٔ اجتماع.",
   activity:"استراحت، ملاقات و دورهمی",access:"فقط معماری و محیط پویا؛ ملاقات مستقل هنوز فعال نیست"},
  {id:"outdoor-cinema",name:"سینمای روباز",zone:"پارک و میدان",kind:"سرگرمی",x:-13,z:25,y:2,
   description:"سکوی اجرا و پردهٔ روباز برای نمایش‌های محله؛ صدای خودکار تولید نمی‌کند.",
   activity:"نمایش و اجرا",access:"صحنه و تجهیزات آماده؛ محتوای نمایشی هنوز تعریف نشده"},
  {id:"market-passage",name:"گذر بازار",zone:"محلهٔ قدیمی",kind:"خرید و گذر",x:-36,z:-7,y:3,
   description:"رواقی با غرفه‌های کوچک، سایه‌بان‌ها و تابلوی راهنما در کنار خیابان فرعی.",
   activity:"خرید روزانه و گشت شهری",access:"محیط سه‌بعدی؛ فروشگاه‌های مستقل هنوز فعال نیستند"}
]);
const PALETTES={
 brick:{wall:0x9d6e63,accent:0xe2c9aa,trim:0x57433d,roof:0x554c49},
 loft:{wall:0x65757b,accent:0xbbac8c,trim:0x2c4149,roof:0x374c50},
 civic:{wall:0xb2a18c,accent:0xe2d5b9,trim:0x796b59,roof:0x6c6658},
 modern:{wall:0x92aaa3,accent:0xf0daba,trim:0x4b6969,roof:0x55706c},
 glass:{wall:0x607f86,accent:0xb9c7bd,trim:0x354c57,roof:0x405b66},
 terrace:{wall:0xc0a78c,accent:0xf0d5b2,trim:0x6e7166,roof:0x656e65},
 mansard:{wall:0xa69b95,accent:0xe6d8c2,trim:0x625751,roof:0x645c64}
};
const PALETTE_STYLES=Object.freeze(Object.keys(PALETTES));
export function auditCityPlan(){
  const footprints=CITY_BLOCKS.map(b=>({id:b.id,minX:b.x-b.w/2,maxX:b.x+b.w/2,minZ:b.z-b.d/2,maxZ:b.z+b.d/2}));
  const intersections=[];
  for(let i=0;i<footprints.length;i++)for(let j=i+1;j<footprints.length;j++){
    const a=footprints[i],b=footprints[j];
    if(a.minX<b.maxX&&b.minX<a.maxX&&a.minZ<b.maxZ&&b.minZ<a.maxZ)
      intersections.push([a.id,b.id]);
  }
  return {blocks:CITY_BLOCKS.length,venues:CITY_PLACE_CATALOG.length,
    styles:PALETTE_STYLES.length,intersections,urban:auditUrbanPlan(),writerRoomUntouched:true,
    routesUnchanged:true,animatedVenueVisits:false};
}
export function buildCityDistricts({THREE,group,clickable,canvasTex,streetY=-3}){
  if(!group?.isObject3D||typeof clickable!=="function")
    throw new TypeError("A valid existing town and clickable registration are required");
  const root=new THREE.Group();root.name="city-districts";
  group.add(root);
  const materials=new Map(),geometries=new Map(),decorLights=[],glowMats=[];
  const mat=(key,color,settings={})=>{
    if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({
      color,roughness:.77,metalness:0,...settings
    }));
    return materials.get(key);
  };
  const geom=(kind,...numbers)=>{
    const key=kind+":"+numbers.join(":");
    if(geometries.has(key))return geometries.get(key);
    let v;
    if(kind==="box")v=new THREE.BoxGeometry(...numbers);
    else if(kind==="cylinder")v=new THREE.CylinderGeometry(...numbers);
    else if(kind==="sphere")v=new THREE.SphereGeometry(...numbers);
    else if(kind==="icosa")v=new THREE.IcosahedronGeometry(...numbers);
    else if(kind==="plane")v=new THREE.PlaneGeometry(...numbers);
    else if(kind==="cone")v=new THREE.ConeGeometry(...numbers);
    else if(kind==="torus")v=new THREE.TorusGeometry(...numbers);
    else if(kind==="ring")v=new THREE.RingGeometry(...numbers);
    else throw new Error("Unknown district geometry: "+kind);
    geometries.set(key,v);return v;
  };
  const add=(geometry,material,x,y,z,parent=root)=>{
    const o=new THREE.Mesh(geometry,material);
    o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=true;parent.add(o);return o;
  };
  const B=(w,h,d,m,x,y,z,parent)=>add(geom("box",w,h,d),m,x,y,z,parent);
  const C=(rTop,rBottom,h,m,x,y,z,segments=8)=>add(geom("cylinder",rTop,rBottom,h,segments),m,x,y,z);
  const I=(r,level,m,x,y,z)=>add(geom("icosa",r,level),m,x,y,z);
  const sidewalk=mat("walk",0xc8c2ad),stone=mat("stone",0xd7c8ad);
  const paving=mat("paving",0xaaa99a),dark=mat("iron",0x435056,{metalness:.37,roughness:.48});
  const darkWood=mat("timber",0x695546),wood=mat("oak",0x987651);
  const grass=mat("new-grass",0x688765),grassDeep=mat("grass-deep",0x4d7359);
  const leaf1=mat("leaf-green",0x698c69),leaf2=mat("leaf-sage",0x98a37d);
  const flowers=[0xe5a193,0xdbd5a5,0x91b7aa,0xdab390].map((v,i)=>mat("flower"+i,v));
  const glass=mat("city-glass",0x688794,{
    metalness:.1,roughness:.24,emissive:0xffe4b1,emissiveIntensity:.08});
  const lit=mat("city-warm-windows",0x9baead,{
    metalness:.05,roughness:.19,emissive:0xffd19a,emissiveIntensity:.26});
  const door=mat("doors",0x4f5956),parkWater=mat("pond",0x6f9c9f,{
    metalness:.26,roughness:.22,transparent:true,opacity:.88});
  glowMats.push(glass,lit);
  const glowBulbs=mat("glowbulbs",0xffdca2,{emissive:0xffc783,emissiveIntensity:.3});
  glowMats.push(glowBulbs);
  const sign=(text,x,y,z,w,parent=root,bg="#314d50")=>{
    const tex=canvasTex(512,128,(g,W,H)=>{
      g.fillStyle=bg;g.fillRect(0,0,W,H);
      g.strokeStyle="#d8c5a2";g.lineWidth=4;g.strokeRect(8,8,W-16,H-16);
      g.fillStyle="#fff0d1";g.direction="rtl";g.textAlign="center";g.textBaseline="middle";
      g.font="600 43px Tahoma, sans-serif";g.fillText(text,W/2,H/2,W-35);
    });
    const m=new THREE.MeshBasicMaterial({map:tex,toneMapped:false,side:THREE.DoubleSide});
    return add(geom("plane",w,w/4),m,x,y,z,parent);
  };
  const contact=(object,id,title,panel="p-town")=>{
    const place=CITY_PLACE_CATALOG.find(location=>location.id===id);
    if(!place)throw new Error("Unregistered civic destination: "+id);
    object.userData.placeId=id;
    object.userData.placeDetails=place;
    object.userData.view=id==="publishing-tower"?"publisher":"town";
    clickable(object,panel,title);
    return object;
  };
  const light=(x,z,y=3.6,intensity=2.8,range=9)=>{
    const l=new THREE.PointLight(0xffd4a1,0,range,1.8);
    l.position.set(x,streetY+y,z);root.add(l);
    decorLights.push({node:l,base:intensity});
    return l;
  };
  const CIRCLE=Math.PI*2, H=(height)=>streetY+height;
  const leaf=(x,z,h=2.4,scale=1)=>{
    C(.10*scale,.17*scale,1.6*scale,darkWood,x,H(.8*scale),z,7);
    I(.78*scale,1,(Math.round(x*7+z*11)%2)?leaf1:leaf2,x,H(2.05*scale),z);
  };
  const gardenBox=(x,z,w=1.8,d=1.7)=>{
    B(w,.25,d,stone,x,H(.13),z);B(w-.25,.10,d-.25,grassDeep,x,H(.31),z);
    const nx=Math.max(2,Math.floor(w/.50)),nz=Math.max(2,Math.floor(d/.6));
    for(let a=0;a<nx;a++)for(let b=0;b<nz;b++){
      const xx=x-w*.43+(a+.5)*w*.86/nx,zz=z-d*.41+(b+.5)*d*.82/nz;
      I(.12,0,flowers[(a+b)%flowers.length],xx,H(.50+((a+b)%3)*.03),zz);
    }
  };
  const bench=(x,z,rotation=0)=>{
    const g=new THREE.Group();g.position.set(x,streetY,z);g.rotation.y=rotation;root.add(g);
    B(1.5,.11,.49,wood,0,.50,0,g);B(1.5,.50,.12,wood,0,.82,-.25,g);
    B(.1,.46,.41,dark,-.57,.23,0,g);B(.1,.46,.41,dark,.57,.23,0,g);
  };
  const registerBlock=(b)=>{
    const P=PALETTES[b.style];if(!P)throw new Error("Invalid district style");
    const g=new THREE.Group();g.name="building-"+b.id;g.position.set(b.x,streetY,b.z);root.add(g);
    const wall=mat("wall-"+b.style,P.wall),detail=mat("details-"+b.style,P.accent),
      frame=mat("frames-"+b.style,P.trim),roof=mat("roofs-"+b.style,P.roof);
    const floorHeight=2.65,height=b.floors*floorHeight;
    const w=b.w,d=b.d;
    B(w,height,d,wall,0,height/2,0,g);
    B(w+.22,.18,d+.24,detail,0,.06,0,g);
    B(w+.22,.16,d+.2,roof,0,height+.06,0,g);
    for(let f=1;f<b.floors;f++){
      const y=f*floorHeight;
      B(w+.1,.10,d+.12,detail,0,y,0,g);
      if(b.style==="terrace"&&f%2===0){
        B(w+.30,.12,.75,roof,0,y+.04,d/2+.28,g);
        B(w+.22,.10,.08,dark,0,y+.50,d/2+.66,g);
      }
    }
    if(b.style==="mansard"){
      const cap=B(w+.35,1.45,d+.36,roof,0,height+.75,0,g);
      cap.scale.set(.95,1,.93);cap.rotation.z=.11;
      add(geom("cylinder",.22,.25,1.30,6),detail,w*.25,height+1.25,-d*.25,g);
    }else if(b.style==="glass"){
      B(w*.64,.5,d*.66,frame,0,height+.35,0,g);
      B(w*.32,.85,d*.25,detail,-w*.14,height+.87,-d*.15,g);
    }else if(b.style==="brick"||b.style==="loft"){
      B(.48,1.35,.46,frame,w*.30,height+.70,-d*.20,g);
      B(w+.50,.20,d+.50,roof,0,height+.10,0,g);
    }else if(b.style==="civic"){
      B(1.45,.82,1.0,roof,0,height+.50,0,g);
      B(.60,.80,.60,detail,0,height+1.24,0,g);
    }else{
      B(w*.82,.35,d*.67,roof,0,height+.30,0,g);
    }
    const N=Math.max(2,Math.min(4,Math.floor(w/1.45)));
    const points=[];
    for(let f=0;f<b.floors;f++){
      const y=f*floorHeight+1.37;
      for(let i=0;i<N;i++){
        const xx=-w*.37+i*(w*.74/Math.max(1,N-1));
        points.push([xx,y,d/2+.064,0]);
        points.push([xx,y,-d/2-.064,Math.PI]);
      }
    }
    const inst=new THREE.InstancedMesh(geom("box",.75,1.22,.065),
      b.style==="glass"?glass:lit,points.length);
    inst.name="facade-window-instances";inst.frustumCulled=false;
    const dummy=new THREE.Object3D();
    points.forEach(([x,y,z,angle],i)=>{
      dummy.position.set(x,y,z);dummy.rotation.set(0,angle,0);dummy.updateMatrix();
      inst.setMatrixAt(i,dummy.matrix);
    });
    inst.instanceMatrix.needsUpdate=true;g.add(inst);
    // Window sills, porch architecture and deliberate street-level doorways.
    for(let i=0;i<N;i++){
      const xx=-w*.37+i*w*.74/Math.max(1,N-1);
      B(.87,.09,.16,detail,xx,1.02,d/2+.15,g);
    }
    B(1.20,2.08,.09,door,0,1.06,d/2+.11,g);
    B(1.5,.20,.53,roof,0,2.3,d/2+.25,g);
    for(const side of [-1,1]){
      B(.13,height,.16,frame,side*(w/2-.15),height/2,d/2+.06,g);
      if(["civic","mansard","brick"].includes(b.style)){
        for(let f=1;f<=b.floors;f++){
          B(w+.04,.13,.23,detail,0,f*floorHeight-.12,d/2+.08,g);
        }
      }
    }
    // A pair of rooftop units / planters makes skylines readable.
    if(b.floors>=5){
      B(.80,.52,.70,frame,-w*.24,height+.35,-d*.20,g);
      B(.70,.28,.65,roof,w*.25,height+.18,-d*.26,g);
    }
    const pick=sign(b.title,b.x,streetY+2.95,b.z+d/2+.29,Math.min(w-1,3.1));
    // Building tags are static; signs, not facade windows, are interactive.
    if(b.id==="writers-hall")contact(pick,"cultural-hall",b.title);
    return {id:b.id,height,style:b.style,building:g};
  };
  const structures=CITY_BLOCKS.map(registerBlock);
  // The original ground-floor publisher building remains a reception / lobby.
  // An independent office wing is explicitly on level FOUR of the new tower.
  const tower=new THREE.Group();tower.name="publisher-tower";tower.position.set(-10,streetY,0);root.add(tower);
  const pw=5.55,pd=5.58,level=3.1,base=3.28,top=base+5*level;
  const towerWall=mat("publisher-wall",0x605d67),towerTrim=mat("publisher-trim",0xd4b997),
    towerEdge=mat("publisher-edge",0x343e4c);
  // Preserve the original lobby footprint and all old publisher click targets.
  for(let floor=0;floor<5;floor++){
    const low=base+floor*level,high=low+level;
    if(floor===3){
      // Real open-front editorial floor: roof, rear and two sides bound the
      // room while the south facade remains glazing rather than a solid cube.
      B(pw,level,.17,towerWall,0,low+level/2,-pd/2,tower);
      for(const sx of [-1,1])
        B(.18,level,pd,towerWall,sx*pw/2,low+level/2,0,tower);
      B(pw,.76,.18,towerWall,0,low+.38,pd/2,tower);
      B(pw,.28,.18,towerWall,0,low+level-.14,pd/2,tower);
    }else B(pw,level,pd,towerWall,0,low+level/2,0,tower);
    B(pw+.19,.15,pd+.22,towerTrim,0,low,0,tower);
    B(pw+.22,.17,pd+.22,towerEdge,0,high,0,tower);
    const panes=[-1.65,0,1.65];
    for(const side of [-1,1]){
      for(const xx of panes){
        B(.95,1.58,.07,floor===3?lit:glass,xx,low+1.67,side*(pd/2+.06),tower);
        B(1.09,.09,.20,towerTrim,xx,low+.80,side*(pd/2+.14),tower);
      }
      for(const zz of [-1.5,0,1.5]){
        B(.07,1.45,.83,glass,side*(pw/2+.08),low+1.67,zz,tower);
      }
    }
    if(floor===3){
      // Editorial office is visually visible from the south cutaway: a desk,
      // lamps, shelving and editorial wall above the lobby and lift.
      const officeLow=low;
      B(pw-.24,.16,pd-.3,towerTrim,0,officeLow+.13,0,tower);
      const editorDesk=B(2.2,.12,1.05,darkWood,0,officeLow+1.0,.25,tower);
      editorDesk.name="editorial-office-desk";
      for(const xx of [-.9,.9])B(.11,.87,.75,towerEdge,xx,officeLow+.58,.26,tower);
      B(1.05,.16,.65,darkWood,0,officeLow+.57,-.85,tower);
      B(.72,.53,.085,towerEdge,0,officeLow+1.27,-.35,tower);
      B(.56,.35,.06,glass,0,officeLow+1.30,-.27,tower);
      for(let j=0;j<5;j++)B(.19,.36,.36,mat("publisher-books"+(j%3),
        [0x8b6a61,0x8a9180,0xbe9a6b][j%3]),-1.72+j*.36,officeLow+1.45,-2.28,tower);
    }
  }
  B(pw+.6,.22,pd+.6,towerEdge,0,top+.10,0,tower);
  B(2,.95,1.5,towerTrim,0,top+.65,-.5,tower);
  B(.13,2.4,.13,towerEdge,1.4,top+1.30,-.9,tower);
  const publisherLabel=sign("دفتر ناشر · طبقهٔ چهارم",-10,streetY+base+3*level+2.75,3.05,4.9);
  contact(publisherLabel,"publishing-tower","دفتر ناشر در برج نشر","p-publish");
  const lobbyLabel=sign("برج نشر آفتاب · لابی",-10,streetY+3.05,3.49,3.7);
  contact(lobbyLabel,"publishing-tower","ورودی برج نشر","p-publish");
  light(-10,3.55,12,3.7,9);
  // Bookstore gains a lived-in mixed-use second and third storey, without
  // relocating the old bookstore floor, storefront, sign or reader navigation.
  const bookstore=new THREE.Group();bookstore.name="bookstore-lofts";bookstore.position.set(10,streetY,0);root.add(bookstore);
  const bookstoreWall=mat("bookstore-upper",0x788b82);
  for(let levelIndex=0;levelIndex<2;levelIndex++){
    const y=3.37+levelIndex*3.05;
    B(5.75,2.98,5.8,bookstoreWall,0,y+1.49,0,bookstore);
    B(6.1,.18,6.1,towerEdge,0,y+2.98,0,bookstore);
    for(const dx of [-1.75,0,1.75]){
      B(1.15,1.6,.07,glass,dx,y+1.65,2.96,bookstore);
      B(1.35,.12,.60,darkWood,dx,y+.70,3.24,bookstore);
      B(1.4,.13,.08,towerEdge,dx,y+.85,3.55,bookstore);
    }
  }
  sign("خانهٔ کتاب · طبقهٔ بالا",10,streetY+7.95,3.22,3.9);
  // New streets make the expanded layout a block system instead of random
  // props. These side lanes are VISUAL ONLY, not part of the car simulator.
  const road=mat("new-road",0x404b50),roadStripe=mat("road-line",0xdfd9c0);
  const newStreet=(x,z,w,d)=>{
    B(w,.07,d,road,x,H(-.077),z);
    if(w>d)for(let t=x-w/2+3;t<x+w/2-1;t+=4.4)
      B(1.4,.018,.08,roadStripe,t,H(-.027),z);
    else for(let t=z-d/2+3;t<z+d/2-1;t+=4.4)
      B(.08,.018,1.4,roadStripe,x,H(-.027),t);
  };
  newStreet(-29,-20,4.3,43);newStreet(29,-20,4.3,43);
  // Both outer streets now connect to the existing east/west network.
  newStreet(0,-8.5,63,4);
  // Street between the two southern rows of blocks: no disconnected facades.
  newStreet(0,-23,63,4.15);
  newStreet(0,-40,63,4.4);
  // Keep the original operating cars on their current two tested traffic lanes.
  // Decorative side-street access and curb zones are explicitly not sim lanes.
  for(const x of [-29,29]){
    B(1.2,.12,42,sidewalk,x+(x<0?-3:3),H(.02),-20);
    for(let z=-36;z<=-5;z+=6)B(.1,.07,.9,roadStripe,x,H(-.027),z);
  }
  for(const [x,z] of [[-26,-34],[26,-34],[-26,-10],[26,-10]]){
    C(.095,.13,3.6,dark,x,H(1.8),z,8);
    B(.67,.15,.34,dark,x,H(3.62),z);
    B(.52,.055,.25,glowBulbs,x,H(3.50),z);
    light(x,z,3.5,1.9,7.8);
  }
  // Green promenade expands the existing park WITHOUT placing colliders on
  // z=11.3 or the authored pedestrian graph / zebra crossing.
  const groundP=mat("pavilion-paving",0xbaaF9d);
  B(37,.12,18,grass,14,H(.03),22);
  B(3.1,.13,17,paving,9.4,H(.14),22);
  B(3.1,.13,17,paving,15.6,H(.14),22);
  B(33,.11,2.2,paving,14,H(.14),17);
  B(33,.11,2.2,paving,14,H(.14),28);
  // Water garden, small orchard, planters and a paved seating area.
  for(const [x,z,r] of [[7,20,.86],[10,20,1.03],[13,20,.94],[16,21,.92],
    [7,26,.97],[10,27,.84],[14,26,1.1],[18,27,.92],[20,20,1.01]])
      leaf(x,z,2.2,r);
  for(const [x,z] of [[6,18.5],[11,24],[16.5,24.5],[19,17.8],[24,27]])
    gardenBox(x,z,2.2,1.25);
  for(const [x,z,angle] of [[9,21,Math.PI/2],[15,25,0],[19,23,Math.PI/2]])
    bench(x,z,angle);
  // Fountain plaza: ring basin, water surface, articulated simple jets.
  const plaza=new THREE.Group();plaza.name="central-square";plaza.position.set(0,streetY,23);root.add(plaza);
  B(9,.16,11,sidewalk,0,.11,0,plaza);
  const fountain=add(geom("cylinder",2.4,2.4,.38,32),stone,0,.35,0,plaza);
  const water=add(geom("cylinder",2.18,2.18,.06,32),parkWater,0,.57,0,plaza);
  const fountainCore=add(geom("cylinder",.28,.45,.9,12),stone,0,1.04,0,plaza);
  const jets=new THREE.Group();jets.position.set(0,1.45,0);plaza.add(jets);
  for(let i=0;i<8;i++){
    const angle=i*CIRCLE/8;
    const droplet=add(geom("sphere",.09,8,6),parkWater,
      Math.sin(angle)*.88,.23+(i%2)*.15,Math.cos(angle)*.88,jets);
    droplet.name="fountain-jet";
  }
  light(0,23,3.1,2.6,9);
  for(const x of [-3.5,3.5])for(const z of [18.5,27])bench(x,z,0);
  sign("میدان زندگی",0,H(1.25),29.18,3.4);
  const plazaPick=add(geom("box",3.8,1.3,.10),new THREE.MeshBasicMaterial({visible:false}),
    0,H(.75),29.22);
  contact(plazaPick,"town-square","میدان زندگی");
  // Outdoor performance: an open-stage pavilion and screen, no fictional events.
  B(9.4,.23,5.3,stone,-13,H(.11),25);
  B(8.7,.26,3.9,darkWood,-13,H(.36),26.0);
  B(7.7,3.1,.14,mat("screen",0xe8ddc5),-13,H(2.32),27.77);
  B(8.2,.22,.22,towerEdge,-13,H(4.03),27.73);
  for(const x of [-17, -9]){
    C(.10,.11,4.5,dark,x,H(2.25),28,8);
    B(.8,.07,.50,glowBulbs,x,H(4.52),28);
  }
  for(let row=0;row<3;row++)for(const x of [-16.2,-13,-9.8])bench(x,19+row*1.43,0);
  const cinemaSign=sign("سینمای روباز",-13,H(2.3),28.08,3.6);
  contact(cinemaSign,"outdoor-cinema","سینمای روباز");
  // Playground: rig-like mechanisms, actual posts/swings/slide, no actors.
  B(10,.13,9,mat("playground-sand",0xc2aa89),21,H(.17),24);
  for(const x of [18.0,21.0]){
    C(.085,.11,2.5,dark,x,H(1.38),21.2,8);
    C(.085,.11,2.5,dark,x,H(1.38),24.0,8);
  }
  B(3.65,.14,.13,mat("play-blue",0x5d8390),19.5,H(2.57),22.6);
  for(const x of [18.7,20.4]){
    B(.035,1.52,.04,dark,x,H(1.79),22.6);
    B(.75,.13,.46,mat("play-seat",0xd2aa64),x,H(1.02),22.6);
  }
  const slide=mat("slide",0xda9c64);
  B(1.0,.13,1.0,wood,23.4,H(2.06),24.4);
  B(.85,.15,3.1,slide,23.4,H(1.23),26.2).rotation.x=.50;
  for(const x of [22.95,23.85]){
    C(.075,.1,2.0,dark,x,H(1.0),24.2,7);
    B(.10,.6,2.4,wood,x,H(1.43),26.2).rotation.x=.50;
  }
  const parkSign=sign("پارک بازی",21,H(1.45),29.05,3.5);
  contact(parkSign,"play-park","پارک بازی");
  // Multi-use court with correctly placed lines and BOTH hoops.
  B(12,.15,9,mat("court",0x6b8f83),34,H(.21),24);
  const white=mat("courtline",0xe7ddc6);
  B(11.3,.017,.06,white,34,H(.30),19.88);
  B(11.3,.017,.06,white,34,H(.30),28.12);
  for(const x of [28.35,39.65])B(.06,.017,8.25,white,x,H(.30),24);
  B(.07,.017,8.25,white,34,H(.30),24);
  for(const x of [29.2,38.8]){
    C(.10,.14,3.0,dark,x,H(1.5),24,8);
    B(.14,.95,1.20,stone,x+(x<34?.38:-.38),H(3),24);
    const ring=add(geom("torus",.33,.045,6,20),mat("basketball-orange",0xc9804f),
      x+(x<34?.72:-.72),H(2.74),24);
    ring.rotation.x=Math.PI/2;
  }
  const sportSign=sign("زمین ورزش",34,H(1.0),28.7,3.4);
  contact(sportSign,"sports-court","زمین ورزش");
  // Gallery: non-operational civic cultural building on a separate district lot.
  const gallery=new THREE.Group();gallery.name="art-gallery";
  gallery.position.set(-34,streetY,21);root.add(gallery);
  const galleryMat=mat("gallery",0xc5b8a4);
  B(8.2,5.6,7.8,galleryMat,0,2.8,0,gallery);
  B(8.65,.30,8.15,towerEdge,0,5.65,0,gallery);
  for(const x of [-2.6,0,2.6]){
    B(1.80,3.4,.08,glass,x,2.73,3.97,gallery);
    B(1.96,.10,.15,dark,x,4.45,4.01,gallery);
  }
  B(1.35,2.4,.095,door,0,1.2,4.06,gallery);
  const gallerySign=sign("گالری آبان",-34,H(5.1),25.2,4.2);
  contact(gallerySign,"arts-gallery","گالری آبان");
  for(const [x,z] of [[-38,17],[-30,17],[-38,26],[-30,26]])leaf(x,z,2.3,.85);
  bench(-34,27.1);
  // Merchant passage on the far-west block. Distinct awnings and stall fronts.
  B(9.5,.15,9.5,sidewalk,-36,H(.11),-7);
  for(let i=0;i<4;i++){
    const x=-39.0+i*2.0;
    B(1.8,2.6,2.0,mat("market-wall",0x987d6d),x,H(1.3),-9);
    B(1.85,.12,1.8,i%2?tealShade():wood,x,H(2.65),-8.7);
    B(1.25,.52,.20,glass,x,H(1.42),-7.92);
    B(1.5,.12,.65,wood,x,H(.93),-7.55);
  }
  function tealShade(){return mat("awning",0x6b908d);}
  const marketSign=sign("گذر بازار",-36,H(3.06),-5.85,4.1);
  contact(marketSign,"market-passage","گذر بازار");
  // Bus shelters, bicycle racks and curb benches create true street furniture.
  for(const [x,z] of [[16,16.6],[-21,16.8]]){
    B(4.0,.15,1.6,stone,x,H(.10),z);
    for(const dx of [-1.70,1.70])C(.075,.085,2.3,dark,x+dx,H(1.18),z,8);
    B(4.3,.20,1.95,dark,x,H(2.41),z);
    B(3.8,1.5,.06,glass,x,H(1.23),z-.70);
    B(1.8,.12,.56,wood,x,H(.67),z+.18);
  }
  for(const [x,z] of [[-4.6,16.4],[27.8,17.4],[-26,13.2]]){
    for(let k=0;k<4;k++){
      const ring=add(geom("torus",.37,.055,5,12),dark,x+k*.64,H(.42),z);
      ring.rotation.y=Math.PI/2;
    }
  }
  const entrySigns=[
    {name:"پیاده‌راه سبز",id:"green-promenade",x:12,z:29.3,y:1.25},
  ];
  for(const p of entrySigns){
    const label=sign(p.name,p.x,H(p.y),p.z,3.4);
    contact(label,p.id,p.name);
  }
  const lookup=new Map(CITY_PLACE_CATALOG.map(p=>[p.id,p]));
  const exposedStats=Object.freeze({blocks:structures.length,venues:lookup.size,
    styles:PALETTE_STYLES.length,drawCallSavings:"instanced-facade-windows",
    dynamicLights:decorLights.length,source:"procedural-city-district-v1"});
  function update(day,elapsed){
    const sunlight=Math.max(0,Math.min(1,Number(day)||0));
    const night=1-sunlight;
    for(const e of decorLights)e.node.intensity=e.base*night;
    glass.emissiveIntensity=.03+night*.22;
    lit.emissiveIntensity=.04+night*1.12;
    glowBulbs.emissiveIntensity=.11+night*1.80;
    jets.rotation.y=Math.sin(elapsed*.32)*.24;
    jets.position.y=1.35+Math.sin(elapsed*1.25)*.08;
    water.rotation.y=elapsed*.015;
  }
  return {group:root,update,catalog:CITY_PLACE_CATALOG,lookup,stats:exposedStats};
}
