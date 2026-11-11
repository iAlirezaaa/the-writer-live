# Reader interaction and motion reliability — 2026-11-11

Status: complete; committed, browser verified and deployed to the public site. Private base: `fd8328f60edd2973538e4d8bae255cc58c76983a`; implementation commits: `e60485213ce620b4532ccd240bae4ac5763c3609`, `81c14767752571f5f6d5a4c3b1e2a7145dfb64cf`, and `a2b6e18be7305e70682325b421105d31cf613d37`.

## Scope and acceptance

- [x] Reproduce and fix reader session/navigation failures, shelf keyboard/focus loss, and interrupted opening/closing animation cleanup.
- [x] Preserve the current single bookcase, RTL reading, approved public publication labels, public story snapshot, and unrelated city/author files.
- [x] Verify actual desktop/mobile browser behavior, default/reduced motion, delayed loads, search, bookmark/reflow, closing and returning to the shelf.
- [x] Run focused existing reader regressions and add behavior coverage for repaired failures.
- [x] Commit private source first; mirror only reviewed public reader assets/tests; update the live manifest and verify the new public Pages deployment.

## Baseline

- Existing Node suites: 32/32 passing; geometry probe: passing.
- Existing static Python reader checks: 10 passing, 2 failures in `test_reader_search_landmark.py`; its word-boundary regexes are double-escaped and do not match valid markup.
- Public publication label `owner_shared` exists only in public `book.js`/`read.js`; include it in private source before mirroring.
- The current public Pages workflow deploys checked-in files directly. Historical protected reader pins are no longer part of this deployment.

## Follow-up ideas

- Add fixed-time screenshots of interrupted and resumed opening at mobile/desktop sizes to detect visible stage jumps.

## Implemented

- Session tokens prevent late story, comment, vote, owner-sync, font and paper responses from modifying a newer book. Escape and a visible shelf-return button cancel loading/opening without waiting for the network.
- The shelf-to-page stage measures the loaded reader's actual geometry, cleans up filled animation effects and hidden source books in every exit path, and supports static loading/cancellation with reduced motion. Opening lasts 1.6 seconds and closing 1 second before optional user acceleration.
- Bookmark paragraph/word anchors survive font and viewport reflow; reaching the last visible spread records completion. The private state sanitizer accepts the anchor and the current paper/motion/lamp options without storing passage text.
- Touch curls follow displacement from the finger's starting point, so a short gesture no longer turns a page merely because it began near the spine. Mouse grips preserve their physical hinge geometry.
- Responsive pagination hides or restores the second page before measuring the grid. Resizing from desktop to mobile no longer creates hundreds of mostly empty pages. Browser checks compare measurement dimensions to visible pages in both resize directions.
- The stable scrollbar gutter uses the library's dark/light canvas instead of a white strip. Staged loading immediately hides empty pages and reader controls while keeping its loading/cancel interface visible.
- Search opens its settings drawer; focus stays within the reader, returns to the corresponding shelf book, and remains visible. Favorite removal, RTL arrow boundaries and fractional shelf rows retain a single keyboard tab stop.
- Story-load errors return to an interactive shelf with a visible retry message. Focus mode retains access to its settings and exit control.
- The publisher rejects uncommitted reader frontend changes before `--push` and rechecks before public Git operations. Private Pages staging uses current entrypoints and only the existing authorized public snapshot. Obsolete protected-reader pins are not used.
- Deployment checks resolve the active Pages workflow and validate the actual shipped reader, including reviewed asset hashes and the project-relative public entrypoint. Dormant historical pins no longer override these checks.
- Normal `publish_live.py --push` exports reviewed reader bytes from one immutable private Git commit, updates the existing public manifest and entrypoint, and rechecks the source revision and exported bytes before publishing and after rebasing. Preview builds remain possible but carry no publishable source proof.

## Verified release

- Node behavior: **74/74 passed**, including 20 reader-session, 9 stage-lifecycle, 9 shelf-focus and 4 deployment-contract cases.
- Python focused reader/state/release checks: **40/40 passed**, including 19 release-boundary checks.
- Page-curl geometry and Persian Unicode scripts: passed, including the deterministic 250-case Unicode corpus.
- First Chromium run: **12/12 passed**, zero unhandled page errors, on public candidate `076861f2764260f11ddd21cc2989c283c3567caa`, [Actions run 43092514359](https://github.com/iAlirezaaa/the-writer-live/actions/runs/43092514359). Tested the actual public `read/index.html` with synthetic read-only fixtures at 1280×900 and 375×812, normal/reduced motion. Trusted touch evidence: 8px drags from two starting positions stayed on page 1; a 183px rightward swipe advanced to page 2.
- Reviewed the screenshot/report artifacts. Visual QA identified the responsive measurement bug, white gutter and loading flash above; after fixing them, the strengthened suite passed **12/12** on final public candidate `04e4b3367878c906676e2a875d3def4bc1d60f0f`, [Actions run 43093524159](https://github.com/iAlirezaaa/the-writer-live/actions/runs/43093524159). The 1,700-word fixture at the enlarged font now has 33 mobile pages instead of 269; measuring width is 305px on mobile and 540px per page on desktop, matching visible pages. Loading chrome is hidden immediately, and the final screenshots have no white gutter.
- After promotion, the same **12/12** browser scenarios passed on public `main`: [run 43093850412](https://github.com/iAlirezaaa/the-writer-live/actions/runs/43093850412). The browser suite uses Chromium 151 with Playwright 1.62.1, synthetic stories and offline font responses; physical iOS/Safari was not exercised.
- Local Chromium could not start because the execution sandbox denied its required local socket; execution outside that sandbox was unavailable. Browser execution was completed in public Actions instead.
- Private Actions run `43091225603` failed before executing any step (`runner_id: 0`, empty steps). This remains an infrastructure limitation; it did not block the verified public release.

## Publication evidence

- Public implementation commit, promoted to `main`: [`04e4b3367878c906676e2a875d3def4bc1d60f0f`](https://github.com/iAlirezaaa/the-writer-live/commit/04e4b3367878c906676e2a875d3def4bc1d60f0f).
- Public source manifest: private implementation `a2b6e18be7305e70682325b421105d31cf613d37`, with SHA-256 hashes for the six reviewed reader assets and exact project-relative HTML parity.
- Actual Pages deployment: [run 43093850442](https://github.com/iAlirezaaa/the-writer-live/actions/runs/43093850442), **success**. Public catalog tests and the existing observatory contract also passed on this commit.
- Live reader: [the-writer-live/read/](https://ialirezaaa.github.io/the-writer-live/read/).
- Direct HTTP verification returned 200 for the deployed reader HTML and all six reviewed assets; their response bytes exactly matched the reviewed public export.
- Existing authorized story snapshots and unrelated city/author assets were unchanged.

## Current publication procedure

Commit private source first, then run `python3 tools/publish_live.py --push` from the private checkout to export the committed reader, rewrite the public entrypoint and refresh the source manifest. Uncommitted reader changes and stale preview exports are rejected. For a reviewed release, a `reader/**` candidate branch can run the browser suite before `main` is advanced; it does not trigger the Pages workflow. Confirm the actual new Pages run separately.
