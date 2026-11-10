# Removable reader bookshelf mode

The public Reader catalog now has a third **قفسهٔ تعاملی** button beside **جلدی** and **فهرستی**. It reuses the *same approved public stories*, Persian search, filters, favorites, reading progress and reader overlay.

The new design references https://library.jjangik.kr/ as interaction inspiration; no third-party files, artwork or packages are copied. Its only dedicated visual module is `web/interaction-library/reader-shelf.css`, pinned identically in `.github/reader-assets/reader-shelf.css`. The book opening delay (260ms) exists only in that opt-in view and is skipped for `prefers-reduced-motion`.

Rollback: remove the third button and stylesheet link in `read/index.html` and `.github/reader-assets/read.html`, remove only the `shelf` path from `web/read.js` and `.github/reader-assets/read.js`, delete the two dedicated CSS files, and remove CSS copy/validation lines from `.github/workflows/pages.yml` and `.github/scripts/prepare_reader_deploy.py`. Do not touch the story data, 15 observatory panels, 10 cameras, RTL dates or public privacy controls.

Verification evidence: 11 source-backed V8 DOM-mock tests passed privately; no browser interaction or deployment is claimed until verified.
