# Reader execution tracker — 2026-11-09

Scope: reader and future digital bookstore only. Private repository is authoritative. Never copy owner tokens, author data, runtime databases, or credentials into the public repository.

## Verified baseline
- `web/book.js`: RTL page navigation, Web Animations API leaf turn, reduced-motion fallback, font/theme controls, progress, bookmarks, text search, annotations.
- `web/book.css`: responsive single/spread layout and typography controls.
- This audit is source inspection, **not** a browser/runtime test.
- Reference comparison: [Kobo Web Reader](https://help.kobo.com/hc/en-us/articles/35996239522967-Kobo-Web-Reader-Navigation-Reading-Features), [Readium CSS](https://readium.org/css/docs/), [Thorium accessibility](https://daisy.org/info-help/guidance-training/reading-systems/thorium-epub-reader-quick-start-guide/).

## One small improvement this run: reproducible RTL reader QA acceptance checklist
Status: DOCUMENTED; runtime execution PENDING. No production code modified.

1. Open a Persian story in a 390px viewport and a 1280px viewport; ensure text is not clipped and controls remain reachable.
2. From the title page, press ArrowLeft: advance one page/spread. ArrowRight: return. Verify boundary buttons disable correctly.
3. Select text, then swipe: selection must not accidentally turn a page.
4. Enable OS reduced motion, turn a page: no 3D flip should occur.
5. Change font, line spacing, and margins mid-chapter: text reflows without losing the current passage.
6. Reload after bookmarking and after changing reading settings: verify restored position and settings.
7. Navigate controls using keyboard alone and inspect focus visibility and screen-reader names.
8. Record actual device/browser, expected/observed results, console errors, and any regressions before marking PASS.

Acceptance: all eight scenarios pass on desktop and mobile; any failure becomes a tracked bug before visual polish.

## Prioritized backlog (deduplicate before implementation)
- P0 [NEW IDEA 1] Stable text-anchor progress across re-pagination: store chapter/paragraph offset rather than only page index. Test changing font size and reopening on mobile; require same paragraph restored.
- P1 [NEW IDEA 2] RTL-aware page-turn regression harness: automated assertions for forward/back direction, reduced motion and one-page/two-page boundary behavior.
- P1 Verify focus-visible, keyboard-only access and live status announcements against WCAG 2.2.
- P1 Long Persian paragraph line-breaking and punctuation QA on 320–390px viewports.
- P2 Catalog metadata schema: title, author, edition, language, rights, preview availability, without checkout or payment.
- P2 Library filters for reading / finished / saved, with accessible empty states.
- P3 Cart prototype with mock data only, pending explicit approval before checkout/payment.

## Change log
- 2026-11-09: reader audit and reproducible QA checklist created; two distinct new backlog ideas recorded.
- Tests: source inspection only; browser test suite not run from connector environment.
- Public sync: documentation is safe to publish after checking the public repository path; no private data in this file.
