/* Vehicle-only visual layer for the town on the public landing page.
 * Local +X always means forward. All meshes and wheel pivots belong to one car.
 * No network, storage, town-citizen or writer-state effects.
 */
export function buildTownCars({ THREE, city, streetY }) {
  const fleet = new THREE.Group();
  fleet.name = "town-vehicles";
  city.add(fleet);

  const paintColours = [0x8dada4,0xc58370,0x7699ae,0xd7ad68,0xa2ab86,0x967d8b];
  const material = (color,extra={})=>new THREE.MeshStandardMaterial({
    color,metalness:.12,roughness:.65,...extra
  });
  const paints=paintColours.map(hex=>material(hex,{metalness:.23,roughness:.43}));
  const trim=material(0x354a51),rubber=material(0x293036,{roughness:.96});
  const glass=material(0x8fbbc2,{metalness:.10,roughness:.24});
  const frame=material(0x2e4551,{metalness:.25});
  const chrome=material(0xb7c7c5,{metalness:.65,roughness:.29});
  const headLight=material(0xfff3ce,{emissive:0xffe5b4,emissiveIntensity:.3});
  const headGlow=new THREE.MeshBasicMaterial({color:0xfff1ce});
  const beamMaterial=new THREE.MeshBasicMaterial({color:0xffe8ac,transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide});
  const tailLight=material(0xc35b53,{emissive:0xa12620,emissiveIntensity:.25});
  const indicator=material(0xffb34e,{emissive:0xff8b16,emissiveIntensity:1.5});
  const brake=material(0xe0524d,{emissive:0xff1711,emissiveIntensity:.2});
  const plate=material(0xe2ded2,{roughness:.8});
  const deliveryStripe=material(0xf2d6a1,{roughness:.75});

  const boxGeo=new THREE.BoxGeometry(1,1,1);
  const wheelGeo=new THREE.CylinderGeometry(1,1,1,14);
  const hubGeo=new THREE.CylinderGeometry(1,1,1,12);
  const addBox=(p,m,w,h,d,x,y,z)=>{
    const mesh=new THREE.Mesh(boxGeo,m);
    mesh.position.set(x,y,z);mesh.scale.set(w,h,d);
    p.add(mesh);return mesh;
  };
  const profiles=[
    {kind:"compact",len:2.20,w:1.01,r:.29,cabin:.52,center:-.09,height:1.29,pace:1.46},
    {kind:"sedan",len:2.81,w:1.08,r:.32,cabin:.51,center:-.09,height:1.37,pace:1.62},
    {kind:"taxi",len:2.64,w:1.06,r:.31,cabin:.49,center:-.06,height:1.39,pace:1.38},
    {kind:"van",len:2.97,w:1.10,r:.32,cabin:.39,center:.24,height:1.86,pace:1.23},
    {kind:"hatchback",len:2.35,w:1.04,r:.30,cabin:.59,center:-.04,height:1.49,pace:1.50},
    {kind:"pickup",len:3.01,w:1.10,r:.33,cabin:.38,center:.25,height:1.44,pace:1.29}
  ];
  const wheelsGeometry=(radius,hub=false)=>{
    const g=hub?hubGeo:wheelGeo;
    return {geo:g,sx:hub?radius*.55:radius,sy:hub?.065:.09,sz:hub?radius*.55:radius};
  };
  function makeVehicle(i,profile) {
    const root=new THREE.Group();fleet.add(root);
    root.name="town-car-"+i+"-"+profile.kind;
    root.userData.vehicleType=profile.kind;
    const color=paints[i%paints.length];
    const L=profile.len,W=profile.w,R=profile.r;
    const cabL=L*profile.cabin,cabX=L*profile.center;
    const roof=profile.height;
    // Wheel base and chassis share the same origin, to avoid detached parts.
    addBox(root,trim,L*.95,.14,W*.88,0,.36,0);
    addBox(root,color,L,.41,W,0,.55,0);
    addBox(root,color,L*.45,.09,W*.96,L*.15,.81,0);
    // A distinct silhouette for each vehicle; no floating cabin.
    if(profile.kind==="van"){
      addBox(root,color,L*.58,.97,W*.94,-L*.20,1.15,0);
      addBox(root,color,L*.58,.10,W*.96,-L*.20,1.65,0);
      addBox(root,trim,.045,.66,W*.84,-L*.49,1.17,0);
      addBox(root,chrome,.025,.55,.018,-L*.495,1.17,0);
      for(const side of [-1,1]){
        addBox(root,deliveryStripe,L*.46,.11,.018,-L*.19,.95,side*W*.48);
      }
    }else if(profile.kind==="pickup"){
      addBox(root,trim,L*.42,.10,W*.93,-L*.28,.80,0);
      addBox(root,color,L*.42,.30,.065,-L*.28,.94,-W*.46);
      addBox(root,color,L*.42,.30,.065,-L*.28,.94,W*.46);
      addBox(root,color,.085,.32,W*.94,-L*.49,.94,0);
    }
    const cabBase=profile.kind==="van"? .94:.79;
    const cabHeight=roof-cabBase;
    addBox(root,color,cabL,cabHeight,W*.84,cabX,cabBase+cabHeight/2,0);
    addBox(root,color,cabL*.95,.07,W*.88,cabX,roof+.02,0);
    // Windows and door frames are local to their parent car, not town scene.
    addBox(root,glass,.028,Math.max(.21,cabHeight*.70),W*.68,
      cabX+cabL*.49,cabBase+cabHeight*.5,0);
    addBox(root,glass,.028,Math.max(.21,cabHeight*.70),W*.68,
      cabX-cabL*.49,cabBase+cabHeight*.5,0);
    for(const side of [-1,1]){
      addBox(root,glass,cabL*.82,cabHeight*.62,.035,
        cabX,cabBase+cabHeight*.53,side*W*.431);
      addBox(root,frame,.042,cabHeight*.78,.055,
        cabX,cabBase+cabHeight*.55,side*W*.453);
      addBox(root,chrome,.15,.035,.06,
        cabX-.10,.77,side*(W*.51+.035));
      addBox(root,trim,.18,.10,.14,
        cabX+cabL*.37,cabBase+.19,side*(W*.5+.05));
    }
    if(profile.kind==="taxi"){
      addBox(root,deliveryStripe,.50,.13,.28,cabX,roof+.11,0);
      addBox(root,frame,.33,.045,.29,cabX,roof+.20,0);
    }
    if(profile.kind==="hatchback"){
      addBox(root,trim,.26,.058,W*.78,-L*.43,roof+.08,0);
    }
    // Correct front (+X) versus rear (-X): no shared headlight placement.
    for(const side of [-1,1]){
      addBox(root,headLight,.065,.16,.22,L*.5+.025,.55,side*W*.32);
      addBox(root,tailLight,.060,.17,.24,-L*.5-.025,.55,side*W*.32);
    }
    addBox(root,trim,.063,.19,W*.43,L*.5+.032,.40,0);
    addBox(root,plate,.035,.086,W*.38,L*.5+.075,.67,0);
    addBox(root,plate,.035,.086,W*.38,-L*.5-.075,.67,0);
    // Four wheels: the axle lies on local Z after cylinder rotation around X.
    const visibleHeadlights=[];
    for(const side of [-1,1]){
      const glow=addBox(root,headGlow,.024,.105,.15,L*.5+.069,.55,side*W*.32);
      visibleHeadlights.push(glow);
    }
    // Low-opacity beam for every car; one real shadowless spotlight for a
    // limited subset, to illuminate road without adding 12 costly lights.
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.70,.045,6.0,10,1,true),beamMaterial);
    beam.rotation.z=-Math.PI/2;beam.position.set(L*.5+3.03,.54,0);
    beam.renderOrder=8;root.add(beam);
    let spot=null;
    if(i%2===0){
      spot=new THREE.SpotLight(0xffedc6,0,10,Math.PI/6,.65,2);
      spot.position.set(L*.5+.08,.65,0);spot.castShadow=false;
      spot.target.position.set(L*.5+8,.25,0);
      root.add(spot,spot.target);
    }
    const signalMeshes=[];
    for(const side of [-1,1]){
      const frontSignal=addBox(root,indicator,.055,.10,.13,L*.5+.03,.49,side*W*.45);
      const backSignal=addBox(root,indicator,.055,.10,.13,-L*.5-.03,.49,side*W*.45);
      frontSignal.userData.turnSide=side;backSignal.userData.turnSide=side;
      signalMeshes.push(frontSignal,backSignal);
    }
    const brakeMeshes=[];
    for(const side of [-1,1])brakeMeshes.push(addBox(root,brake,.065,.12,.16,-L*.5-.035,.60,side*W*.30));
    const wheelPivots=[];
    for(const axle of [-1,1])for(const side of [-1,1]){
      const pivot=new THREE.Group();
      pivot.userData.front=axle===1;
      pivot.position.set(axle*L*.32,R+.015,side*(W*.5+.035));root.add(pivot);
      const t=wheelsGeometry(R),tread=new THREE.Mesh(t.geo,rubber);
      tread.scale.set(t.sx,t.sy,t.sz);tread.rotation.x=Math.PI/2;pivot.add(tread);
      const h=wheelsGeometry(R,true),hub=new THREE.Mesh(h.geo,chrome);
      hub.scale.set(h.sx,h.sy,h.sz);hub.rotation.x=Math.PI/2;
      hub.position.z=side*.038;pivot.add(hub);
      wheelPivots.push(pivot);
    }
    return {root,wheelPivots,profile,signalMeshes,brakeMeshes,visibleHeadlights,beam,spot};
  }


  // All nodes are junction centres on the paved ROAD_SEGMENTS shared by the
  // urban plan: not independent splines through building plots.
  const NODE={
    A:{x:-29,z:-40}, B:{x:29,z:-40},
    C:{x:-29,z:-24.5}, D:{x:29,z:-24.5},
    E:{x:-29,z:-8.5}, F:{x:-25,z:-8.5},
    G:{x:25,z:-8.5}, H:{x:29,z:-8.5},
    I:{x:-25,z:8.5}, J:{x:25,z:8.5}
  };
  const TOURS=[
    "C E F G H D C","C D H G F E C",
    "C E F G J I F E C","C E F I J G F E C",
    "C D B A C","C A B D C",
    "C D H G J I F E C","C E F I J G H D C"
  ].map(row=>row.split(" "));
  // No dead-end driving or instant reversal: route selection is deterministic
  // but changes at every C junction, over hundreds of blocks.
  const hash=(n)=>{n=(Math.imul(n^0x9e3779b9,0x85ebca6b))>>>0;
    n=(Math.imul(n^(n>>>13),0xc2b2ae35))>>>0;return (n^(n>>>16))>>>0;};
  const dir=(a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);
    if(l<.001)throw Error("Traffic route has a zero-length edge");
    return {x:dx/l,z:dz/l};};
  const right=v=>({x:-v.z,z:v.x});
  const add=(a,b,s=1)=>({x:a.x+b.x*s,z:a.z+b.z*s});
  const R=1.50,LANE=.68;
  const signalNodes=new Set(["C","D","F","G"]);
  // Traffic is tied to absolute Unix time (identical across browser zones).
  // Tehran local time separately governs night lamps.
  const baseMs=Date.now();
  function makeTour(seed,halfLength){
    let state=hash(seed+2047),nodes=["C"];
    const random=()=>{state=hash(state+0x6d2b79f5);return state/4294967296;};
    for(let k=0;k<210;k++){
      const incoming=nodes.length>1?nodes[nodes.length-2]:null;
      let candidates=TOURS.filter(t=>t[1]!==incoming);
      if(k===209)candidates=candidates.filter(t=>t[t.length-2]!==nodes[1]);
      const tour=candidates[Math.floor(random()*candidates.length)]||candidates[0];
      nodes.push(...tour.slice(1));
    }
    const head=dir(NODE.C,NODE[nodes[1]]);
    const p0=add(add(NODE.C,head,R),right(head),LANE);
    let points=[{x:p0.x,z:p0.z,s:0}],length=0;
    const events=[];
    const put=p=>{
      const prev=points[points.length-1];
      const d=Math.hypot(p.x-prev.x,p.z-prev.z);
      if(d<1e-8)return;
      length+=d;points.push({x:p.x,z:p.z,s:length});
    };
    for(let i=1;i<nodes.length;i++){
      const before=NODE[nodes[i-1]],at=NODE[nodes[i]],
        after=NODE[nodes[i===nodes.length-1?1:i+1]];
      const a=dir(before,at),b=dir(at,after);
      const start=add(add(at,a,-R),right(a),LANE);
      // A pedestrian crossing is on the southern street only (x=0,z~8.5).
      const last=points[points.length-1];
      if((nodes[i-1]==="I"&&nodes[i]==="J")||
         (nodes[i-1]==="J"&&nodes[i]==="I")){
        if(last.x*start.x<0){
          put({x:0,z:last.z+(start.z-last.z)*(-last.x)/(start.x-last.x)});
          events.push({at:length-(halfLength+2.22),type:"crosswalk"});
        }
      }
      put(start);
      if(signalNodes.has(nodes[i])){
        events.push({at:length-(halfLength+1.12),type:"signal",
          node:nodes[i],axis:Math.abs(a.x)>.5?"h":"v"});
      }
      const endpoint=add(add(at,b,R),right(b),LANE);
      if(a.x*b.x+a.z*b.z>.999){
        put(endpoint);
      }else{
        if(a.x*b.x+a.z*b.z<-.1)throw Error("Illegal road U-turn");
        const control=add(add(at,right(a),LANE),right(b),LANE);
        // Quadratic turn keeps both axle centres within intersecting asphalt.
        for(let j=1;j<=12;j++){
          const t=j/12,u=1-t;
          put({x:u*u*start.x+2*u*t*control.x+t*t*endpoint.x,
               z:u*u*start.z+2*u*t*control.z+t*t*endpoint.z});
        }
      }
    }
    // Explicitly connect the last curve to the same starting lane point.
    put(p0);
    const stopEvents=events.map(e=>({...e,at:((e.at%length)+length)%length}))
      .sort((a,b)=>a.at-b.at);
    return {points,length,events:stopEvents,seed};
  }
  const bisect=(arr,s,key="s")=>{
    let lo=0,hi=arr.length;
    while(lo<hi){const m=(lo+hi)>>>1;if(arr[m][key]<s)lo=m+1;else hi=m;}
    return lo;
  };
  function sample(route,s){
    const d=((s%route.length)+route.length)%route.length,pts=route.points;
    const idx=Math.max(1,Math.min(pts.length-1,bisect(pts,d)));
    const a=pts[idx-1],b=pts[idx],f=(d-a.s)/(b.s-a.s);
    const h=dir(a,b);
    return {x:a.x+(b.x-a.x)*f,z:a.z+(b.z-a.z)*f,dx:h.x,dz:h.z};
  }
  function signalGreen(e,ms){
    const offset={C:0,D:11,F:6,G:17}[e.node]||0;
    const p=((ms/1000+offset)%52+52)%52;
    return e.axis==="h"?p<22:p>=26&&p<48;
  }
  function nextStop(route,s){
    const ix=bisect(route.events,s-1e-7,"at");
    const e=route.events[ix%route.events.length];
    return {...e,distance:(e.at-s+route.length)%route.length};
  }
  const vehicles=[];
  // Stable phase offsets and >50km-ish schedules prevent the same short loop
  // from replaying on reload. No localStorage or citizen/writer state involved.
  for(let i=0;i<12;i++){
    const spec=profiles[(i*5+Math.floor(i/3))%profiles.length];
    const model=makeVehicle(i,spec);
    const route=makeTour(i*811+17,spec.len*.5);
    const speed=spec.pace*(.87+((i*7)%13)*.018);
    const seed=hash(i*1171+83);
    let progress=((baseMs/1000)*speed+seed*0.00001237)%route.length;
    // Try non-overlapping world positions on first creation; still stable for
    // the same wall-clock instant and independent of page reload count.
    for(let attempts=0;attempts<180;attempts++){
      const p=sample(route,progress);
      if(vehicles.every(other=>{
        const q=sample(other.route,other.progress);
        return Math.hypot(p.x-q.x,p.z-q.z)>(spec.len+other.model.profile.len)*.5+.8;
      }))break;
      progress=(progress+4.3)%route.length;
    }
    vehicles.push({model,route,progress,distance:0,speed,velocity:speed,
      renderSpeed:speed,lastPosition:null,turnSide:0});
  }
  // Four traffic-control posts, each with perpendicular red/green faces.
  const signalPosts=[];
  const redBulb=new THREE.MeshBasicMaterial({color:0xff3420});
  const greenBulb=new THREE.MeshBasicMaterial({color:0x4eff93});
  const offBulb=new THREE.MeshBasicMaterial({color:0x282c2b});
  const makeLight=(parent,x,y,z)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.045),offBulb);
    mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  };
  for(const id of signalNodes){
    const n=NODE[id],pole=new THREE.Group();fleet.add(pole);
    pole.name="traffic-signal-"+id;
    pole.position.set(n.x+(n.x<0?-2.48:2.48),streetY,n.z+2.46);
    addBox(pole,frame,.12,2.8,.12,0,1.4,0);
    addBox(pole,trim,.38,.8,.35,0,2.85,0);
    const rh=makeLight(pole,-.1,3.04,.19),gh=makeLight(pole,-.1,2.76,.19);
    const rv=makeLight(pole,.11,3.04,.19),gv=makeLight(pole,.11,2.76,.19);
    signalPosts.push({id,rh,gh,rv,gv});
  }
  // Separate pedestrian-request signals at the existing upper crosswalk.
  const crossingLights=[];
  for(const x of [-2.8,2.8]){
    const g=new THREE.Group();g.position.set(x,streetY,11.12);fleet.add(g);
    addBox(g,frame,.12,2.65,.12,0,1.32,0);
    addBox(g,trim,.34,.8,.3,0,2.78,0);
    crossingLights.push({r:makeLight(g,0,2.95,.18),
                         g:makeLight(g,0,2.60,.18)});
  }
  let pedestrianCrossingRequested=false;
  let lastElapsed=null,startElapsed=null;
  let lastNow=baseMs;
  function setCrossingDemand(v){pedestrianCrossingRequested=v===true;}
  function trafficState(){
    return vehicles.map(car=>({
      x:car.model.root.position.x,z:car.model.root.position.z,
      halfLength:car.model.profile.len*.5,speed:car.renderSpeed,
      lane:"road-graph",heading:car.model.root.rotation.y
    }));
  }
  function position(car){
    const p=sample(car.route,car.progress);
    car.model.root.position.set(p.x,streetY-.03,p.z);
    car.model.root.rotation.y=Math.atan2(-p.dz,p.dx);
    const future=sample(car.route,car.progress+1.3);
    const cross=p.dx*future.dz-p.dz*future.dx;
    car.turnSide=Math.abs(cross)>.055?(cross>0?1:-1):0;
    for(const wheel of car.model.wheelPivots){
      wheel.rotation.z=-car.distance/car.model.profile.r;
      if(wheel.userData.front)wheel.rotation.y=Math.max(-.35,Math.min(.35,-cross*.65));
    }
  }
  for(const car of vehicles)position(car);
  function tick(elapsed,ms){
    if(!Number.isFinite(elapsed))return;
    if(lastElapsed===null){lastElapsed=elapsed;startElapsed=elapsed;return;}
    let delta=Math.max(0,Math.min(.18,elapsed-lastElapsed));
    lastElapsed=elapsed;
    // Use real Tehran-independent epoch time for absolute phase. Elapsed
    // supplies fixed-delta test mode and protects against large tab pauses.
    while(delta>1e-7){
      const dt=Math.min(.04,delta);
      for(const car of vehicles){
        let step=car.speed*dt;
        const next=nextStop(car.route,car.progress);
        const stop=next.type==="crosswalk"?
          pedestrianCrossingRequested:!signalGreen(next,ms);
        if(stop&&next.distance<=step+.015)
          step=Math.min(step,Math.max(0,next.distance));
        if(step>1e-6){
          const p=sample(car.route,car.progress+step);
          for(const other of vehicles){
            if(car===other)continue;
            const q=sample(other.route,other.progress);
            // Only stop for a real leader in the same travel lane.
            // Cross-road right-of-way is controlled at traffic-light nodes;
            // global radial collision tests created four-way gridlock.
            const align=p.dx*q.dx+p.dz*q.dz;
            if(align>.86){
              const dx=q.x-p.x,dz=q.z-p.z;
              const forward=dx*p.dx+dz*p.dz;
              const lateral=Math.abs(-dx*p.dz+dz*p.dx);
              const headway=(car.model.profile.len+
                other.model.profile.len)*.5+.72;
              if(lateral<.73 && forward>=0 && forward<headway){
                step=0;break;
              }
            }
          }
        }
        car.model.braking=step<car.speed*dt*.65;
        car.renderSpeed=dt>0?step/dt:0;
        car.progress=(car.progress+step)%car.route.length;
        car.distance+=step;
        position(car);
      }
      delta-=dt;
    }
  }
  const tehranHour=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Tehran",
    hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
  function nightFromTehran(ms){
    const p=tehranHour.formatToParts(new Date(ms));
    const h=Number(p.find(x=>x.type==="hour")?.value||0)+
      Number(p.find(x=>x.type==="minute")?.value||0)/60;
    // Ramp on 17-19 and off 5-7, independent of browser timezone.
    return h>=19||h<5?1:h>=17?(h-17)/2:h<7?(7-h)/2:0;
  }
  let nightFactor=0;
  function update(day,elapsed){
    if(!Number.isFinite(elapsed))return;
    if(startElapsed===null)startElapsed=elapsed;
    const realNow=Date.now();
    const nowMs=Math.max(realNow,baseMs+(elapsed-startElapsed)*1000);
    lastNow=nowMs;
    const sceneNight=1-Math.max(0,Math.min(1,Number(day)||0));
    nightFactor=Math.max(sceneNight,nightFromTehran(nowMs));
    headLight.emissiveIntensity=.3+nightFactor*3.0;
    tailLight.emissiveIntensity=.16+nightFactor*.7;
    const blink=Math.floor(nowMs/380)%2===0;
    tick(elapsed,nowMs);
    for(const car of vehicles){
      const m=car.model;
      for(const glow of m.visibleHeadlights)glow.visible=nightFactor>.16;
      m.beam.visible=nightFactor>.35;
      if(m.spot)m.spot.intensity=nightFactor*2.1;
      for(const light of m.brakeMeshes)light.visible=m.braking;
      for(const light of m.signalMeshes)
        light.visible=blink&&car.turnSide===light.userData.turnSide;
    }
    for(const e of signalPosts){
      const gh=signalGreen({node:e.id,axis:"h"},nowMs);
      const gv=signalGreen({node:e.id,axis:"v"},nowMs);
      e.rh.material=gh?offBulb:redBulb;e.gh.material=gh?greenBulb:offBulb;
      e.rv.material=gv?offBulb:redBulb;e.gv.material=gv?greenBulb:offBulb;
    }
    for(const e of crossingLights){
      e.r.material=pedestrianCrossingRequested?redBulb:offBulb;
      e.g.material=pedestrianCrossingRequested?offBulb:greenBulb;
    }
  }
  // Pure diagnostics to support geometry-specific CI without scene screenshots.
  function routeDiagnostics(roads){
    const rects=(roads||[
      {axis:"x",at:-8.5,min:-31.2,max:31.2,width:4},
      {axis:"x",at:8.5,min:-27,max:27,width:4},
      {axis:"z",at:-25,min:-10.5,max:10.5,width:4},
      {axis:"z",at:25,min:-10.5,max:10.5,width:4},
      {axis:"z",at:-29,min:-42,max:1.5,width:4.3},
      {axis:"z",at:29,min:-42,max:1.5,width:4.3},
      {axis:"x",at:-24.5,min:-31.2,max:31.2,width:4},
      {axis:"x",at:-40,min:-31.2,max:31.2,width:4.4}
    ]).map(r=>r.axis==="x"?
      {x0:r.min,x1:r.max,z0:r.at-r.width/2,z1:r.at+r.width/2}:
      {x0:r.at-r.width/2,x1:r.at+r.width/2,z0:r.min,z1:r.max});
    let checked=0,offroad=0;
    for(const car of vehicles){
      for(const p of car.route.points){
        checked++;
        if(!rects.some(r=>p.x>=r.x0-.01&&p.x<=r.x1+.01&&
            p.z>=r.z0-.01&&p.z<=r.z1+.01))offroad++;
      }
    }
    return {vehicles:vehicles.length,checked,offroad,
      routeLengths:vehicles.map(v=>Math.round(v.route.length)),
      trafficClock:"absolute-epoch",lightingZone:"Asia/Tehran",
      signals:signalPosts.length};
  }
  return {update,vehicles,setCrossingDemand,trafficState,routeDiagnostics};
}
