import assert from 'node:assert/strict';
import {test} from 'node:test';
import {CIVITA_TIMEZONE,CIVITA_WEATHER_URL,civitaClockParts,civitaSkyAt,parseCivitaWeather,createCivitaWeatherService,civitaWeatherLabel} from '../../web/civita-environment.js';
const date=Date.parse('2026-11-10T12:00:00Z'),summer=Date.parse('2026-07-10T12:00:00Z');
const dataset={
 current:{time:date/1000,temperature_2m:12.4,cloud_cover:81,weather_code:3,precipitation:0,rain:0,snowfall:0,wind_speed_10m:3},
 daily:{sunrise:[Date.parse('2026-11-10T06:00:00Z')/1000],sunset:[Date.parse('2026-11-10T16:00:00Z')/1000]}
};
test('Italian clock handles CET and CEST rather than Tehran/user clocks',()=>{
 assert.equal(CIVITA_TIMEZONE,'Europe/Rome');
 assert.equal(civitaClockParts(date).hour,13);
 assert.equal(civitaClockParts(summer).hour,14);
 assert.match(CIVITA_WEATHER_URL,/latitude=42\.6277&longitude=12\.1137/);
 assert.match(CIVITA_WEATHER_URL,/timezone=Europe%2FRome/);
});
test('model sunrise sunset timestamps resolve in local Rome wall time',()=>{
 const w=parseCivitaWeather(dataset,date);
 assert.equal(w.sunrise,7);assert.equal(w.sunset,17);
 assert.equal(w.day,'2026-11-10');assert.equal(w.precipitationType,null);
 assert.equal(w.cloudCover,81);
 assert.ok(civitaSkyAt(date,w).day>0);
 const night=Date.parse('2026-11-10T22:00:00Z');
 assert.equal(civitaSkyAt(night,w).day,0);
});
test('unavailable and malformed data never invent a live forecast',async()=>{
 assert.throws(()=>parseCivitaWeather({...dataset,current:{...dataset.current,time:1}},date));
 assert.throws(()=>parseCivitaWeather({current:{time:date/1000,temperature_2m:null}},date));
 const svc=createCivitaWeatherService({request:async()=>{throw new Error('offline');},now:()=>date});
 const state=await svc.refreshIfDue();
 assert.equal(state.status,'unavailable');assert.equal(state.weather,null);
 assert.match(civitaWeatherLabel(state),/در دسترس نیست/);
});
test('valid live weather appears with attribution and clock',async()=>{
 const svc=createCivitaWeatherService({request:async()=>({ok:true,json:async()=>dataset}),now:()=>date});
 const result=await svc.refreshIfDue();
 assert.equal(result.status,'live');assert.equal(result.weather.temperature,12.4);
 assert.match(civitaWeatherLabel(result),/Open-Meteo/);
 assert.ok(result.sky.day>0);
});
