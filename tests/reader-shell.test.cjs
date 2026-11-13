const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
test('reader has no old shelf and closes straight to the 3D room', () => {
  const html = fs.readFileSync(path.join(root, 'web/read.html'), 'utf8');
  const controller = fs.readFileSync(path.join(root, 'web/reader-shell.js'), 'utf8');
  assert.match(html, /reader-shell\.js/);
  assert.doesNotMatch(html, /id="covers"|library-aisle|library-preview|\/web\/read\.js/);
  assert.match(controller, /setCloseTransition\(async \(\) => \{ location\.replace\(library\); \}\)/);
  assert.match(controller, /appHref\('read\/'\)/);
});
