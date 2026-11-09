// City-only static regression; run: node city/tests/tehran-weather-anchor.test.mjs
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const urban=readFileSync(new URL("../../web/urban-plan.js",import.meta.url),"utf8");
const weather=readFileSync(new URL("../../web/tehran-environment.js",import.meta.url),"utf8");
const anchor=urban.match(/latitude:\s*([\d.]+),longitude:\s*([\d.]+)/);
assert.ok(anchor,"WGS84 home anchor must be present");
const url=weather.match(/TEHRAN_WEATHER_URL\s*=\s*["'`](.*?)["'`]/);
assert.ok(url,"weather URL must be present");
const parsed=new URL(url[1]);
const lat=Number(parsed.searchParams.get("latitude"));
const lon=Number(parsed.searchParams.get("longitude"));
assert.ok(Number.isFinite(lat)&&Number.isFinite(lon),"weather coordinates must be finite");
assert.equal(lat,Number(anchor[1]),"weather latitude must match home");
assert.equal(lon,Number(anchor[2]),"weather longitude must match home");
assert.equal(parsed.searchParams.get("timezone"),"Asia/Tehran");
console.log("Tehran weather coordinates match home anchor");
