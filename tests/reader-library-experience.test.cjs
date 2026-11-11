"use strict";
// The library is one bookcase: no list or grid switch, books sized by what they are, room for a hundred.
// Run: node --test tests/reader-library-experience.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const web = name => fs.readFileSync(path.join(__dirname, "../web", name), "utf8");
const source = web("read.js");
const capture = (rx, name) => {
  const hit = source.match(rx);
  assert.ok(hit, "missing production source: " + name);
  return hit[0];
};
const functions = ["isFavorite", "toggleFavorite", "updateFavoritesBadge", "toggleFavoritesFilter", "toggleLibraryTheme", "updateLibraryControls", "savedProgress", "minutesOf", "make", "bookShape", "paintFavorite", "makeCover", "renderShelf", "resetShelfFilters"];
const script = [
  capture(/^const STATUS = [^\n]+;/m, "status"),
  capture(/^const nfa = [^\n]+;/m, "Persian numbers"),
  capture(/^const searchKey = [^\n]+;/m, "Persian search"),
  capture(/^const favoriteKey = [^\n]+;/m, "favorite key"),
  "const $ = id => document.getElementById(id);",
  "const favoriteMemory = new Map();",
  "let stories = [];let favoritesOnly = false;let readingFilter = 'all';let libraryTheme = 'dark';",
  ...functions.map(name => capture(new RegExp("^function " + name + "\\([^\\n]*\\)\\s*\\{[\\s\\S]*?^\\}", "m"), name)),
  "return {setStories(data){stories=data;},isFavorite,toggleFavorite,renderShelf,resetShelfFilters,toggleFavoritesFilter,toggleLibraryTheme,makeCover,bookShape};",
].join("\n");

class Node {
  constructor(tag) { this.tag = tag; this.children = []; this.attributes = {}; this.handlers = {}; this.dataset = {}; this.value = ""; this.textContent = ""; this.hidden = false; this.className = ""; this.classList = { add: c => { this.className += " " + c; } }; this.style = { setProperty: (k, v) => { this.style[k] = v; } }; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  addEventListener(event, fn) { this.handlers[event] = fn; }
  focus() { this.focused = true; }
}
function fixture(data) {
  const ids = Object.fromEntries(["story-search", "story-status", "story-sort", "story-reset", "story-favorites", "reading-filter", "library-theme", "library-stories-count", "library-progress-count", "library-saved-count", "shelf-count", "covers"].map(id => [id, new Node("div")]));
  ids["story-status"].value = "all"; ids["story-sort"].value = "newest"; ids["reading-filter"].value = "all";
  const memory = new Map();
  const doc = { body: new Node("body"), getElementById: id => ids[id], createElement: tag => new Node(tag) };
  const storage = { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, String(v)), removeItem: k => memory.delete(k) };
  const api = new Function("document", "localStorage", "applyCoverVisual", "createCoverArt", "coverVisual", "openFromShelf", "paintRoom", script)(doc, storage, () => ({}), () => new Node("span"), () => ({ edition: "101" }), () => {}, () => {});
  api.setStories(data);
  return { ...api, ids, doc };
}
const library = n => Array.from({ length: n }, (_, i) => ({ id: "s" + i, title: "کتاب " + i, stage: "داستان", status: "accepted", created: "2026-11-0" + (1 + i % 9), words: 300 + i * 40 }));
const hasClass = (node, cls) => String(node.className).split(/\s+/).includes(cls);

test("a hundred books go on the shelf, some face-out", () => {
  const f = fixture(library(100));
  f.renderShelf();
  const cards = f.ids.covers.children;
  assert.equal(cards.length, 100);
  assert.ok(cards.every(c => hasClass(c, "shelf-book")));
  assert.equal(cards.filter(c => hasClass(c, "is-face")).length, 9);
});
test("thickness follows word count and stays on the shelf", () => {
  const f = fixture([]);
  assert.ok(f.bookShape({ id: "a", words: 9000 }, 1).thickness > f.bookShape({ id: "b", words: 300 }, 1).thickness);
  for (const words of [1, 400, 100000]) { const s = f.bookShape({ id: "c", words }, 1); assert.ok(s.thickness >= 26 && s.thickness <= 66); assert.ok(s.height > .7 && s.height <= 1); }
});
test("search, favourites and theme still work", () => {
  const f = fixture(library(5));
  f.ids["story-search"].value = "كتاب 3"; f.renderShelf();
  assert.equal(f.ids.covers.children.length, 1);
  f.resetShelfFilters(); f.toggleFavorite("s1"); f.toggleFavoritesFilter();
  assert.equal(f.ids.covers.children.length, 1);
  assert.equal(f.ids["story-favorites"].attributes["aria-pressed"], "true");
  f.toggleLibraryTheme(); assert.equal(f.doc.body.dataset.libraryTheme, "light");
});
test("only one way of showing the library remains", () => {
  const html = web("read.html");
  for (const gone of ["library-list", "library-grid", "library-shelf", "reader-shelf.css", "reader-final.css"]) assert.ok(!html.includes(gone), "still present: " + gone);
  assert.ok(!source.includes("setLibraryView"));
  assert.ok(!source.includes("reader-shelf-room"));
  for (const id of ["story-search", "story-status", "story-sort", "reading-filter", "story-favorites", "library-theme", "shelf-talker", "covers"]) assert.ok(html.includes('id="' + id + '"'), "missing " + id);
  assert.match(html, /id="library-saved-count"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
  assert.match(source, /prepareReader/); assert.match(source, /playOpen/); assert.match(source, /playClose/);
  assert.match(web("library.css"), /prefers-reduced-motion/); assert.match(web("reader-room.css"), /prefers-reduced-motion/);
});
test("the preview of a full case stays off public hosts", () => {
  assert.match(source, /\["127\.0\.0\.1","localhost"\]\.includes\(location\.hostname\)/);
});
