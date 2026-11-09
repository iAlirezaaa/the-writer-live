// RDR-032: source-linked Unicode normalization boundary checks.
// Run: node tests/test_reader_unicode_controls.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../web/read.js'), 'utf8');
const match = source.match(/^const searchKey\s*=\s*value\s*=>[^;]+;/m);
assert.ok(match, 'production searchKey must exist');
const searchKey = vm.runInNewContext(match[0] + '\nsearchKey');
const equivalent = [
  ['کِتاب', 'ک\u0650تاب'],
  ['عَلِي', 'علی'],
  ['ﻛﺘﺎﺏ', 'کتاب'],
  ['کـتاب', 'کتاب'],
];
const distinct = [
  ['می‌روم', 'میروم'], // ZWNJ remains significant.
  ['کتاب\u200d', 'کتاب'], // ZWJ remains significant.
  ['کتاب\ufe0f', 'کتاب'], // Variation selector remains significant.
  ['کتاب خانه', 'کتابخانه'],
];
for (const [a, b] of equivalent) assert.equal(searchKey(a), searchKey(b), 'expected equivalent');
for (const [a, b] of distinct) assert.notEqual(searchKey(a), searchKey(b), 'must remain distinct');
assert.ok(source.includes('const query=searchKey('), 'query must use production normalizer');
assert.ok(source.includes('searchKey(`'), 'catalog metadata must use production normalizer');
console.log('PASS RDR-032: 4 equivalences, 4 distinct pairs, 2 wiring checks');
