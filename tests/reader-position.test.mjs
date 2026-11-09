import test from "node:test";
import assert from "node:assert/strict";
import { pageAnchor, locatePageByAnchor } from "../web/reader-position.js";

const original = [
  { kind: "title", firstPara: 0, firstWord: 0 },
  { kind: "body", firstPara: 0, firstWord: 0 },
  { kind: "body", firstPara: 0, firstWord: 50 },
  { kind: "body", firstPara: 1, firstWord: 0 },
  { kind: "report", firstPara: 0, firstWord: 0 },
  { kind: "blank" },
];

test("captures word offset when paragraph spans pages", () => {
  assert.deepEqual(pageAnchor(original[2]), { kind: "body", firstPara: 0, firstWord: 50 });
});

test("restores closest prior word even when page breaks move", () => {
  const reflowed = [original[0], original[1], { kind: "body", firstPara: 0, firstWord: 35 },
    { kind: "body", firstPara: 0, firstWord: 70 }, original[3], original[4]];
  assert.equal(locatePageByAnchor(reflowed, pageAnchor(original[2]), 1), 2);
});

test("aligns to start of RTL two-page spread", () => {
  assert.equal(locatePageByAnchor(original, pageAnchor(original[3]), 2), 2);
});

test("preserves report anchors separate from body", () => {
  assert.equal(locatePageByAnchor(original, { kind: "report", firstPara: 0, firstWord: 0 }), 4);
});

test("rejects malformed anchors and handles omitted historical word offset", () => {
  assert.equal(locatePageByAnchor(original, { kind: "script", firstPara: 20 }), 0);
  assert.equal(locatePageByAnchor(original, { kind: "body", firstPara: 0 }), 1);
  assert.equal(locatePageByAnchor([], { kind: "body", firstPara: 0 }), 0);
  assert.equal(pageAnchor({ kind: "blank" }), null);
});

test("removed critique falls back to last story page", () => {
  assert.equal(locatePageByAnchor(original.slice(0, 4), { kind: "report", firstPara: 2, firstWord: 0 }), 3);
});
