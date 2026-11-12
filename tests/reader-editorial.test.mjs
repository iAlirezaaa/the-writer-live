import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {readerEditorial} from "../web/reader-editorial.js";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const cases=[{"id":"0003","title":"نامی که از پل برگشت","status":"accepted","fragments":["سه دایره‌ی مسی کوچک","کابل پاره شد."]},{"id":"0005","title":"کوچه‌ی بازگشت","status":"accepted","fragments":["اگر نامی برگشت، سنگی روشن می‌شود","کوچه‌ی بازگشت."]},{"id":"owner-20261110-jaye-doxt","title":"جای دوخت","status":"owner_shared","fragments":["درزِ زیرِ بغلِ کت باز شد","تکهٔ خاکستری"]}];
test("three already-published works have story-grounded original introductions",()=>{
  for(const sample of cases){
    const body="# "+sample.title+"\n\n"+sample.fragments.join("\n\n");
    const source={id:sample.id,title:sample.title,status:sample.status,body};
    const editorial=readerEditorial(source);
    assert.ok(editorial,sample.id);
    assert.ok(editorial.summary.length>=80);
    assert.ok(editorial.alt.length>=25);
    assert.match(editorial.image,/^[a-z0-9-]+\.svg$/);
    assert.equal(readerEditorial({...source,status:"rejected"}),null);
    assert.equal(readerEditorial({...source,title:"changed title"}),null);
    assert.equal(readerEditorial({...source,body:"unrelated edition"}),null);
    assert.equal(readerEditorial({...source,body:null}),null);
    const svg=fs.readFileSync(path.join(root,"web/reader-illustrations",editorial.image),"utf8");
    assert.match(svg,/<svg\b/);
    assert.match(svg,/viewBox="0 0 480 280"/);
    assert.doesNotMatch(svg,/<script|onload=|<image\b|<foreignObject\b|href="http/i);
    assert.ok(Buffer.byteLength(svg)<10000,"art remains lightweight");
  }
  assert.equal(readerEditorial({id:"private-draft",title:"unknown",body:"text",status:"accepted"}),null);
});
test("editorial page is separate from the unchanged original story body",()=>{
  const source=fs.readFileSync(path.join(root,"web/book.js"),"utf8");
  assert.match(source,/const introduction=editorialPage\(\)/);
  assert.match(source,/\[titlePage\(\), \.\.\.\(introduction\?\[introduction\]:\[\]\), \.\.\.paginate\(text, "body"\)\]/);
  assert.match(source,/image\.loading="lazy"/);
  assert.match(source,/image\.alt=editorial\.alt/);
  assert.match(source,/image\.src=appHref\(/);
  assert.match(source,/kind:"title",firstPara:1,firstWord:0/);
  assert.match(source,/book\.story\.body\.replace/);
});
