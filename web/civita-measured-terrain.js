/* MAYOR-082 — terrain from the Regione Lazio DBGT 2014 survey (CC BY 4.0).
 * Heights are a linear TIN through surveyed contours, spot heights, scarps and road edges,
 * resampled by city/survey/build_civita_dbt.py. The draped image holds land cover only, no map labels.
 * Cliff strata follow published geology: tuff cap, pyroclastics, then clay. Their colour is interpretive.
 */
export const CIVITA_DBT_ATTRIBUTION='Regione Lazio, DBGT 2014 (CC BY 4.0)';
const dataUrl=name=>new URL('./data/'+name,import.meta.url);

export function validateCivitaDbt(data){
 if(data?.source?.license!=='CC-BY-4.0'||!String(data.source.provider||'').includes('Regione Lazio'))
  throw new TypeError('Civita survey provenance missing');
 for(const key of ['inner','outer']){
  const g=data.dem?.[key];
  if(!g||!(g.cols>1)||!(g.rows>1)||!(g.step>0)||g.extent?.length!==4)throw new TypeError('Invalid DEM description: '+key);
 }
 if(!Array.isArray(data.volumes)||!data.volumes.length)throw new TypeError('Survey has no building volumes');
 return data;
}

export function decodeDem(buffer,grid,encoding){
 const raw=new Uint16Array(buffer);
 if(raw.length!==grid.cols*grid.rows)throw new RangeError('DEM size does not match its description');
 const heights=new Float32Array(raw.length);
 for(let i=0;i<raw.length;i++)heights[i]=raw[i]/encoding.scale+encoding.offset;
 return {...grid,heights};
}

function bilinear(g,x,z){
 const u=(x-g.extent[0])/g.step,v=(z-g.extent[1])/g.step;
 if(u<0||v<0||u>g.cols-1||v>g.rows-1)return null;
 const i=Math.min(g.cols-2,Math.floor(u)),j=Math.min(g.rows-2,Math.floor(v)),a=u-i,b=v-j,c=g.cols,h=g.heights;
 return (1-b)*((1-a)*h[j*c+i]+a*h[j*c+i+1])+b*((1-a)*h[(j+1)*c+i]+a*h[(j+1)*c+i+1]);
}

export function createHeightSampler(inner,outer){
 return (x,z)=>{
  const a=bilinear(inner,x,z);if(a!==null)return a;
  const b=bilinear(outer,x,z);return b!==null?b:NaN;
 };
}

/* One indexed grid. `hole` drops quads lying wholly inside a rectangle, where the finer grid takes over. */
export function terrainGeometry(THREE,g,hole=null){
 const {cols,rows,step,extent:[x0,z0,x1,z1],heights}=g;
 const position=new Float32Array(cols*rows*3),uv=new Float32Array(cols*rows*2);
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const k=j*cols+i,x=x0+i*step,z=z0+j*step;
  position[k*3]=x;position[k*3+1]=heights[k];position[k*3+2]=z;
  uv[k*2]=(x-x0)/(x1-x0);uv[k*2+1]=1-(z-z0)/(z1-z0);
 }
 const index=[];
 for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){
  const x=x0+i*step,z=z0+j*step;
  if(hole&&x>=hole[0]&&x+step<=hole[2]&&z>=hole[1]&&z+step<=hole[3])continue;
  const a=j*cols+i,b=a+1,c=a+cols,d=c+1;
  index.push(a,c,b,b,c,d);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(position,3));
 geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 geometry.setIndex(index);
 geometry.computeVertexNormals();
 return geometry;
}

/* Cliffs are nearly vertical, so a top-down image smears on them. Steep ground is coloured in the shader
 * by its height instead, in bands, and every surface gets fine grain so it holds up close. */
export function terrainMaterial(THREE,streetY){
 const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,metalness:0});
 material.onBeforeCompile=shader=>{
  shader.uniforms.civitaStreetY={value:streetY};
  shader.vertexShader=shader.vertexShader
   .replace('#include <common>','#include <common>\nvarying vec3 vCivitaPos;\nvarying vec3 vCivitaNormal;')
   .replace('#include <fog_vertex>','#include <fog_vertex>\nvCivitaPos=(modelMatrix*vec4(transformed,1.0)).xyz;\nvCivitaNormal=normalize(mat3(modelMatrix)*objectNormal);');
  shader.fragmentShader=shader.fragmentShader
   .replace('#include <common>',`#include <common>
uniform float civitaStreetY;
varying vec3 vCivitaPos;
varying vec3 vCivitaNormal;
float civitaHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float civitaNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(civitaHash(i),civitaHash(i+vec2(1,0)),f.x),mix(civitaHash(i+vec2(0,1)),civitaHash(i+vec2(1,1)),f.x),f.y);}`)
   .replace('#include <color_fragment>',`#include <color_fragment>
{
 float h=vCivitaPos.y-civitaStreetY;
 vec2 side=vec2(vCivitaPos.x+vCivitaPos.z,h);
 // Beds dip and break along the cliff; erosion gullies cut across them.
 float wobble=civitaNoise(side*vec2(.02,.05))*7.0+civitaNoise(side*vec2(.11,.16))*1.6;
 float hh=h+wobble;
 float gully=smoothstep(.55,.8,civitaNoise(vec2(side.x*.16,h*.018)));
 // Horizontal beds, as in photographs of the cliff: broad ochre layers with thin darker seams.
 float beds=civitaNoise(vec2(side.x*.012,hh*.55));
 float fine=civitaNoise(vec2(side.x*.05,hh*2.6));
 float seam=smoothstep(.62,.8,civitaNoise(vec2(side.x*.02,hh*1.5)));
 float cracks=civitaNoise(side*vec2(.7,.25));
 vec3 tuff=mix(vec3(.36,.22,.10),vec3(.58,.38,.18),beds)*(.82+cracks*.3);
 vec3 pyro=mix(vec3(.46,.31,.15),vec3(.64,.46,.25),beds)*(.86+fine*.24);
 vec3 clay=mix(vec3(.46,.42,.34),vec3(.66,.62,.53),civitaNoise(side*vec2(.09,.05)));
 vec3 rock=mix(clay,pyro,smoothstep(-92.0,-72.0,h));
 rock=mix(rock,tuff,smoothstep(-30.0,-20.0,h));
 rock*=(1.0-seam*.26)*(1.0-gully*.2);
 float steep=smoothstep(.1,.32,1.0-vCivitaNormal.y);
 // Scrub holds on the ledges where the slope eases.
 float scrub=smoothstep(.56,.74,civitaNoise(vCivitaPos.xz*.16+h*.05))*(1.0-smoothstep(.3,.62,1.0-vCivitaNormal.y));
 rock=mix(rock,vec3(.11,.17,.06),scrub*.75);
 vec3 base=diffuseColor.rgb;
 // Forest and meadow from the drape are dark from above; mottle and lift them.
 float leafy=smoothstep(-.012,.03,base.g-base.r);
 float clumps=civitaNoise(vCivitaPos.xz*.09)*.6+civitaNoise(vCivitaPos.xz*.4)*.4;
 base=mix(base,base*vec3(1.75,1.7,1.25)*(.68+clumps*.72),leafy);
 diffuseColor.rgb=mix(base,rock,steep);
 // The drape marks lanes and squares in neutral grey; in the village they are grey basalt cobbles.
 float grey=step(abs(base.r-base.b),.1)*step(.1,base.r)*step(base.r,.42)*(1.0-leafy);
 float paved=(1.0-steep)*step(-9.0,h)*grey;
 vec2 sp=vCivitaPos.xz*3.4;
 vec2 ip=floor(sp),fp=fract(sp);
 float f1=9.0,f2=9.0,cell=0.0;
 for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
  vec2 g=vec2(float(i),float(j));
  vec2 o=vec2(civitaHash(ip+g),civitaHash(ip+g+17.3));
  float d=length(g+o-fp);
  if(d<f1){f2=f1;f1=d;cell=civitaHash(ip+g+5.1);}else if(d<f2){f2=d;}
 }
 float px=length(fwidth(sp));
 float joint=(1.0-smoothstep(.04,.17,f2-f1))*(1.0-smoothstep(.35,1.1,px));
 vec3 cobble=mix(vec3(.36,.335,.30),vec3(.58,.54,.48),cell);
 cobble=mix(mix(vec3(.36,.335,.30),vec3(.58,.54,.48),.5),cobble,1.0-smoothstep(.35,1.1,px))*(1.0-joint*.45);
 diffuseColor.rgb=mix(diffuseColor.rgb,cobble,paved);
 float grain=civitaNoise(vCivitaPos.xz*1.7)*.6+civitaNoise(vCivitaPos.xz*6.3)*.4;
 diffuseColor.rgb*=.9+grain*.2;
}`)
   .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
{
 float h=vCivitaPos.y-civitaStreetY;
 vec2 side=vec2(vCivitaPos.x+vCivitaPos.z,h);
 float w=civitaNoise(side*vec2(.02,.05))*7.0+civitaNoise(side*vec2(.11,.16))*1.6;
 float a=civitaNoise(vec2(side.x*.03,(h+w)*1.6)),b=civitaNoise(vec2(side.x*.03,(h+w+.25)*1.6));
 float st=smoothstep(.1,.32,1.0-vCivitaNormal.y);
 normal=normalize(normal+(viewMatrix*vec4(0.,1.,0.,0.)).xyz*(b-a)*st*1.4);
}`);
 };
 return material;
}

export async function loadCivitaMeasuredTerrain(THREE,parent,{streetY=-3,onStatus=()=>{}}={}){
 const response=await fetch(dataUrl('civita-dbt.json'),{cache:'default'});
 if(!response.ok)throw new Error('Survey HTTP '+response.status);
 const data=validateCivitaDbt(await response.json());
 const [innerBuf,outerBuf]=await Promise.all(['inner','outer'].map(async key=>{
  const r=await fetch(dataUrl(data.dem[key].file),{cache:'default'});
  if(!r.ok)throw new Error('DEM HTTP '+r.status);
  return r.arrayBuffer();
 }));
 const inner=decodeDem(innerBuf,data.dem.inner,data.dem.encoding);
 const outer=decodeDem(outerBuf,data.dem.outer,data.dem.encoding);
 const heightAt=createHeightSampler(inner,outer);
 const loader=new THREE.TextureLoader();
 const layer=new THREE.Group();layer.name='civita-measured-terrain';
 layer.userData={source:CIVITA_DBT_ATTRIBUTION,measured:true,scale:'1:5000',surveyYear:2014};
 const margin=inner.step;
 const hole=[inner.extent[0]+margin,inner.extent[1]+margin,inner.extent[2]-margin,inner.extent[3]-margin];
 for(const [grid,cut,name] of [[outer,hole,'outer'],[inner,null,'inner']]){
  const material=terrainMaterial(THREE,streetY);
  const mesh=new THREE.Mesh(terrainGeometry(THREE,grid,cut),material);
  mesh.name='civita-terrain-'+name;mesh.receiveShadow=true;
  if(name==='outer')mesh.position.y=-.05;
  layer.add(mesh);
  loader.load(dataUrl(grid.texture).href,texture=>{
   texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;material.map=texture;material.needsUpdate=true;
  },undefined,()=>onStatus('تصویر پوشش زمین بارگذاری نشد'));
 }
 // Past the survey window the land continues as a plain ring that the haze swallows, so the map has no edge.
 const horizon=new THREE.Mesh(new THREE.RingGeometry(900,6000,64),new THREE.MeshStandardMaterial({color:0x4c5a3c,roughness:1}));
 horizon.rotation.x=-Math.PI/2;horizon.position.set(-200,-150,0);horizon.name='civita-horizon-land';layer.add(horizon);
 parent.add(layer);
 onStatus('زمین از نقشهٔ اندازه‌گیری‌شدهٔ منطقهٔ لاتزیو ساخته شد');
 return {layer,data,heightAt};
}
