# Reader & Bookstore roadmap

The private repository (`the-writer`) is the source of truth. Only reviewed public-safe reader UI and editorial metadata should reach `the-writer-live`. This roadmap is additive: never remove existing reading, notes, bookmarks, progress, votes, RTL navigation, or owner-only sync.

## Vision

An accessible, beautiful Persian-first reading room that develops into a real digital bookstore. Reading and commerce must remain separate bounded domains; actual payments, customer accounts, download entitlements, billing/tax and DRM require a dedicated security/legal review before implementation.

## Competitor research — 2026-11-09

- Kobo Web Reader: font and spacing controls, reading direction, margins, table of contents, notes, bookmarks, adaptive page layout and in-book search. https://help.kobo.com/hc/en-us/articles/35996239522967-Kobo-Web-Reader-Navigation-Reading-Features
- Kindle for Web: display themes, font scale, layout, margins, page/time-left progress. https://digprjsurvey.amazon.co.uk/csad/help/node/TT200NNkr2BE4Jnsy9
- Readwise Reader: keyboard-first highlighting, annotation and shortcut discovery. https://docs.readwise.io/reader/docs/faqs/highlights-tags-notes
- StPageFlip: optional future evaluation for interactive drag-based page curl; do not swap the production engine without a performance, licensing, accessibility and RTL proof of concept. https://github.com/Nodlik/StPageFlip
- W3C EPUB Accessibility: maintain reflow, reading order, responsive text, keyboard access and reduced-motion support. https://www.w3.org/TR/epub-fxl-a11y/

## Inventory (initial inspection)

**Already present**: stable procedurally generated covers; search/filter/sort in shelf; responsive single/two-page RTL book; animated two-faced page turn on wide screens; font family/size; leading; alignment; paper/night/ink; focus mode; search in book; section jump; bookmarks; local saved progress; private owner sync; notes and voting.

## Work queue (one reviewed improvement per scheduled run)

| Priority | Capability | Acceptance criteria | State |
|---|---|---|---|
| P0 | Adjustable text-page side margins | Narrow / normal / wide; correct RTL; re-pagination based on actual computed padding; preference survives reopen; owner validation | Implemented in source 2026-11-09; browser QA pending |
| P0 | Visible/focusable controls on very short mobile landscapes | No text clipped, settings accessible at 320px, arrows reachable, no page/footer overlap | Backlog |
| P0 | End-to-end reader visual smoke tests | Actual reader mounted at 375x667, 768x700, 1229x549, 1440x900, with representative Persian text and screenshot/diff | Backlog |
| P1 | Physical page-curl prototype | Compare current Web Animations 3D and StPageFlip; measurable 60fps-ish interaction target, pointer drag, RTL symmetry, graceful reduced-motion and mobile fallback | Backlog |
| P1 | Adjustable type weight and paragraph spacing | Match measurement page; persist and test across Persian fonts | Backlog |
| P1 | Reader upgrade accessibility announcement | Keep focus stable after repagination; `aria-live` announces page number without full-page reread | Backlog |
| P1 | Version-contract test for deploy guards | Detect mismatched reader, observer and city asset versions before public Pages rollout | Backlog |
| P1 | Discoverable keyboard command help | Keyboard accessible shortcut modal; Escape; search/bookmark/nav focus control | Backlog |
| P1 | Reading statistics | Optional visible remaining time with reading speed preference; marked estimate, not certainty | Backlog |
| P1 | Notes overview, export and search | Privacy-safe opt-in export for visitor-owned notes with no private records | Backlog |
| P1 | Bookshelf reading states | To read / reading / completed, with reversible filters | Backlog |
| P2 | Rich book metadata & storefront shelf | ISBN if genuine, edition, author, genre, languages, preview eligibility, tags, release status; avoid fabricated claims | Backlog |
| P2 | Storefront catalog & search | Distinct browse/filter/order pages, mobile navigation, rights-aware publication | Backlog |
| P2 | Shopping-cart prototype | Local-only simulated cart, prices and stock state derived from verified catalog, no checkout/payment collection | Backlog |
| P2 | Customer accounts, entitlements, checkout | Architecture/security review, laws, tax, invoices, payment provider and permissioned implementation **before** enabling | Blocked on approval |
| P3 | EPUB/PDF reader and purchase/download integration | Verify source rights, licensing, accessibility, fallback and safe export | Discovery |

## Per-run implementation protocol

1. Check current source, active tasks and last commits; avoid duplicating work.
2. Research at least one respected reader/bookstore and record what is actually missing.
3. Pick a single safe, testable slice; write acceptance criteria and a discrete TODO.
4. Implement private first; retain existing features. Add focused tests plus browser checks where available.
5. Transfer only the necessary reviewed and public-safe files to the public repo, including protected `.github/reader-assets/` and its deployment guard when versioned. Never export private data, keys or owner state.
6. Check CI, document SHA/results/blockers and at least two genuinely new backlog ideas. If tests are unavailable, do not report them as passed.

## Evaluation criteria

Track actual page overflows across viewports, JS errors, keyboard focus order, accessibility contrast and reading order, page-turn smoothness/performance on mobile and desktop, user preference persistence, bundle size, and source/content permissions. No unsupported numerical success claims.

## 2026-11-09 session log

- Implemented responsive page margin selector (`narrow`, `normal`, `wide`) in `web/book.js` and `web/book.css`, with re-pagination preserving the current reading anchor and synchronizing local settings.
- Added `margins` to private owner-only `writer/reader_state.py` whitelist and tests; no private reader state copied to live.
- Public protected reader assets and cache versions updated to `reader-20261109-v7`. Preserved public-only note/voting behavior in pinned `read.js`.
- Deployment initially failed because the separate observer guard expected the previous reader script version; synchronized that guard in the public repository. Later deployment must still pass all guards before declaring the site live.
- **Verification scope:** source-level invariants and GitHub asset checks performed. Python unit tests and real-browser visual/performance tests have not been independently executed in this chat. Pages workflow and final publication must be inspected separately.
