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
  const headLight=material(0xffe8b9,{emissive:0xffce81,emissiveIntensity:.3});
  const tailLight=material(0xc35b53,{emissive:0xa12620,emissiveIntensity:.25});
  const indicator=material(0xffb34e,{emissive:0xff8b16,emissiveIntensity:0});
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
  const vehicles=[];
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
    const signalMeshes=[];
    for(const side of [-1,1]){
      signalMeshes.push(addBox(root,indicator,.055,.10,.13,L*.5+.03,.49,side*W*.45));
      signalMeshes.push(addBox(root,indicator,.055,.10,.13,-L*.5-.03,.49,side*W*.45));
    }
    const brakeMeshes=[];
    for(const side of [-1,1])brakeMeshes.push(addBox(root,brake,.065,.12,.16,-L*.5-.035,.60,side*W*.30));
    const wheelPivots=[];
    for(const axle of [-1,1])for(const side of [-1,1]){
      const pivot=new THREE.Group();
      pivot.position.set(axle*L*.32,R+.015,side*(W*.5+.035));root.add(pivot);
      const t=wheelsGeometry(R),tread=new THREE.Mesh(t.geo,rubber);
      tread.scale.set(t.sx,t.sy,t.sz);tread.rotation.x=Math.PI/2;pivot.add(tread);
      const h=wheelsGeometry(R,true),hub=new THREE.Mesh(h.geo,chrome);
      hub.scale.set(h.sx,h.sy,h.sz);hub.rotation.x=Math.PI/2;
      hub.position.z=side*.038;pivot.add(hub);
      wheelPivots.push(pivot);
    }
    return {root,wheelPivots,profile,signalMeshes,brakeMeshes};
  }

  // Both streets are four metres wide, centred on z=+/-8.5. Use one direction
  // per lane, with 1.65 metres between opposing lane centres (vehicle width
  // including wheels is <=1.3 metres).
  const lanes=[
    {id:"upper-east",z:7.68,dir:1},
    {id:"upper-west",z:9.32,dir:-1},
    {id:"lower-east",z:-9.32,dir:1},
    {id:"lower-west",z:-7.68,dir:-1}
  ];
  const BEGIN=-32,SPAN=64;
  const laneCars=lanes.map(()=>[]);
  // Stagger starting positions per lane to avoid synchronized convoys.
  const laneOffsets=[0,7,13,4];
  const slotPositions=[1,19,43];
  // Advance traffic phase by wall time: reload does not replay frame zero.
  const phaseSeconds=(Date.now()/1000)%SPAN;
  for(let i=0;i<12;i++){
    const laneIndex=i%4,lane=lanes[laneIndex],slot=Math.floor(i/4);
    const spec=profiles[(i+Math.floor(i/4))%profiles.length];
    const model=makeVehicle(i,spec);
    const car={model,lane,laneIndex,progress:(slotPositions[slot]+laneOffsets[laneIndex]+phaseSeconds*spec.pace)%SPAN,
      distance:slotPositions[slot]+laneOffsets[laneIndex]+phaseSeconds*spec.pace,
      speed:spec.pace*(.90+((i*7)%11)*.018)};
    vehicles.push(car);laneCars[laneIndex].push(car);
  }
  function sync(car){
    const x=car.lane.dir===1?BEGIN+car.progress:-BEGIN-car.progress;
    car.model.root.position.set(x,streetY-.03,car.lane.z);
    car.model.root.rotation.y=car.lane.dir===1?0:Math.PI;
    for(const wheel of car.model.wheelPivots)
      wheel.rotation.z=-car.distance/car.model.profile.r;
  }
  for(const car of vehicles)sync(car);
  let lastTime=null;
  let pedestrianCrossingRequested=false;
  let nightFactor=0;
  // A visual signal synchronized with the existing pedestrian reservation.
  const signalGroup=new THREE.Group();signalGroup.name="town-traffic-signals";fleet.add(signalGroup);
  const redLamp=material(0x40100d,{emissive:0xff1c12,emissiveIntensity:0});
  const greenLamp=material(0x0c4021,{emissive:0x19e66a,emissiveIntensity:.5});
  for(const x of [-2.8,2.8]){
    const pole=addBox(signalGroup,frame,.12,2.6,.12,x,streetY+1.25,11.1);
    addBox(signalGroup,trim,.38,.84,.3,x,streetY+2.72,11.1);
    addBox(signalGroup,redLamp,.22,.22,.06,x,streetY+2.9,11.27);
    addBox(signalGroup,greenLamp,.22,.22,.06,x,streetY+2.55,11.27);
  }
  // A single crosswalk crosses the two upper-road lanes at x=0.
  // Cars approaching from either side stop BEFORE their nose reaches x=-/+2.0.
  // Cars already past the stop line must leave the crossing instead of
  // freezing on top of a pedestrian.
  const CROSSWALK_GAP=2.1;
  function setCrossingDemand(value){pedestrianCrossingRequested=value===true;}
  function trafficState(){
    return vehicles.map(car=>({
      x:car.model.root.position.x,
      z:car.model.root.position.z,
      halfLength:car.model.profile.len*.5,
      speed:car.speed,
      lane:car.lane.id,
    }));
  }
  function tick(elapsed){
    if(!Number.isFinite(elapsed))return;
    if(lastTime===null){lastTime=elapsed;return;}
    let delta=Math.min(.18,Math.max(0,elapsed-lastTime));
    lastTime=elapsed;
    while(delta>1e-7){
      const dt=Math.min(.04,delta);
      for(const car of vehicles){
        let step=car.speed*dt;
        for(const ahead of laneCars[car.laneIndex]){
          if(car===ahead)continue;
          const gap=(ahead.progress-car.progress+SPAN)%SPAN;
          const safeGap=(car.model.profile.len+ahead.model.profile.len)/2+.70;
          step=Math.min(step,Math.max(0,gap-safeGap));
        }
        if(pedestrianCrossingRequested && car.lane.z>0){
          // Both directions use progress 0..SPAN towards the crossing.
          const stopAt=-BEGIN-(car.model.profile.len*.5+CROSSWALK_GAP);
          if(car.progress<=stopAt && car.progress+step>stopAt)
            step=Math.max(0,stopAt-car.progress);
        }
        car.model.braking=step<car.speed*dt*.7;
        car.progress=(car.progress+step)%SPAN;
        car.distance+=step;sync(car);
      }
      delta-=dt;
    }
  }
  function update(day,elapsed){
    const light=Math.max(0,Math.min(1,Number(day)||0));
    headLight.emissiveIntensity=.22+(1-light)*1.45;
    nightFactor=1-light;
    tailLight.emissiveIntensity=.12+nightFactor*.36;
    redLamp.emissiveIntensity=pedestrianCrossingRequested?1.8:.08;
    greenLamp.emissiveIntensity=pedestrianCrossingRequested?.03:1.1;
    tick(elapsed);
    for(const car of vehicles){
      for(const mesh of car.model.brakeMeshes)mesh.visible=!!car.model.braking;
      for(const mesh of car.model.signalMeshes)mesh.visible=false;
    }
  }
  return {update,vehicles,setCrossingDemand,trafficState};
}
