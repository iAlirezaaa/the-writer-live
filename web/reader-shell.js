import { openBook, setCloseTransition } from './book.js?v=reader-shell-20261113';
import { appHref } from './snapshot.js';
import { installPersianPresentation } from './persian-display.js';

const library = appHref('read/');
const error = document.getElementById('reader-error');
document.getElementById('reader-back').href = library;
installPersianPresentation(document.body);
setCloseTransition(async () => { location.replace(library); });

async function start() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { id = ''; }
  if (!id) { location.replace(library); return; }
  try { await openBook(id); }
  catch { error.hidden = false; }
}
window.addEventListener('hashchange', start);
window.addEventListener('writer:reading-error', () => { error.hidden = false; });
start();
