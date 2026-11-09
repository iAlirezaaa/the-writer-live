/* MAYOR-033: one procedurally-authored house balcony retrofit in the writer block.
 * NOT a surveyed Tehran facade. Existing home-east footprint and routes untouched.
 * Uses one unindexed BufferGeometry and one PBR material for all supported members.
 * 3Dviz Pro Max: sockets, physical connections, matching slab/facade transforms.
 */
export const BALCONY_CRAFT_VERSION = "writer-block-home-east-balcony-20261109-v1";
export const BALCONY_CRAFT_CONTRACT = Object.freeze({
  houseKey: "home-east",
  evidenceLevel: "procedural-visual-prototype",
  realWorldBuildingIdentified: false,
  streetY: -3,
  houseCenter: Object.freeze({ x: 19, z: 0 }),
  windowOffsetX: -1.58,
  slabCenterYAboveStreet: 2.39,
  slabWidth: 1.18,
  slabDepth: 0.55,
  slabCenterZFromHouse: 2.84,
  nominalRailHeightAboveSlab: 0.86,
  nominalPostThickness: 0.045,
  material: "dark powder-coated metal (illustrative)",
  physicalCollider: false,
  extraDrawCalls: 1
});

export function balconyAttachmentPlan(house, streetY=-3) {
  if (house?.key !== "home-east" || Math.abs(house.x - 19) > 1e-6 ||
      Math.abs(house.z) > 1e-6 || Math.abs(house.w - 5) > 1e-6 ||
      Math.abs(house.d - 5) > 1e-6 || !Number.isFinite(streetY))
    throw new TypeError("Balcony detail requires the unchanged home-east facade");
  const c = BALCONY_CRAFT_CONTRACT;
  const x = house.x + c.windowOffsetX;
  const y = streetY + c.slabCenterYAboveStreet + .05; // top face of existing 0.10m slab
  const zFront = house.z + c.slabCenterZFromHouse + c.slabDepth/2 - .055;
  const zBack = house.z + house.d/2 + .065; // returns stop immediately before wall
  if (!(zFront > zBack && zFront - zBack > .35)) throw new RangeError("Front-to-wall connection collapsed");
  return Object.freeze({
    x,y,zFront,zBack,
    halfWidth: .51,
    posts: 8,
    topY: y + c.nominalRailHeightAboveSlab,
    slabTopY: y,
    slabFrontZ: house.z + c.slabCenterZFromHouse + c.slabDepth/2,
    facadeZ: house.z + house.d/2
  });
}

export function buildWriterBlockBalcony(THREE, parent, {
  house, streetY=-3
}={}) {
  const plan=balconyAttachmentPlan(house,streetY);
  const pos=[];
  function box(cx,cy,cz,w,h,d) {
    if (!(w>0&&h>0&&d>0)) throw new RangeError("Invalid railing member dimensions");
    const x0=cx-w/2,x1=cx+w/2,y0=cy-h/2,y1=cy+h/2,z0=cz-d/2,z1=cz+d/2;
    const faces=[
      [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],  // front
      [[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],  // rear
      [[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]],  // right
      [[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],  // left
      [[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]],  // top
      [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]]   // bottom
    ];
    for(const f of faces)for(const idx of [0,1,2,0,2,3])pos.push(...f[idx]);
  }
  const t=BALCONY_CRAFT_CONTRACT.nominalPostThickness;
  // Two front mounting posts, six intermediate vertical infills, and returns.
  // Every vertical touches either the slab or its continuous front cross rail.
  const frontY=plan.y+.45,innerTopY=plan.y+.81;
  for(let i=0;i<plan.posts;i++){
    const px=plan.x-plan.halfWidth+(2*plan.halfWidth)*i/(plan.posts-1);
    const end=i===0||i===plan.posts-1;
    box(px,frontY,plan.zFront,end?t:.025,.88,end?t:.025);
  }
  // Mounting feet supported by the old balcony slab (each plate stays on slab).
  for(const sx of [-1,1]){
    const px=plan.x+sx*plan.halfWidth;
    box(px,plan.y+.012,plan.zFront,.11,.024,.12);
    box(px,plan.y+.012,plan.zBack,.11,.024,.12);
    box(px,frontY,plan.zBack,t,.88,t);
    // Return rails join front corner posts to the wall-side posts.
    const zm=(plan.zFront+plan.zBack)*.5,length=plan.zFront-plan.zBack;
    box(px,innerTopY,zm,t,.065,length+.07);
    // Bracket anchors reach the wall, even though rails only sit on the slab.
    box(px,innerTopY,plan.facadeZ+.035,.07,.07,.10);
  }
  box(plan.x,innerTopY,plan.zFront,2*plan.halfWidth+.09,.065,.065);
  box(plan.x,plan.y+.14,plan.zFront,2*plan.halfWidth+.035,.028,.028);
  // Physically plausible welded joints without detached floating ornament.
  for(const sx of [-1,1])
    box(plan.x+sx*plan.halfWidth,plan.y+.07,plan.zBack,.09,.09,.09);

  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const material=new THREE.MeshStandardMaterial({
    color:0x35444a,roughness:.46,metalness:.55,
    side:THREE.FrontSide
  });
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name="writer-block-home-east-balcony-rail-v1";
  mesh.castShadow=false;
  mesh.receiveShadow=true;
  mesh.userData.cityConstructionEvidence={
    ...BALCONY_CRAFT_CONTRACT,
    attachment:plan, memberCount:pos.length/108,
    supportedByOriginalSlab:true, attachedToFacade:true,
    owner:"web/town.js", surveyedTehranBuilding:false,
    navigationUnchanged:true, pickable:false
  };
  parent.add(mesh);
  return mesh;
}
