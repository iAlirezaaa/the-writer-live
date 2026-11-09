// RDR-027: Persian catalog Unicode regression against the production normalizer.
// Run: node tests/test_reader_unicode_boundaries.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../web/read.js'), 'utf8');
const match = source.match(/^const searchKey\s*=\s*value\s*=>[^;]+;/m);
assert.ok(match, 'production searchKey must exist');
const key = vm.runInNewContext(match[0] + '\nsearchKey');
const equal = [
  ['کِتاب', 'کتاب'],
  ['ک\u0650\u064eتاب', 'ک\u064e\u0650تاب'],
  ['كـتاب', 'کتاب'],
  ['ﻛﺘﺎﺏ', 'کتاب'],
  ['عَلِي', 'علی'],
];
const distinct = [
  ['می‌روم', 'میروم'], // ZWNJ is intentionally significant, not silently stripped.
  ['کتاب خانه', 'کتابخانه'],
  ['کتاب', 'کتاب‌ها'],
  ['کتاب', 'دفتر'],
];
for (const [a, b] of equal) assert.equal(key(a), key(b), 'expected equivalent: ' + a + ' / ' + b);
for (const [a, b] of distinct) assert.notEqual(key(a), key(b), 'must remain distinct: ' + a + ' / ' + b);
assert.ok(source.includes('const query=searchKey('));
assert.ok(source.includes('searchKey(`\u0024{story.title||""} \u0024{story.stage||""}`)'));
console.log('PASS RDR-027: ' + equal.length + ' equivalences, ' + distinct.length + ' distinct pairs, 2 wiring checks');
