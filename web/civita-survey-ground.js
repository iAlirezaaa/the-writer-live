/* MAYOR-082 — ground level at a local point from the Regione Lazio DBGT inner grid. */
import {createHeightSampler,decodeDem,validateCivitaDbt} from './civita-measured-terrain.js';
export async function loadSurveyGround(x,z){
 const url=name=>new URL('./data/'+name,import.meta.url);
 const r=await fetch(url('civita-dbt.json'),{cache:'default'});
 if(!r.ok)throw new Error('Survey HTTP '+r.status);
 const data=validateCivitaDbt(await r.json());
 const buffer=async g=>{const b=await fetch(url(g.file),{cache:'default'});if(!b.ok)throw new Error('DEM HTTP '+b.status);return b.arrayBuffer();};
 const [i,o]=await Promise.all([buffer(data.dem.inner),buffer(data.dem.outer)]);
 return createHeightSampler(decodeDem(i,data.dem.inner,data.dem.encoding),decodeDem(o,data.dem.outer,data.dem.encoding))(x,z);
}
