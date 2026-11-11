"use strict";
// Keyboard and focus continuity of the live bookcase, independent of story data.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../web/read.js"), "utf8");
const names = ["rememberShelfFocus", "restoreShelfFocus", "onShelfKeydown"];
const functions = names.map(name => {
  const match = source.match(new RegExp("^function " + name + "\\([^\\n]*\\)\\s*\\{[\\s\\S]*?^\\}", "m"));
  assert.ok(match, "missing production function: " + name);
  return match[0];
}).join("\n");

function fixture(keys = ["a", "b", "c"]) {
  const document = { body: {}, activeElement: null };
  document.activeElement = document.body;
  let books = [];
  const fallback = { focus() { document.activeElement = this; } };
  const shelf = { querySelectorAll() { return books; } };
  const $ = id => id === "covers" ? shelf : fallback;
  const api = new Function("document", "$", "let shelfFocus=null;\n" + functions + "\nreturn {" + names.join(",") + "};")(document, $);
  function makeBook(key, index) {
    const book = { dataset: { key }, isConnected: true, offsetLeft: 400 - index * 50, offsetTop: 0, offsetWidth: 40 };
    book.cover = { tabIndex: -1, closest() { return book; }, focus() { document.activeElement = this; } };
    book.favorite = { clicks: 0, closest() { return book; }, click() { this.clicks++; } };
    book.querySelector = selector => selector === ".cover" ? book.cover : book.favorite;
    return book;
  }
  function replace(keys) {
    const lost = books.some(book => document.activeElement === book.cover || document.activeElement === book.favorite);
    books.forEach(book => { book.isConnected = false; });
    if (lost) document.activeElement = document.body;
    books = keys.map(makeBook);
  }
  function focus(index) {
    books[index].cover.focus();
    api.rememberShelfFocus(books[index]);
  }
  function key(key, extra = {}) {
    const event = { key, target: document.activeElement, prevented: false, preventDefault() { this.prevented = true; }, ...extra };
    api.onShelfKeydown(event);
    return event;
  }
  replace(keys);
  api.restoreShelfFocus();
  return { ...api, document, fallback, get books() { return books; }, replace, focus, key };
}

test("pointing to a different book and using RTL arrows keeps exactly one tab stop", () => {
  const f = fixture();
  f.focus(1);
  assert.equal(f.key("ArrowLeft").prevented, true);
  assert.equal(f.document.activeElement, f.books[2].cover);
  assert.deepEqual(f.books.map(book => book.cover.tabIndex), [-1, -1, 0]);
  f.key("ArrowRight");
  assert.equal(f.document.activeElement, f.books[1].cover);
  assert.deepEqual(f.books.map(book => book.cover.tabIndex), [-1, 0, -1]);
});

test("arrows at bookcase boundaries do not scroll the page", () => {
  const f = fixture();
  f.focus(0);
  for (const key of ["ArrowRight", "ArrowUp", "Home"]) {
    assert.equal(f.key(key).prevented, true, key);
    assert.equal(f.document.activeElement, f.books[0].cover);
  }
  f.key("End");
  assert.equal(f.document.activeElement, f.books[2].cover);
  assert.equal(f.key("ArrowLeft").prevented, true);
  assert.equal(f.key("ArrowDown").prevented, true);
  assert.equal(f.document.activeElement, f.books[2].cover);
});

test("vertical arrows use the nearest row and book centre, including fractional layout offsets", () => {
  const f = fixture(["a", "b", "c", "d"]);
  Object.assign(f.books[0], { offsetLeft: 300, offsetWidth: 120, offsetTop: 0 });
  Object.assign(f.books[1], { offsetLeft: 320, offsetWidth: 40, offsetTop: 200 });
  Object.assign(f.books[2], { offsetLeft: 360, offsetWidth: 40, offsetTop: 200.5 });
  Object.assign(f.books[3], { offsetLeft: 350, offsetWidth: 40, offsetTop: 400 });
  f.focus(0);
  f.key("ArrowDown");
  assert.equal(f.document.activeElement, f.books[1].cover);
  f.key("ArrowDown");
  assert.equal(f.document.activeElement, f.books[3].cover);
  f.key("ArrowUp");
  assert.equal(f.document.activeElement, f.books[2].cover);
});

test("favorite shortcut does not intercept browser shortcuts or repeat-toggle a held key", () => {
  const f = fixture();
  f.focus(0);
  assert.equal(f.key("f", { ctrlKey: true }).prevented, false);
  assert.equal(f.key("f", { metaKey: true }).prevented, false);
  assert.equal(f.books[0].favorite.clicks, 0);
  assert.equal(f.key("F").prevented, true);
  assert.equal(f.books[0].favorite.clicks, 1);
  assert.equal(f.key("f", { repeat: true }).prevented, true);
  assert.equal(f.books[0].favorite.clicks, 1);
  f.key("ب");
  assert.equal(f.books[0].favorite.clicks, 2);
});

test("rerendering the focused book restores its new DOM node", () => {
  const f = fixture();
  f.focus(1);
  const old = f.books[1].cover;
  f.replace(["c", "a", "b"]);
  f.restoreShelfFocus();
  assert.notEqual(f.document.activeElement, old);
  assert.equal(f.document.activeElement, f.books[2].cover);
  assert.deepEqual(f.books.map(book => book.cover.tabIndex), [-1, -1, 0]);
});

test("removing a focused favorite continues at its old index, or the previous last book", () => {
  const f = fixture();
  f.focus(1);
  f.replace(["a", "c"]);
  f.restoreShelfFocus();
  assert.equal(f.document.activeElement, f.books[1].cover);
  f.replace(["a"]);
  f.restoreShelfFocus();
  assert.equal(f.document.activeElement, f.books[0].cover);
});

test("removing the final favorite restores a surviving filter control", () => {
  const f = fixture(["a"]);
  f.focus(0);
  f.replace([]);
  f.restoreShelfFocus();
  assert.equal(f.document.activeElement, f.fallback);
});

test("search and filter rerenders keep focus on their controls", () => {
  const f = fixture();
  f.focus(1);
  const search = {};
  f.document.activeElement = search;
  f.replace(["b", "c"]);
  f.restoreShelfFocus();
  assert.equal(f.document.activeElement, search);
  assert.deepEqual(f.books.map(book => book.cover.tabIndex), [0, -1]);
  f.replace([]);
  f.restoreShelfFocus();
  assert.equal(f.document.activeElement, search);
});

test("closing the reader can restore the source book even after sorting", () => {
  const f = fixture();
  f.focus(1);
  f.document.activeElement = {};
  f.replace(["c", "b", "a"]);
  f.restoreShelfFocus({ focus: true, key: "b" });
  assert.equal(f.document.activeElement, f.books[1].cover);
  assert.deepEqual(f.books.map(book => book.cover.tabIndex), [-1, 0, -1]);
});
