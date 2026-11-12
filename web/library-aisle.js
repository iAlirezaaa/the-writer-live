/* A single real catalog, arranged as adjoining bookcases. DOM book identity and
   reader source geometry are preserved; no synthetic books enter this module. */
const number = value => new Intl.NumberFormat('fa-IR').format(value);

export function packBooks(widths, available, rows = 3, gap = 5) {
  if (!Number.isFinite(available) || available <= 0 || !Number.isInteger(rows) || rows < 1 || !Number.isFinite(gap) || gap < 0) {
    throw new RangeError('Invalid shelf dimensions');
  }
  let cabinet = 0, row = 0, used = 0;
  const placements = widths.map((width, index) => {
    if (!Number.isFinite(width) || width <= 0 || width > available) throw new RangeError('Book cannot fit shelf');
    const spacing = used ? gap : 0;
    if (used + spacing + width > available + .01) {
      used = 0;
      if (++row === rows) { row = 0; cabinet++; }
    }
    const x = used ? used + gap : 0;
    used = x + width;
    return {index, cabinet, row, x, width};
  });
  return {placements, count: widths.length ? cabinet + 1 : 1};
}

export function installLibraryAisle() {
  const shelf = document.getElementById('covers'), viewport = shelf?.closest('.case');
  if (!shelf || !viewport || document.body.dataset.libraryLayout !== 'aisles' || shelf.dataset.aisleMounted) return;
  shelf.dataset.aisleMounted = 'true';
  const previous = document.getElementById('aisle-prev'), next = document.getElementById('aisle-next');
  const status = document.getElementById('aisle-status'), hint = document.getElementById('aisle-hint');
  let count = 1, active = 0, stride = 1, frame = 0, width = 0, pendingKey = null;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const node = (tag, cls, text) => {
    const element = document.createElement(tag); element.className = cls;
    if (text != null) element.textContent = text;
    return element;
  };
  function announce() {
    active = Math.max(0, Math.min(count - 1, Math.round(Math.abs(viewport.scrollLeft) / stride)));
    if (previous) previous.disabled = active === 0;
    if (next) next.disabled = active === count - 1;
    if (status) status.textContent = `قفسهٔ ${number(active + 1)} از ${number(count)}`;
    if (hint) hint.textContent = count > 1 ? 'برای گشتن در کتابخانه، قفسه‌ها را به طرفین بکشید.' : 'با پر شدن این قفسه، قفسهٔ بعدی کنار آن ساخته می‌شود.';
    viewport.dataset.activeCabinet = String(active);
  }
  function go(index, smooth = true) {
    viewport.scrollTo({left: -Math.max(0, Math.min(count - 1, index)) * stride, behavior: smooth && !reduced() ? 'smooth' : 'instant'});
    if (!smooth || reduced()) announce();
  }
  function arrange() {
    const books = [...shelf.querySelectorAll('.shelf-book')];
    const selected = pendingKey || document.activeElement?.closest('.shelf-book')?.dataset.key;
    pendingKey = null;
    const old = active;
    const containerWidth = viewport.clientWidth;
    if (!containerWidth) return;
    const cabinetWidth = Math.min(608, Math.max(220, containerWidth - 36));
    const inset = 24, top = 48, gap = 24, rows = 3;
    const rowHeight = parseFloat(getComputedStyle(shelf).getPropertyValue('--row-h')) || 160;
    const plank = 18;
    const measured = books.map(book => book.offsetWidth);
    // Compact CSS already fits the narrowest supported viewport; retain a safe
    // native fallback rather than losing the catalog if an extension changes it.
    if (measured.some(w => w <= 0 || w > cabinetWidth - inset * 2)) return;
    const plan = packBooks(measured, cabinetWidth - inset * 2, rows);
    count = plan.count; stride = cabinetWidth + gap;
    const visibleRows = Math.max(2, plan.placements.reduce((max, p) => Math.max(max, p.row + 1), 0));
    const height = top + visibleRows * (rowHeight + plank) + 18;
    const end = Math.max(0, (containerWidth - cabinetWidth) / 2);
    const total = cabinetWidth * count + gap * (count - 1) + end * 2;
    const scrollWidthChanged = width !== containerWidth;
    width = containerWidth;
    shelf.querySelectorAll('.aisle-cabinet,.shelf-ghost,.shelf-plaque,.shelf-object').forEach(n => n.remove());
    shelf.style.width = total + 'px'; shelf.style.height = height + 'px';
    shelf.dataset.cabinetCount = String(count);
    shelf.classList.add('is-aisle-layout');
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const cabinet = node('div', 'aisle-cabinet'); cabinet.setAttribute('aria-hidden', 'true');
      cabinet.style.left = total - end - cabinetWidth - i * stride + 'px';
      cabinet.style.width = cabinetWidth + 'px'; cabinet.style.height = height + 'px';
      const label = node('div', 'aisle-label');
      const used = plan.placements.filter(p => p.cabinet === i).length;
      label.append(node('span', 'aisle-label-number', number(i + 1).padStart(2, '۰')), node('span', 'aisle-label-title', `قفسهٔ ${number(i + 1)}`), node('span', 'aisle-label-count', `${number(used)} کتاب`));
      cabinet.append(label);
      for (let r = 0; r < visibleRows; r++) {
        const rail = node('span', 'aisle-plank'); rail.style.top = top + (r + 1) * rowHeight + r * plank - 8 + 'px'; cabinet.append(rail);
      }
      if (i === count - 1 && !plan.placements.some(p => p.cabinet === i && p.row === visibleRows - 1)) {
        const waiting = node('span', 'aisle-waiting', books.length ? 'جایی برای داستان‌های بعدی' : 'کتابخانه در انتظار اولین داستان');
        waiting.style.top = top + (visibleRows - 1) * (rowHeight + plank) + rowHeight / 2 + 'px'; cabinet.append(waiting);
      }
      fragment.append(cabinet);
    }
    shelf.prepend(fragment);
    plan.placements.forEach(p => {
      const book = books[p.index];
      book.style.left = total - end - p.cabinet * stride - inset - p.x - p.width + 'px';
      book.style.top = top + p.row * (rowHeight + plank) + 'px';
      book.dataset.cabinet = String(p.cabinet); book.dataset.shelfRow = String(p.row);
    });
    const rail = document.getElementById('shelf-rail'); if (rail) { rail.replaceChildren(); rail.hidden = true; }
    const focused = selected && books.find(n => n.dataset.key === selected);
    // Keep the selected book's cabinet when resizing. Filtering clamps the old
    // cabinet rather than leaving the viewport beyond the new shorter track.
    go(focused ? Number(focused.dataset.cabinet) : Math.min(old, count - 1), false);
    viewport.classList.toggle('has-adjoining-cabinets', count > 1);
    if (scrollWidthChanged) shelf.dispatchEvent(new CustomEvent('writer:aisle-reflow', {bubbles: true}));
  }
  // The existing shelf renderer remains authoritative for catalog records. A
  // cancelable layout hook replaces only its legacy vertical row decoration.
  shelf.addEventListener('writer:shelf-layout', event => { event.preventDefault(); arrange(); });
  previous?.addEventListener('click', () => go(active - 1));
  next?.addEventListener('click', () => go(active + 1));
  viewport.addEventListener('scroll', () => {
    announce();
    viewport.dispatchEvent(new CustomEvent('writer:aisle-scroll', {bubbles: true}));
  }, {passive: true});
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    go(event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : active + (event.key === 'ArrowLeft' ? 1 : -1));
  });
  shelf.addEventListener('focusin', event => {
    const book = event.target.closest('.shelf-book');
    if (book?.dataset.cabinet != null && Number(book.dataset.cabinet) !== active) go(Number(book.dataset.cabinet));
  });
  // ResizeObserver responds to actual available width, including browser zoom;
  // height-only reader animation changes never repack the shelf.
  const observer = new ResizeObserver(() => {
    if (Math.abs(viewport.clientWidth - width) < 1) return;
    pendingKey = document.activeElement?.closest('.shelf-book')?.dataset.key || null;
    cancelAnimationFrame(frame); frame = requestAnimationFrame(arrange);
  });
  observer.observe(viewport);
  arrange();
}
if (typeof document !== 'undefined') installLibraryAisle();
