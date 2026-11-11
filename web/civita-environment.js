/* Civita di Bagnoregio — live local outdoor clock and model weather.
 * Open-Meteo data are MODEL estimates, not on-site sensors.
 * Europe/Rome handles CET/CEST daylight saving; the retired prior city's clock
 * must not be reused here.
 */
export const CIVITA_TIMEZONE='Europe/Rome';
export const CIVITA_WEATHER_SOURCE='Open-Meteo';
export const CIVITA_WEATHER_URL='https://api.open-meteo.com/v1/forecast?latitude=42.6277&longitude=12.1137&current=temperature_2m,weather_code,cloud_cover,precipitation,rain,snowfall,wind_speed_10m,is_day&daily=sunrise,sunset&forecast_days=1&timezone=Europe%2FRome&timeformat=unixtime';
const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:CIVITA_TIMEZONE,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const num=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
const clamp01=x=>Math.min(1,Math.max(0,x));
const fa=x=>String(x).replace(/[0-9]/g,c=>'۰۱۲۳۴۵۶۷۸۹'[Number(c)]);
export function civitaClockParts(epochMs=Date.now()){
 const fields=Object.fromEntries(formatter.formatToParts(new Date(epochMs)).map(x=>[x.type,x.value]));
 return {date:fields.year+'-'+fields.month+'-'+fields.day,hour:Number(fields.hour),minute:Number(fields.minute),
   label:fa(fields.hour+':'+fields.minute)};
}
const hourAt=epochMs=>{const x=civitaClockParts(epochMs);return x.hour+x.minute/60;};
export function parseCivitaWeather(json,epochMs=Date.now()){
 const c=json?.current,d=json?.daily;
 if(!c||!Number.isInteger(c.time)||num(c.temperature_2m)===null||num(c.cloud_cover)===null)
  throw new Error('Invalid Civita current-weather data');
 const observedAt=c.time*1000;
 if(Math.abs(epochMs-observedAt)>100*60000)throw new Error('Stale Civita weather reading');
 const clock=civitaClockParts(epochMs);
 const start=Array.isArray(d?.sunrise)&&Number.isInteger(d.sunrise[0])?d.sunrise[0]*1000:null;
 const end=Array.isArray(d?.sunset)&&Number.isInteger(d.sunset[0])?d.sunset[0]*1000:null;
 const dated=start!==null&&end!==null&&civitaClockParts(start).date===clock.date&&civitaClockParts(end).date===clock.date&&end>start;
 const code=num(c.weather_code),rain=Math.max(0,num(c.rain)??0),snow=Math.max(0,num(c.snowfall)??0),precipitation=Math.max(0,num(c.precipitation)??0);
 const snowing=snow>0||(precipitation>0&&code!==null&&([71,73,75,77,85,86].includes(code)));
 const raining=!snowing&&(rain>0||(precipitation>0&&code!==null&&((code>=51&&code<=67)||(code>=80&&code<=82)||code>=95)));
 return Object.freeze({temperature:c.temperature_2m,cloudCover:Math.max(0,Math.min(100,c.cloud_cover)),wind:num(c.wind_speed_10m),code,precipitation,
  precipitationType:snowing?'snow':raining?'rain':null,
  sunrise:dated?hourAt(start):null,sunset:dated?hourAt(end):null,
  observedAt,observedLocal:civitaClockParts(observedAt).label,day:clock.date,provider:'Open-Meteo model'});
}
export function civitaSkyAt(epochMs=Date.now(),weather=null){
 const clock=civitaClockParts(epochMs),h=clock.hour+clock.minute/60;
 const sunValid=weather?.day===clock.date&&Number.isFinite(weather.sunrise)&&Number.isFinite(weather.sunset)&&weather.sunset>weather.sunrise;
 const rise=sunValid?weather.sunrise:6.5,set=sunValid?weather.sunset:18.5;
 const sunAngle=Math.PI*(h-rise)/(set-rise);
 const day=h>=rise&&h<=set?clamp01(Math.sin(sunAngle)*2.15):0;
 const dusk=Math.max(clamp01(1-Math.abs(h-rise)/.8),clamp01(1-Math.abs(h-set)/.8));
 return {clock,sunAngle,day,dusk,cloudCover:weather?.cloudCover??null,solarSource:sunValid?'provider':'season-agnostic-fallback'};
}
export function createCivitaWeatherService({request=fetch,now=()=>Date.now()}={}){
 let data=null,lastFetchAt=0,nextAttempt=0,pending=null,failed=false;
 function snapshot(){
  const timestamp=now(),fresh=data&&timestamp-lastFetchAt<45*60000&&timestamp-data.observedAt<100*60000;
  const weather=fresh?data:null;
  return {status:weather?'live':failed?'unavailable':'loading',weather,sky:civitaSkyAt(timestamp,weather)};
 }
 function refreshIfDue(){
  if(pending)return pending;
  if(now()<nextAttempt)return Promise.resolve(snapshot());
  nextAttempt=now()+15*60000;
  pending=Promise.resolve().then(()=>request(CIVITA_WEATHER_URL,{cache:'no-store'}))
   .then(response=>{if(!response?.ok)throw new Error('Civita weather HTTP '+response?.status);return response.json();})
   .then(json=>{data=parseCivitaWeather(json,now());lastFetchAt=now();failed=false;return snapshot();})
   .catch(()=>{failed=true;nextAttempt=now()+75000;return snapshot();}).finally(()=>{pending=null;});
  return pending;
 }
 return {snapshot,refreshIfDue};
}
export function civitaWeatherLabel(snapshot){
 const local=snapshot.sky.clock.label,w=snapshot.weather;
 if(!w)return 'سیویتا دی بانیورجو · '+local+' (ایتالیا) · دادهٔ فعلی هوا در دسترس نیست';
 let condition='متغیر';
 if(w.precipitationType==='snow')condition='برفی';
 else if(w.precipitationType==='rain')condition='بارانی';
 else if(w.code===0)condition='صاف';
 else if(w.code!==null&&w.code<=3)condition='نیمه‌ابری';
 else if(w.code===45||w.code===48)condition='مه‌آلود';
 else if(w.cloudCover>=75)condition='ابری';
 return 'سیویتا دی بانیورجو · '+local+' (Europe/Rome) · '+fa(Math.round(w.temperature))+'°C · '+condition+
  ' · ابر '+fa(Math.round(w.cloudCover))+'٪ · مدل Open-Meteo '+w.observedLocal;
}
