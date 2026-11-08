/* Observer v1 contract: no network, no browser globals.
 * Node: node tests/observatory_probe.mjs <root>
 */
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";

const root=resolve(process.argv[2]||".");
const text=path=>readFileSync(resolve(root,path),"utf8");
const load=source=>import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
const dates=await load(text("web/persian-display.js"));
assert.equal(dates.solarDate("2026-11-08"),"۱۷ آبان ۱۴۰۵");
assert.equal(dates.solarDate("2026-03-20"),"۲۹ اسفند ۱۴۰۴");
assert.equal(dates.solarDate("2026-03-21"),"۱ فروردین ۱۴۰۵");
assert.equal(dates.solarDate("2026-11-08",{short:true}),"۱۴۰۵/۰۸/۱۷");
assert.equal(dates.persianDigits(90715.2),"۹۰۷۱۵.۲");
assert.equal(dates.solarDateTime("2026-11-08T15:32:00+03:30"),"۱۷ آبان ۱۴۰۵، ساعت ۱۵:۳۲");
assert.equal(dates.displayText("امتیاز 78 · 2026-11-08T15:32:00+03:30"),
  "امتیاز ۷۸ · ۱۷ آبان ۱۴۰۵، ساعت ۱۵:۳۲");
assert.equal(dates.displayText("2026-09-31"),"۲۰۲۶-۰۹-۳۱",
  "Invalid source dates must not turn into fabricated Jalali dates");
assert.equal(dates.displayText("2026-11-08"),"۱۷ آبان ۱۴۰۵");
assert.equal(dates.displayText(dates.displayText("2026-11-08")), "۱۷ آبان ۱۴۰۵",
  "Formatting must be idempotent");
assert.equal(dates.solarParts(2026,2,30),null);
const model={story_id:"205",created:"2026-11-08T15:32:00+03:30",words:1742};
const snapshot=JSON.stringify(model);
dates.displayText(model.created);dates.persianDigits(model.words);
assert.equal(JSON.stringify(model),snapshot,
  "Visual-only formatting must never alter API/storage identifiers or dates");

const ui=text("web/observer-ui.js");
const html=text(existsSync(resolve(root,"index.html"))?"index.html":"web/index.html");
const css=text("web/observer.css");
const world=text("web/world.js");
const actions=text("web/read.js");
const script=ui.replace(/^import .*;$/gm,"").replace(/^export /gm,"");
const data=new Function(script+"; return {PANEL_GROUPS,PANEL_CONTEXT,VIEW_CONTEXT,SCENE_GROUPS};")();
const tabs=[...html.matchAll(/data-panel="([^"]+)"/g)].map(m=>m[1]);
const views=[...html.matchAll(/data-view="([^"]+)"/g)].map(m=>m[1]);
const menu=data.PANEL_GROUPS.flatMap(g=>g.ids);
const scene=data.SCENE_GROUPS.flatMap(g=>g.ids);
assert.equal(tabs.length,15,"Keep all 15 original journal menus");
assert.equal(views.length,10,"Keep all 10 original camera views");
assert.ok(/href="(?:\.\/read\/|\/read)"/.test(html),
  "Reader destination must have a correctly quoted local or public href");
assert.ok(!/href="\.\/read\/>/.test(html),
  "A malformed public reader href would silently break navigation");
assert.deepEqual([...menu].sort(),[...tabs].sort());
assert.deepEqual([...scene].sort(),[...views].sort());
assert.equal(new Set(menu).size,15);
assert.equal(new Set(scene).size,10);
for(const id of menu){
  assert.ok(data.PANEL_CONTEXT[id]?.view,"Every journal panel must link to a place in the 3D world");
  assert.ok(views.includes(data.PANEL_CONTEXT[id].view));
  assert.ok(html.includes('id="'+id+'"'),"Corresponding pane missing: "+id);
}
for(const id of views){
  assert.ok(data.VIEW_CONTEXT[id]?.panel);
  assert.ok(tabs.includes(data.VIEW_CONTEXT[id].panel));
}
assert.ok(html.includes('id="observer-theme"'));
for(const option of ["auto","light","dark"])assert.ok(html.includes('value="'+option+'"'));
assert.ok(html.includes('id="observer-watch"'));
assert.ok(ui.includes('buttons.setAttribute("role","tablist")'),
  "Grouped observer menu must expose semantic tablists");
assert.ok(ui.includes('pane.setAttribute("role","tabpanel")'),
  "Every corresponding panel needs an accessible tabpanel role");
assert.ok(ui.includes('event.key==="ArrowRight"')&&ui.includes('event.key==="ArrowLeft"'),
  "RTL tab groups need arrow-key access");
assert.ok(html.includes('id="scene-data-link"'));
assert.ok(html.includes('id="panel-scene-link"'));
assert.ok(css.includes("body.app.side-collapsed .side{display:none;}"));
assert.ok(css.includes("@media(max-width:670px)"));
assert.ok(css.includes('body.app[data-observer-theme="light"]'));
assert.ok(css.includes('body.app[data-observer-theme="dark"]'));
assert.ok(world.includes("All fifteen sections remain accessible in the PUBLIC interface"));
for(const page of ["p-books","p-world","p-publish"]){
  assert.ok(world.includes('const withPublicData=new Set([') &&
    world.includes('"'+page+'"'),
    "Public connected panel missing: "+page);
}
assert.ok(world.includes("renderPublicObserverPanels(null)"),
  "Owner-only public uploads must be replaced immediately before async requests");
assert.ok(world.includes("renderPublicObserverPanels(payload)"),
  "The public publisher/atlas pages must be refreshed with safe town data");
assert.ok(world.includes('public_proxy')||world.includes('publicPublisher'),
  "Public publisher view must not require the private publisher ledger");
assert.ok(css.includes("observer-safe-action"),
  "Linked public panels must have styled, keyboard-reachable actions");
assert.ok(html.includes('href="./read/"')||html.includes('href="/read"'),
  "Public/privately mounted book link must have a complete quoted href");
assert.ok(!html.includes('href="./read/>'),
  "Reject accidentally truncated read href caused by URL rewrite");
assert.ok(html.includes("city-world-20261108-v6"),
  "New world module URL should invalidate old public UI cache");
assert.ok(world.includes("solarDate(String(e.at).slice(0, 10))"));
assert.ok(world.includes("observerUI=initObserverUI("));
assert.ok(actions.includes("installPersianPresentation(document.body)"));
assert.ok(ui.includes("installPersianPresentation(document.body)"));
console.log("OBSERVATORY-OK",JSON.stringify({
  tabs:tabs.length,views:views.length,
  groupedMenuSections:data.PANEL_GROUPS.length,
  display:"solar-hijri",privateTimestamps:"untouched",
  themes:["auto","light","dark"]
}));
