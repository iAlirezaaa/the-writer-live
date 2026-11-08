# Observatory UI / Jalali Presentation — Master Tracker

**Project:** The Writer · **Release:** Observatory v4 / City World v3 · **Date:** 2026-11-08  
**Scope:** Complete existing dashboard, city-navigation UX, read-only public projection, frontend localization. No writer behavior, publisher decision policy, citizen memory activation, car models, or historical data migration.

## North-star experience

The visitor should feel as if they are **observing an author's unfolding life**, not filling out a conventional admin dashboard. The live Three.js stage is primary; the journal is a contextual companion. The person, home, city, writing, books, inner life, and publisher remain linked. The UI must be useful in light and dark conditions, accessible by keyboard, and preserve every existing original feature.

**Never reduce the number of original sections to simplify a screenshot.** Group and label the 15 journal panels and 10 camera views, retaining their original stable IDs and event handlers.

## Source of truth

| Area | Canonical files | Outcome |
|---|---|---|
| Site shell | `web/index.html` | Observation header, visible camera region, living-state label, scene/journal actions, day/night selector |
| Main appearance | `web/observer.css` layered over `web/style.css` | Cinematic stage vignette, calm editorial journal, responsive grouped controls, light/dark token overrides |
| Navigation architecture | `web/observer-ui.js` | Grouped navigation with no removed tabs, reciprocal panel↔scene links, RTL keyboard tab navigation |
| Dates and numbers | `web/persian-display.js` | Display-only Persian digits, Jalali calendar, fail-closed Gregorian date validation |
| Live data binding | `web/world.js` | Real clock/status, read-only public projections, city directory and active scene/panel linkage |
| Reading module | `web/read.js` | Same visual-only locale layer for public reading library |
| Static deployment | `the-writer-live/.github/observer-assets/` and `prepare_observer_deploy.py` | Pinned assets survive an outdated snapshot publisher; versioned browser imports |
| Regression | `tests/observatory_probe.mjs` | Dates, 15 panels, 10 cameras, theme, reciprocal navigation, accessible tablists, correct book link |
| City regression | `tests/town_scene_probe.mjs` in live repo | Physical shop signs, sidewalk geometry, street lights, child objects and real Three.js click tests |

## Information architecture

Existing panel IDs are unchanged.

| Journal group | Panels | Connected scene |
|---|---|---|
| Writer's life | `p-status`, `p-planner`, `p-diary`, `p-inner`, `p-self` | Follow, room, desk |
| Writing and publication | `p-stories`, `p-books`, `p-notebook`, `p-comments`, `p-publish` | Desk, library, publisher |
| Town and world | `p-town`, `p-world` | Town |
| Mind and growth | `p-graph`, `p-flaws` | Desk |
| Tools and maintenance | `p-care` | Building |

Existing camera views: `town`, `cars`, `publisher`, `bookstore`, `building`, `overview`, `follow`, `desk`, `window`, `library`. They are displayed in two meaningful groups (**Outside the home** and **Writer's house**) and maintain the original scene controls.

## Feature checklist and evidence

| Feature | Status | Evidence and limitations |
|---|---|---|
| All 15 existing panels reachable | Implemented / gated | Original IDs preserved; automated count and mapping contract. Browser visual QA still pending |
| All 10 original camera views | Implemented / gated | Grouped without deleting controls |
| Scene→related journal panel, panel→related scene | Implemented | Context actions use existing `selectTab` and `setView` |
| Searchable citizens and direct inspection | Implemented | Name/occupation/value/goals search; routes and individual 3D click targets remain |
| Real public city directory | Implemented | City venue catalog and preview links; no invented visit history |
| Public publisher page | Implemented | Explicitly fictional publisher identity, with link to physical office; no private review notes |
| Public world page | Implemented | Read-only built-place atlas; no file upload, owner token or private graph exposure |
| Public book page | Implemented | Clearly linked to published reading route |
| Day/night/automatic theme | Implemented | CSS token themes; automatic mode follows scene clock; user selection stored locally |
| Visual-only Jalali dates and Persian digits | Implemented | Real calendar conversions and invalid-date controls; UTC/ISO/ASCII remain in JSON, APIs and story IDs |
| Modern desktop + mobile responsive styling | Implemented / partial QA | 1180px, 1000px, 670px, 380px breakpoints; no production-browser visual signoff yet |
| RTL keyboard navigation | Implemented / gated | `role=tablist`, `role=tabpanel`, `aria-controls`, roving Tab focus, Left/Right and Home/End |
| Disabled/private panels represented honestly in Pages | Implemented | Other private-only tabs show a reason, not invented public data; all still present |
| Runtime performance with full city and many NPCs | Partial | Three.js geometry tests in CI; GPU/browser profiling is open |
| Visual proof of live layout at all viewport sizes | **Not verified** | Need actual deployed browser screenshots and interactive QA |

## Frontend calendar / storage contract

- Display Persian digits `۰۱۲۳۴۵۶۷۸۹` wherever user-facing text represents numbers. Convert display dates to Solar Hijri using a standards-based `Intl.DateTimeFormat` Persian calendar, including timeline labels.
- Never rewrite API keys, localStorage identifiers, file names, raw JSON timestamps, dates used for sorting, request inputs, story IDs, or externally integrated English timestamps.
- Do not mutate source data; `displayText` and text-node observation are **view-only**. Inputs, `pre`, `code`, `script`, and content-editable areas are skipped.
- Invalid Gregorian dates are left intact except Persian digit shaping. Purely numeric IDs should not be interpreted as dates.
- Site clock / simulated author time continues to follow the author server when available. Theme *auto* may follow the preview scene hour; it must not silently change server clock values.
- For the static public site, data comes only from allow-listed snapshots; no private publisher/author memory endpoints.

## Deployment / hardening lessons

- A previous static path substitution accidentally converted `href="/read"` into malformed `href="./read/>` (missing closing quote); fixed. The deployment guard and regression now require `href="./read/"`.
- A raycast test falsely expected an invisible publisher frontage to win even when a clickable citizen stood in front. The upgraded test instead requires visible shop signage to remain pickable and deliberately allows a foreground citizen; no loss of citizen clickability.
- Residential door trims previously extended into the walking corridor. Their visual depth was corrected; walkway sampling and actual Three.js tests pass.
- Publisher/store destinations are on physically paved exterior approach slabs, not through their closed walls.
- `prepare_observer_deploy.py` runs after car/reader/citizen guards and copies the reviewed shell/CSS/locale files into `_site`. `prepare_city_deploy.py` verifies the district scene before release.
- `world.js` is pinned separately in `.github/citizens-assets`. On any future update, synchronize **private source, live checked-in source, and pinned build asset**; updating only one is insufficient.

## Future improvements — verify before marking done

- [ ] Run headless browser **on the actual built Pages artifact**, not merely static source assertions; screenshot and interaction QA at 375×667, 768×1024, 1280×720, 1600×900, and a 600px-tall monitor.
- [ ] Check tooltip, directory search, publisher card, scene camera focus, day/night switch, and RTL keyboard travel interactively.
- [ ] Verify dark/light contrast across all 15 panels (WCAG AA target for normal text).
- [ ] Add a low-distraction on-scene help guide that can be dismissed; first-visit usability testing before default display.
- [ ] Improve mobile camera control discoverability and pointer gesture assistance; preserve all 10 views.
- [ ] Expand the public overview to more real, explicitly exported event data only when an approved privacy-safe snapshot exists.
- [ ] Review whether additional canvas-drawn labels need Persian digits or Jalali dates; do not transform raw analytical values.
- [ ] Keep automatic appearance preference separate from simulated daylight; QA edge cases when preview time changes.

## Change log

**2026-11-08 / Observatory v1–v3:** complete dashboard regrouping, cinematic observation-first layout, responsive day/night CSS, a Solar Hijri view boundary, reciprocal scene/journal actions, public read-only menu coverage, searchable citizen profiles and new civic district links.

**2026-11-08 / Observatory v4 + City World v3:** semantic RTL tablists with arrow-key navigation; linked public book/publisher/world sections; link-quote correction; building-front click and walkway safety tests; new cache keys and deployment guards. **Shipped and checked:** GitHub Pages workflow [42486332666](https://github.com/iAlirezaaa/the-writer-live/actions/runs/42486332666) completed successfully; the 23 observer build invariants, real Three.js town geometry and scene raycast checks, 15-panel/10-camera observer tests, pedestrian/vehicle simulations and old citizen probes passed. Actual production-browser visual QA is still open.

---

### خلاصهٔ فارسی

همهٔ ۱۵ بخش اطلاعاتی و ۱۰ دوربین حفظ شده‌اند؛ فقط گروه‌بندی شده‌اند. صحنهٔ سه‌بعدی مرکز تجربه است و پرونده‌ها از طریق دکمه‌های مرتبط به صحنه وصل می‌شوند. تاریخ‌ها شمسی و ارقام فارسی هستند، اما اطلاعات خام و شناسه‌های ذخیره‌شده تغییر نمی‌کنند. حالت روز، شب و خودکار اضافه شده است. محتوای خصوصی در نسخهٔ عمومی نمایش داده نمی‌شود؛ بخش‌های مربوطه توضیح و مسیر جایگزین دارند. هنوز باید ظاهر واقعی، ریسپانسیو و دسترس‌پذیری در مرورگر اصلی بررسی شود.
