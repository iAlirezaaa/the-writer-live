import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const path=resolve(process.argv[2]||".","web/tehran-environment.js");
const mod=await import("data:text/javascript;base64,"+Buffer.from(readFileSync(path)).toString("base64"));
const epoch=Date.UTC(2026,10,8,16,30); // 20:00 Tehran, despite host/user timezone
assert.deepEqual(mod.tehranClockParts(epoch),{
 date:"2026-11-08",hour:20,minute:0,label:"۲۰:۰۰"});
assert.equal(mod.tehranSkyAt(Date.UTC(2026,10,8,9,0)).day>0,true);
assert.equal(mod.tehranSkyAt(epoch).day,0);
assert.equal(mod.tehranSkyAt(epoch).solarSource,"fallback");
assert.ok(mod.TEHRAN_WEATHER_URL.includes("timezone=Asia%2FTehran"));
assert.ok(mod.TEHRAN_WEATHER_URL.includes("latitude=35.6892"));
let clock=epoch,calls=0,success=true,mode="rain";
function response(){
 const stamp=new Date(clock+210*60000).toISOString().slice(0,16); // Tehran UTC+03:30
 return {current:{
  time:stamp,temperature_2m:13.6,cloud_cover:85,weather_code:mode==="snow"?73:61,
  precipitation:1,rain:mode==="snow"?0:1,snowfall:mode==="snow"?1:0,wind_speed_10m:11,is_day:0
 },daily:{time:["2026-11-08"],sunrise:["2026-11-08T06:31"],sunset:["2026-11-08T17:04"]}};
}
const request=()=>{calls++;return Promise.resolve({ok:success,json:async()=>response()});};
const service=mod.createTehranWeatherService({now:()=>clock,request});
assert.equal(service.snapshot().weather,null);
await Promise.all([service.refreshIfDue(),service.refreshIfDue()]);
assert.equal(calls,1,"Weather requests were not deduplicated");
assert.equal(service.snapshot().weather.precipitationType,"rain");
assert.equal(service.snapshot().sky.solarSource,"provider");
assert.match(mod.tehranWeatherLabel(service.snapshot()),/تهران/);
await service.refreshIfDue();assert.equal(calls,1,"No repeated polling during 15m cache");
clock+=16*60000;mode="snow";
await service.refreshIfDue();
assert.equal(service.snapshot().weather.precipitationType,"snow");
clock+=16*60000;success=false;await service.refreshIfDue();
assert.equal(service.snapshot().status,"live","Fresh cached weather can survive one failed poll");
clock+=46*60000;
assert.equal(service.snapshot().weather,null,"No fabricated data beyond maximum age");
assert.equal(service.snapshot().status,"unavailable");
assert.match(mod.tehranWeatherLabel(service.snapshot()),/در دسترس نیست/);
assert.equal(mod.tehranSkyAt(epoch).day,0,"Tehran night works offline");
console.log("TEHRAN-ENVIRONMENT-OK "+JSON.stringify({timeZone:mod.TEHRAN_TIMEZONE,weatherRequests:calls,weatherStates:["rain","snow","unavailable"],tehranClock:"۲۰:۰۰"}));
