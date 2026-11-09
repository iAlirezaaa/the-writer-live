// Pure, layout-independent reading anchors. A paragraph can span multiple pages,
// so page numbers and paragraph indices alone do not reliably survive reflow.
const READABLE_KINDS = new Set(["title", "body", "report"]);
const position = (value) => Number.isSafeInteger(value) && value >= 0 ? value : 0;

export function pageAnchor(page) {
  if (!page || !READABLE_KINDS.has(page.kind)) return null;
  return {
    kind: page.kind,
    firstPara: position(page.firstPara),
    firstWord: position(page.firstWord),
  };
}

export function locatePageByAnchor(pages, anchor, pagesPerSpread = 1) {
  if (!Array.isArray(pages) || !pages.length || !anchor || !READABLE_KINDS.has(anchor.kind)) return 0;
  const per = pagesPerSpread === 2 ? 2 : 1;
  let closest = -1;
  const targetPara = position(anchor.firstPara);
  const targetWord = position(anchor.firstWord);
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page.kind !== anchor.kind) continue;
    const para = position(page.firstPara);
    const word = position(page.firstWord);
    if (para < targetPara || (para === targetPara && word <= targetWord)) {
      closest = i;
    } else if (closest < 0) {
      // The requested passage was removed or moved: open the first later page.
      closest = i;
      break;
    } else {
      break;
    }
  }
  if (closest < 0) closest = pages.findIndex(page => page.kind === anchor.kind);
  if (closest < 0 && anchor.kind === "report") {
    // If the critique was removed, retain the old reader behavior: last story page.
    for (let i = pages.length - 1; i >= 0; i--) {
      if (pages[i].kind === "body") { closest = i; break; }
    }
  }
  if (closest < 0) return 0;
  const aligned = closest - (closest % per);
  return Math.min(aligned, Math.max(0, pages.length - per));
}
