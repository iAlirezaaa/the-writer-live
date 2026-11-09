#!/usr/bin/env node
/** Read-only ODbL OSM acquisition. Does not mutate live city meshes or author data. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {compileSurvey,overpassQuery,writerArea,normalizeOsmApiMap} from './writer-block-survey.mjs';
const endpoints=['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter'];
const args=process.argv.slice(2);
const flag=(s)=>{const i=args.indexOf(s);return i>=0?args[i+1]:null;};
const out=resolve(flag('--out')||'city/survey/output/writer-block-survey.json');
const radius=flag('--radius')?Number(flag('--radius')):230;
const area=writerArea(radius);
let data=null,endpoint='fixture';
const capturedAt=new Date().toISOString();
if(flag('--fixture')){
  data=JSON.parse(await readFile(resolve(flag('--fixture')),'utf8'));
}else{
  // Prefer the official OSM map API for a single small read-only block.
  // Avoid repeatedly hammering rate-limited Overpass servers.
  const bbox=[area.west,area.south,area.east,area.north].map(x=>x.toFixed(8)).join(',');
  const official='https://api.openstreetmap.org/api/0.6/map.json?bbox='+bbox;
  try{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),22000);
    let response;
    try{response=await fetch(official,{headers:{
      'Accept':'application/json',
      'User-Agent':'TheWriterCitySurvey/0.1 (single-block licensed data verification)'
    },signal:controller.signal});}finally{clearTimeout(timeout);}
    if(!response.ok)throw Error('HTTP '+response.status);
    const body=await response.text();
    if(body.length>12000000)throw Error('Official OSM payload exceeds bounded size');
    data=normalizeOsmApiMap(JSON.parse(body));
    endpoint=official;
    if(!data.elements.length){data=null;throw Error('No complete mapped ways in official response');}
  }catch(error){data=null;console.error('Official OSM map API unavailable: '+error.message);}
  const query=overpassQuery(area);
  for(const server of data?[]:endpoints){
    try{
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),24000);
      let response;
      try{
        response=await fetch(server,{method:'POST',headers:{
            'Content-Type':'application/x-www-form-urlencoded',
            'User-Agent':'TheWriterCitySurvey/0.1 (limited writer block ODbL research)'
          },body:'data='+encodeURIComponent(query),signal:controller.signal});
      }finally{clearTimeout(timeout);}
      if(!response.ok)throw Error('HTTP '+response.status);
      const raw=await response.text();
      if(raw.length>6500000)throw Error('Survey response exceeds bounded payload');
      const parsed=JSON.parse(raw);
      if(!Array.isArray(parsed.elements))throw Error('Invalid Overpass payload');
      data=parsed;endpoint=server;break;
    }catch(error){console.error('OSM endpoint unavailable: '+server+' '+error.message);}
  }
}
if(!data){
  console.error('No authoritative map data received; no geometry was invented.');
  process.exitCode=2;
}else{
  const survey=compileSurvey(data,{area,sourceUrl:endpoint,capturedAt});
  if(!survey.totals.roads){
    console.error('No mapped roads in source data; unable to confirm survey.');
    process.exitCode=3;
  }else{
    await mkdir(dirname(out),{recursive:true});
    await writeFile(out,JSON.stringify(survey,null,2)+'\n','utf8');
    console.log('TEHRAN-OSM-SURVEY '+JSON.stringify({
      out,endpoint,totals:survey.totals,blockBoundaryStatus:survey.blockBoundary.status,
      osmBaseTimestamp:survey.osmBaseTimestamp
    }));
  }
}
