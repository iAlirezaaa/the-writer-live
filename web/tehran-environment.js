/* Municipal environment only — real Tehran clock and current model weather.
 * No writer/citizen/publisher clock or stored data is modified.
 * Open-Meteo free endpoint: non-commercial use only; show attribution.
 */
export const TEHRAN_TIMEZONE="Asia/Tehran";
export const TEHRAN_WEATHER_SOURCE="Open-Meteo";
export const TEHRAN_WEATHER_URL="https://api.open-meteo.com/v1/forecast?latitude=35.6892&longitude=51.3890&current=temperature_2m,weather_code,cloud_cover,precipitation,rain,snowfall,wind_speed_10m,is_day&daily=sunrise,sunset&forecast_days=1&timezone=Asia%2FTehran";
const timeFmt=new Intl.DateTimeFormat("en-GB",{
 timeZone:TEHRAN_TIMEZONE,hourCycle:"h23",
 year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"
});
const number=(x)=>typeof x==="number"&&Number.isFinite(x)?x:null;
const clamp=(v)=>Math.max(0,Math.min(1,v));
const fa=(v)=>String(v).replace(/[0-9]/g,c=>"۰۱۲۳۴۵۶۷۸۹"[Number(c)]);
const hour=(s)=>{const m=String(s||"").match(/T(\d{2}):(\d{2})/);return m?Number(m[1])+Number(m[2])/60:null;};
export function tehranClockParts(epochMs=Date.now()){
 const p=Object.fromEntries(timeFmt.formatToParts(new Date(epochMs)).map(x=>[x.type,x.value]));
 return {date:p.year+"-"+p.month+"-"+p.day,hour:Number(p.hour),
   minute:Number(p.minute),label:fa(p.hour+":"+p.minute)};
}
function parseWeather(json,epochMs){
 const c=json?.current,day=json?.daily;
 if(!c||number(c.temperature_2m)===null||number(c.cloud_cover)===null
   ||!(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/).test(c.time||""))
   throw new Error("Invalid Tehran weather response");
 const stamp=c.time.match(/(?:Z|[+-]\d\d:\d\d)$/)?c.time:c.time+"+03:30";
 const observed=Date.parse(stamp);
 if(!Number.isFinite(observed)||Math.abs(epochMs-observed)>90*60000)
   throw new Error("Current Tehran weather is outdated");
 const clock=tehranClockParts(epochMs);
 const sameDate=day?.time?.[0]===clock.date;
 const sunrise=sameDate?hour(day?.sunrise?.[0]):null;
 const sunset=sameDate?hour(day?.sunset?.[0]):null;
 const code=number(c.weather_code);
 const rain=Math.max(0,number(c.rain)??0);
 const snow=Math.max(0,number(c.snowfall)??0);
 const precipitation=Math.max(0,number(c.precipitation)??0);
 const snowing=snow>0 || (precipitation>0 && code!==null && (code>=71&&code<=77||code===85||code===86));
 const raining=!snowing && (rain>0 ||
  (precipitation>0&&code!==null&&(code>=51&&code<=67||code>=80&&code<=82||code>=95)));
 return Object.freeze({
   temperature:c.temperature_2m,cloudCover:Math.max(0,Math.min(100,c.cloud_cover)),
   wind:number(c.wind_speed_10m),code,precipitation,
   precipitationType:snowing?"snow":raining?"rain":null,
   sunrise:sunrise!==null&&sunset!==null&&sunset>sunrise?sunrise:null,
   sunset:sunrise!==null&&sunset!==null&&sunset>sunrise?sunset:null,
   observedAt:observed,observedLocal:c.time,day:clock.date
 });
}
export function tehranSkyAt(epochMs=Date.now(),weather=null){
 const clock=tehranClockParts(epochMs);
 const h=clock.hour+clock.minute/60;
 const hasSun=weather?.day===clock.date && Number.isFinite(weather?.sunrise)&&Number.isFinite(weather?.sunset);
 const rise=hasSun?weather.sunrise:6, set=hasSun?weather.sunset:18;
 const angle=Math.PI*(h-rise)/(set-rise);
 const solarHeight=Math.sin(angle);
 const daylight=h>=rise&&h<=set?clamp(solarHeight*2.1):0;
 const dawn=clamp(1-Math.abs(h-rise)/.75);
 const twilight=clamp(1-Math.abs(h-set)/.75);
 return {clock,sunAngle:angle,day:daylight,dusk:Math.max(dawn,twilight),
   cloudCover:weather?.cloudCover??null,
   solarSource:hasSun?"provider":"fallback"};
}
export function createTehranWeatherService({request=fetch,now=()=>Date.now()}={}){
 let current=null,lastFetchAt=0,nextAttempt=0,pending=null,failed=false;
 function snapshot(){
   const timestamp=now();
   const fresh=current&&timestamp-lastFetchAt<45*60000
     &&timestamp-current.observedAt<100*60000;
   const weather=fresh?current:null;
   return {status:weather?"live":failed?"unavailable":"loading",
     weather,sky:tehranSkyAt(timestamp,weather)};
 }
 function refreshIfDue(){
   if(pending)return pending;
   const timestamp=now();
   if(timestamp<nextAttempt)return Promise.resolve(snapshot());
   nextAttempt=timestamp+15*60000;
   pending=Promise.resolve().then(()=>request(TEHRAN_WEATHER_URL,{cache:"no-store"}))
     .then(response=>{
       if(!response?.ok)throw new Error("Tehran weather HTTP "+response?.status);
       return response.json();
     }).then(json=>{
       current=parseWeather(json,now());lastFetchAt=now();failed=false;
       return snapshot();
     }).catch(()=>{
       failed=true;nextAttempt=now()+75*1000;
       return snapshot();
     }).finally(()=>{pending=null;});
   return pending;
 }
 return {snapshot,refreshIfDue};
}
export function tehranWeatherLabel(snapshot){
 const clock=snapshot.sky.clock.label;
 const weather=snapshot.weather;
 if(!weather)return "تهران · "+clock+" · اطلاعات زندهٔ هوا در دسترس نیست";
 const code=weather.code;
 let condition="آب‌وهوا";
 if(weather.precipitationType==="snow")condition="برفی";
 else if(weather.precipitationType==="rain")condition="بارانی";
 else if(code===0)condition="صاف";
 else if(code!==null && code<=3)condition="نیمه‌ابری";
 else if(code===45||code===48)condition="مه‌آلود";
 else if(code!==null && code>=71&&code<=77)condition="احتمال برف";
 else if(code!==null&&code>=95)condition="رعدوبرق";
 else if(weather.cloudCover>=75)condition="ابری";
 else condition="متغیر";
 return "تهران · "+clock+" · "+fa(Math.round(weather.temperature))+"°C · "+
   condition+" · ابر "+fa(Math.round(weather.cloudCover))+"٪ · به‌روزرسانی "+
   fa(weather.observedLocal.slice(11,16));
}
