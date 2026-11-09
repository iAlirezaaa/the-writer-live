import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const source=readFileSync(resolve(process.argv[2]||".","web/tehran-environment.js"),"utf8");
const env=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
let now=Date.UTC(2026,10,9,8,0),calls=0,fail=false,ageMinutes=0;
const request=async()=>{
 calls++;
 if(fail)return {ok:false,status:503};
 const time=new Date(now+210*60000-ageMinutes*60000).toISOString().slice(0,16);
 return {ok:true,json:async()=>({current:{time,temperature_2m:18,cloud_cover:20,weather_code:0},
 daily:{time:[env.tehranClockParts(now).date],sunrise:[env.tehranClockParts(now).date+"T06:30"],sunset:[env.tehranClockParts(now).date+"T17:00"]}})};
};
const service=env.createTehranWeatherService({request,now:()=>now});
await service.refreshIfDue();
assert.equal(calls,1);
assert.equal(service.snapshot().status,"live");
now+=14*60000;await service.refreshIfDue();assert.equal(calls,1,"15m refresh interval");
now+=2*60000;fail=true;await service.refreshIfDue();
assert.equal(calls,2);assert.equal(service.snapshot().status,"live","failed poll preserves fresh cache");
now+=74*1000;await service.refreshIfDue();assert.equal(calls,2,"75s retry not early");
now+=2*1000;fail=false;ageMinutes=91;await service.refreshIfDue();
assert.equal(calls,3);assert.equal(service.snapshot().status,"live","rejected response preserves cached weather");
now+=46*60000;
assert.equal(service.snapshot().weather,null,"45m cached weather expires");
assert.equal(service.snapshot().status,"unavailable");
assert.equal(env.tehranClockParts(Date.UTC(2026,10,8,20,30)).label,"۰۰:۰۰");
console.log("TEHRAN-WEATHER-TIMING-OK");
