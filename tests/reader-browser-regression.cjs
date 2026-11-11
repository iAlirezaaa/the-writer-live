"use strict";
/* Real Chromium checks against the current frontend and synthetic Persian stories.
 * No private data, production API, credentials, or third-party assets are used.
 * Run: node tests/reader-browser-regression.cjs
 * Optional: NODE_PATH, READER_BROWSER_ARTIFACTS, PLAYWRIGHT_CHROMIUM_EXECUTABLE.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const artifacts = path.resolve(process.env.READER_BROWSER_ARTIFACTS || path.join(root, "reader-browser-artifacts"));
const sentence = "صبح زود، نور از پنجره به اتاق رسید. دختر کتاب را روی میز گذاشت و به صدای قدم‌ها گوش داد. پشت در کسی منتظر پاسخ بود، اما او هنوز جملهٔ آخر نامه را نخوانده بود.";
function story(id, title, paragraphs = 24, order = 0) {
  const body = "# " + title + "\n\n" + Array.from({ length: paragraphs }, (_, i) => `بند ${i + 1}. ${sentence} ${sentence}`).join("\n\n");
  return { id, title, body, stage: "داستان کوتاه", status: "accepted", score: 9, threshold: 8,
    words: body.split(/\s+/).length, created: `2026-11-${String(20 - order).padStart(2, "0")}T12:00:00Z`, check: "" };
}
const fixtures = [
  story("long", "کتاب چراغ آبی", 24, 0),
  story("slow", "کتاب در انتظار", 18, 1),
  story("error", "کتاب دوباره بازشونده", 10, 2),
  ...Array.from({ length: 13 }, (_, i) => story("shelf-" + i, "داستان قفسه " + (i + 1), 2, i + 3)),
];
const catalog = fixtures.map(({ body, check, ...entry }) => entry);
const fixtureById = new Map(fixtures.map(entry => [entry.id, entry]));

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
async function within(promise, label, timeout = 12000) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Timed out waiting for " + label)), timeout); })]);
  } finally { clearTimeout(timer); }
}
async function startServer() {
  const failures = new Set(), holds = new Map(), writes = [];
  // Public CI must exercise the actual published HTML; private CI uses source.
  const publicEntry = path.join(root, "read/index.html");
  const readerEntry = await fs.access(publicEntry).then(() => publicEntry, () => path.join(root, "web/read.html"));
  const send = (response, status, value) => {
    if (response.destroyed) return;
    response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify(value));
  };
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
      if (request.method !== "GET") {
        writes.push({ method: request.method, pathname });
        send(response, 405, { error: "This fixture server is read-only" }); return;
      }
      if (pathname === "/api/stories" || pathname === "/snapshot/stories.json") { send(response, 200, catalog); return; }
      if (/^\/api\/stories\/[^/]+\/comments$/.test(pathname)) { send(response, 200, []); return; }
      if (/^\/api\/stories\/[^/]+\/votes$/.test(pathname)) { send(response, 200, { likes: 0, dislikes: 0 }); return; }
      const match = pathname.match(/^\/api\/stories\/([^/]+)$/) || pathname.match(/^\/snapshot\/stories\/([^/]+)\.json$/);
      if (match) {
        const id = match[1], gate = holds.get(id);
        if (gate) { gate.requested.resolve(); await gate.released.promise; }
        if (failures.has(id)) send(response, 503, { error: "Synthetic recoverable story failure" });
        else if (fixtureById.has(id)) send(response, 200, fixtureById.get(id));
        else send(response, 404, { error: "Unknown fixture" });
        return;
      }
      let file;
      if (["/", "/read", "/read/"].includes(pathname)) file = readerEntry;
      else if (pathname.startsWith("/web/")) {
        file = path.resolve(root, "." + pathname);
        if (!file.startsWith(path.join(root, "web") + path.sep)) { send(response, 403, { error: "Outside frontend" }); return; }
      } else { send(response, 404, { error: "Fixture route not found" }); return; }
      const content = await fs.readFile(file);
      const mime = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" }[path.extname(file)] || "application/octet-stream";
      response.writeHead(200, { "Content-Type": mime, "Cache-Control": "no-store" }); response.end(content);
    } catch (error) { send(response, 404, { error: String(error.message) }); }
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  return {
    origin: `http://127.0.0.1:${server.address().port}`, entrypoint: path.relative(root, readerEntry), writes,
    fail(id) { failures.add(id); }, recover(id) { failures.delete(id); },
    hold(id) {
      const requested = deferred(), released = deferred();
      const gate = { requested, released }; holds.set(id, gate);
      return { requested: requested.promise, release() { holds.delete(id); released.resolve(); } };
    },
    reset() { failures.clear(); for (const gate of holds.values()) gate.released.resolve(); holds.clear(); },
    async close() { this.reset(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); },
  };
}

const cover = (page, id) => page.locator(`.shelf-book[data-key="${id}"] > .cover`);
async function settled(page) { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }
async function shelfReady(page) {
  await page.locator(".shelf-book .cover").first().waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.shelf-book .cover[tabindex="0"]').length === 1);
}
async function readerReady(page, title = fixtureById.get("long").title) {
  await page.waitForFunction(expected => {
    const overlay = document.querySelector(".book-overlay");
    return overlay && !overlay.hidden && !overlay.classList.contains("book-entering") && !overlay.hasAttribute("aria-busy") &&
      !document.querySelector(".stage") && document.querySelector(".book-bar-title")?.textContent === expected;
  }, title);
}
async function readerClosed(page) {
  await page.waitForFunction(() => {
    const overlay = document.querySelector(".book-overlay");
    return (!overlay || overlay.hidden) && !document.body.classList.contains("book-open") && !document.querySelector(".stage") &&
      [...document.querySelectorAll(".shelf-book .cover")].every(node => getComputedStyle(node).visibility !== "hidden");
  });
  assert.equal(await page.locator("body > [inert]").count(), 0, "closing must release the background");
}
async function open(page, id = "long") { await cover(page, id).click(); await readerReady(page, fixtureById.get(id).title); }
async function close(page, id = "long") {
  await page.locator(".reader-close").click(); await readerClosed(page);
  assert.equal(await cover(page, id).evaluate(node => document.activeElement === node), true, "focus returns to its source book");
  assert.equal(await page.locator('.shelf-book .cover[tabindex="0"]').count(), 1);
}
async function readingState(page, id = "long") { return page.evaluate(key => JSON.parse(localStorage.getItem(`the-writer-reading:${key}`) || "null"), id); }
async function checkGeometry(page, single) {
  const geometry = await page.evaluate(() => {
    const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
    return { book: box(".book-overlay .book"), close: box(".reader-close"), right: box(".book .page-right"),
      single: document.querySelector(".book").classList.contains("single"), width: innerWidth, height: innerHeight,
      documentWidth: document.documentElement.scrollWidth };
  });
  assert.equal(geometry.single, single, "responsive page mode");
  for (const [name, rect] of Object.entries({ book: geometry.book, close: geometry.close })) {
    assert.ok(rect.width > 0 && rect.height > 0, name + " has visible geometry");
    assert.ok(rect.x >= -1 && rect.right <= geometry.width + 1, name + " stays inside viewport horizontally: " + JSON.stringify(geometry));
    assert.ok(rect.y >= -1 && rect.bottom <= geometry.height + 1, name + " stays inside viewport vertically: " + JSON.stringify(geometry));
  }
  assert.ok(geometry.right.width > 100 && geometry.right.height > 100, "readable page size");
  assert.ok(geometry.documentWidth <= geometry.width + 1, "no document horizontal overflow");
  return geometry;
}
async function completeBook(page) {
  await page.locator(".reader-close").focus();
  await page.keyboard.press("End");
  await page.waitForFunction(() => document.querySelector(".turn-next").disabled && Number(document.querySelector(".book-progress").value) === 100);
  const state = await readingState(page);
  assert.equal(state.progress, 1, "the final visible spread counts as finished");
  assert.equal(await page.locator(".book-progress").inputValue(), "100");
}

async function main() {
  await fs.mkdir(artifacts, { recursive: true });
  const summary = { startedAt: new Date().toISOString(), browser: "Chromium", fixture: "synthetic Persian stories; local read-only HTTP server", fonts: "External font requests replaced with empty responses for repeatable offline rendering", scenarios: [], screenshots: [] };
  let server, browser;
  try {
    const { chromium } = require("playwright");
    summary.playwright = require("playwright/package.json").version;
    server = await startServer();
    summary.entrypoint = server.entrypoint;
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
    summary.browserVersion = browser.version();
    async function scenario(name, { mobile = false, reduce = false, seed } = {}, run) {
      server.reset();
      const started = Date.now();
      const row = { name, viewport: mobile ? "375x812" : "1280x900", motion: reduce ? "reduce" : "normal", pageErrors: [], consoleErrors: [], externalHosts: [] };
      const context = await browser.newContext({ viewport: mobile ? { width: 375, height: 812 } : { width: 1280, height: 900 }, reducedMotion: reduce ? "reduce" : "no-preference", hasTouch: mobile });
      await context.route("**/*", async route => {
        const url = new URL(route.request().url());
        if (url.origin === server.origin) return route.continue();
        if (!row.externalHosts.includes(url.hostname)) row.externalHosts.push(url.hostname);
        await route.fulfill({ status: 200, contentType: "text/css", body: "" });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      page.on("pageerror", error => row.pageErrors.push(error.message));
      page.on("console", message => { if (message.type() === "error") row.consoleErrors.push(message.text()); });
      await page.addInitScript(() => {
        // A static stage may show loading/cancel controls under reduced motion.
        // Count animated book geometry, not that accessible loading container.
        window.readerAnimationEvidence = { books3d: 0, leaves: 0 };
        new MutationObserver(records => {
          for (const record of records) for (const node of record.addedNodes) {
            if (node.nodeType !== 1) continue;
            window.readerAnimationEvidence.books3d += Number(node.matches(".b3d")) + node.querySelectorAll(".b3d").length;
            window.readerAnimationEvidence.leaves += Number(node.matches(".leaf-curl")) + node.querySelectorAll(".leaf-curl").length;
          }
        }).observe(document, { childList: true, subtree: true });
      });
      if (seed) await page.addInitScript(values => { for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value); }, seed);
      const capture = async label => {
        const filename = name + (label ? "-" + label : "") + ".png";
        await page.screenshot({ path: path.join(artifacts, filename), fullPage: false });
        summary.screenshots.push(filename);
      };
      try {
        await page.goto(server.origin + "/read/", { waitUntil: "domcontentloaded" });
        await shelfReady(page);
        await run({ page, capture, server, row });
        await settled(page);
        assert.deepEqual(row.pageErrors, [], "no unhandled page errors");
        row.animationEvidence = await page.evaluate(() => window.readerAnimationEvidence);
        await capture();
        row.status = "passed";
        console.log("PASS " + name);
      } catch (error) {
        row.status = "failed"; row.error = String(error.stack || error);
        await capture("failure").catch(() => {});
        console.error("FAIL " + name + "\n" + row.error);
      } finally {
        row.durationMs = Date.now() - started; summary.scenarios.push(row);
        await context.close(); server.reset();
      }
    }

    await scenario("desktop-motion-open-turn-close", {}, async ({ page, capture, row }) => {
      await open(page); row.geometry = await checkGeometry(page, false); await capture("open");
      const before = await page.locator(".book-counter").textContent();
      await page.locator(".turn-next").click();
      await page.locator(".leaf-curl").waitFor({ state: "attached" }); await capture("turn");
      await page.locator(".leaf-curl").waitFor({ state: "detached" });
      assert.notEqual(await page.locator(".book-counter").textContent(), before);
      await close(page);
    });
    await scenario("mobile-motion-open-turn-close", { mobile: true }, async ({ page, capture, row }) => {
      await open(page); row.geometry = await checkGeometry(page, true); await capture("open");
      const before = await page.locator(".book-counter").textContent();
      const cdp = await page.context().newCDPSession(page);
      row.touchGestures = [];
      await page.evaluate(() => {
        window.readerTouchEvidence = [];
        for (const type of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) document.addEventListener(type, event => {
          if (event.pointerType === "touch") window.readerTouchEvidence.push({ type, trusted: event.isTrusted, x: event.clientX, y: event.clientY });
        }, true);
      });
      try {
        const bounds = await page.locator(".book-overlay .book").boundingBox();
        const y = bounds.y + bounds.height * .66;
        async function swipe(startFraction, distance, steps = 1, screenshot = false) {
          const x = bounds.x + bounds.width * startFraction;
          const point = nextX => ({ x: nextX, y, id: 1, radiusX: 1, radiusY: 1, force: 1 });
          await page.evaluate(() => { window.readerTouchEvidence = []; });
          await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point(x)] });
          for (let step = 1; step <= steps; step++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [point(x + distance * step / steps)] });
          await page.locator(".book.is-dragging").waitFor({ state: "attached" });
          // Hold the destination briefly so release tests position, not flick velocity.
          await page.waitForTimeout(260);
          if (screenshot) await capture("touch-curl");
          await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
          await page.locator(".leaf-curl").waitFor({ state: "detached" });
          await settled(page);
          const events = await page.evaluate(() => window.readerTouchEvidence);
          assert.ok(events.some(event => event.type === "pointermove" && event.trusted), "Chromium delivered a trusted touch move");
          assert.ok(events.some(event => event.type === "pointerup" && event.trusted), "Chromium delivered a trusted touch release");
          assert.ok(events.every(event => event.trusted), "touch proof contains no synthetic DOM events");
          assert.ok(!events.some(event => event.type === "pointercancel"), "horizontal page swipe must not be claimed by browser scrolling");
          row.touchGestures.push({ startFraction, distance, events, counter: await page.locator(".book-counter").textContent() });
        }
        for (const start of [.25, .70]) {
          await swipe(start, 8);
          assert.equal(await page.locator(".book-counter").textContent(), before, "an 8px held drag cancels at either starting position");
        }
        await swipe(.20, bounds.width * .60, 6, true);
        assert.notEqual(await page.locator(".book-counter").textContent(), before, "a meaningful rightward touch swipe advances the Persian page");
      } finally {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }).catch(() => {});
        await cdp.detach();
      }
      await close(page);
    });
    await scenario("desktop-reduced-completion", { reduce: true }, async ({ page, row }) => {
      await open(page); row.geometry = await checkGeometry(page, false);
      await completeBook(page);
      assert.deepEqual(await page.evaluate(() => window.readerAnimationEvidence), { books3d: 0, leaves: 0 });
      await close(page);
      assert.equal(await cover(page, "long").evaluate(node => node.closest(".shelf-book").classList.contains("is-finished")), true);
    });
    await scenario("mobile-reduced-completion", { mobile: true, reduce: true }, async ({ page, row }) => {
      await open(page); row.geometry = await checkGeometry(page, true); await completeBook(page);
      assert.deepEqual(await page.evaluate(() => window.readerAnimationEvidence), { books3d: 0, leaves: 0 });
      await close(page);
    });
    await scenario("escape-cancels-staged-loading", {}, async ({ page, capture, server }) => {
      const gate = server.hold("slow");
      await cover(page, "slow").click(); await within(gate.requested, "delayed story request");
      await page.locator(".stage-cancel").waitFor(); await capture("loading");
      await page.keyboard.press("Escape"); await readerClosed(page);
      assert.equal(await page.evaluate(() => location.hash), "");
      const response = page.waitForResponse(value => new URL(value.url()).pathname === "/api/stories/slow");
      gate.release(); await (await response).finished(); await settled(page);
      await readerClosed(page);
      assert.equal(await cover(page, "slow").evaluate(node => document.activeElement === node), true);
    });
    await scenario("mobile-visible-cancel-button", { mobile: true }, async ({ page, server }) => {
      const gate = server.hold("slow");
      await cover(page, "slow").click(); await within(gate.requested, "delayed story request");
      await page.locator(".stage-cancel").click(); await readerClosed(page);
      const response = page.waitForResponse(value => new URL(value.url()).pathname === "/api/stories/slow");
      gate.release(); await (await response).finished(); await settled(page); await readerClosed(page);
    });
    await scenario("shelf-focus-favorite-removal", { reduce: true, seed: { "the-writer-favorite:long": "1", "the-writer-favorite:slow": "1", "the-writer-favorite:error": "1" } }, async ({ page }) => {
      await cover(page, "slow").focus(); await page.keyboard.press("ArrowLeft");
      assert.equal(await cover(page, "error").evaluate(node => node === document.activeElement), true);
      assert.equal(await page.locator('.shelf-book .cover[tabindex="0"]').count(), 1);
      await page.locator("#library-filter-toggle").click(); await page.locator("#story-favorites").click();
      await page.waitForFunction(() => document.querySelectorAll(".shelf-book").length === 3);
      await cover(page, "slow").focus(); await page.keyboard.press("f");
      await page.waitForFunction(() => document.querySelectorAll(".shelf-book").length === 2);
      assert.equal(await cover(page, "error").evaluate(node => node === document.activeElement), true);
      await page.keyboard.press("f"); await page.waitForFunction(() => document.querySelectorAll(".shelf-book").length === 1);
      assert.equal(await cover(page, "long").evaluate(node => node === document.activeElement), true);
      await page.keyboard.press("f"); await page.waitForFunction(() => document.querySelectorAll(".shelf-book").length === 0);
      assert.equal(await page.locator("#library-filter-toggle").evaluate(node => node === document.activeElement), true);
    });
    await scenario("dialog-search-and-focus-trap", { reduce: true }, async ({ page, capture }) => {
      await open(page);
      await page.keyboard.press("Control+f");
      assert.equal(await page.locator(".reader-settings").evaluate(node => node.open), true);
      assert.equal(await page.locator(".reader-find").evaluate(node => node === document.activeElement), true);
      await capture("drawer");
      const focusBoundary = async (which, scope) => page.evaluate(({ which, scope }) => {
        const nodes = [...document.querySelector(scope).querySelectorAll('button, a[href], input, select, textarea, summary, [tabindex]')].filter(node => !node.disabled && node.tabIndex >= 0 && node.getClientRects().length && !node.closest('[hidden], [inert]'));
        nodes[which === "first" ? 0 : nodes.length - 1].focus();
      }, { which, scope });
      await focusBoundary("first", ".reader-settings"); await page.keyboard.press("Shift+Tab");
      assert.equal(await page.locator(".reader-settings").evaluate(node => node.contains(document.activeElement)), true);
      await page.keyboard.press("Tab");
      assert.equal(await page.locator(".reader-settings > summary").evaluate(node => node === document.activeElement), true);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator(".reader-settings").evaluate(node => node.open), false);
      assert.equal(await page.locator(".book-overlay").evaluate(node => node.hidden), false);
      await page.keyboard.press("Control+f");
      await page.locator(".reader-focus").click();
      assert.equal(await page.locator(".book-overlay").evaluate(node => node.classList.contains("reader-focus-mode")), true);
      await page.keyboard.press("Escape");
      await page.locator(".reader-settings > summary").click();
      assert.equal(await page.locator(".reader-settings").evaluate(node => node.open), true, "appearance stays reachable in focus mode");
      await page.keyboard.press("Escape"); await page.keyboard.press("Control+f");
      assert.equal(await page.locator(".reader-find").evaluate(node => node === document.activeElement), true, "focus mode retains in-book search");
      await page.locator(".reader-focus").click();
      assert.equal(await page.locator(".book-overlay").evaluate(node => node.classList.contains("reader-focus-mode")), false);
      await page.keyboard.press("Escape");
      await focusBoundary("last", ".book-overlay"); await page.keyboard.press("Tab");
      assert.equal(await page.locator(".book-overlay").evaluate(node => node.contains(document.activeElement)), true);
      await page.keyboard.press("Escape"); await readerClosed(page);
    });
    await scenario("bookmark-persists-through-font-and-mobile-reflow", { reduce: true }, async ({ page, capture }) => {
      await open(page);
      await page.locator(".reader-close").focus(); await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowLeft");
      await page.locator(".book-bookmark").click();
      const marked = await readingState(page);
      assert.equal(marked.bookmarkAnchor.kind, "body");
      await page.keyboard.press("Control+f");
      await page.locator('input[type="range"][aria-label="اندازهٔ نوشته"]').evaluate(node => { node.value = "1.48"; node.dispatchEvent(new Event("change", { bubbles: true })); });
      await page.waitForFunction(() => JSON.parse(localStorage.getItem("the-writer-reading:long")).fontSize === 1.48);
      assert.deepEqual((await readingState(page)).bookmarkAnchor, marked.bookmarkAnchor);
      await page.keyboard.press("Escape");
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForFunction(() => document.querySelector(".book").classList.contains("single"));
      await settled(page);
      assert.deepEqual((await readingState(page)).bookmarkAnchor, marked.bookmarkAnchor);
      await page.locator(".reader-close").focus(); await page.keyboard.press("End");
      await page.locator(".book-bookmark").click();
      await page.waitForFunction(() => document.querySelector(".book-bookmark").getAttribute("aria-pressed") === "true");
      assert.deepEqual((await readingState(page)).bookmarkAnchor, marked.bookmarkAnchor);
      await capture("mobile-bookmark"); await close(page);
    });
    await scenario("failed-book-can-reopen", {}, async ({ page, capture, server }) => {
      server.fail("error"); await cover(page, "error").click();
      await page.locator('#reader-note[role="alert"]').waitFor(); await readerClosed(page);
      assert.match(await page.locator("#reader-note").textContent(), /دوباره/);
      assert.equal(await page.evaluate(() => location.hash), ""); await capture("recoverable-error");
      server.recover("error"); await open(page, "error"); await close(page, "error");
    });
    await scenario("cancelled-response-cannot-replace-new-book", { reduce: true }, async ({ page, server }) => {
      const gate = server.hold("slow");
      await cover(page, "slow").click(); await within(gate.requested, "delayed story request");
      await page.keyboard.press("Escape"); await readerClosed(page);
      await open(page, "long");
      const response = page.waitForResponse(value => new URL(value.url()).pathname === "/api/stories/slow");
      gate.release(); await (await response).finished(); await settled(page);
      await readerReady(page, fixtureById.get("long").title);
      assert.equal((await readingState(page, "slow")), null, "a cancelled story must not create read progress");
      await close(page, "long");
    });
    await scenario("mobile-paper-theme-and-close-controls", { mobile: true, reduce: true }, async ({ page, capture, row }) => {
      await open(page);
      await page.keyboard.press("Control+f");
      await page.getByRole("button", { name: "کاغذ شب", exact: true }).focus(); await page.keyboard.press("Enter");
      assert.equal(await page.locator(".book-overlay").getAttribute("data-reader-theme"), "night");
      await page.keyboard.press("Escape"); row.geometry = await checkGeometry(page, true); await capture("night");
      await page.keyboard.press("Control+f");
      await page.getByRole("button", { name: "کاغذ کرم", exact: true }).focus(); await page.keyboard.press("Enter");
      assert.equal(await page.locator(".book-overlay").getAttribute("data-reader-theme"), "paper");
      await page.keyboard.press("Escape"); await close(page);
    });
    assert.deepEqual(server.writes, [], "browser tests must not issue write requests");
  } catch (error) {
    summary.fatalError = String(error.stack || error);
    console.error(summary.fatalError);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) await server.close().catch(() => {});
    summary.finishedAt = new Date().toISOString();
    summary.passed = summary.scenarios.filter(row => row.status === "passed").length;
    summary.failed = summary.scenarios.filter(row => row.status === "failed").length;
    summary.status = !summary.fatalError && summary.failed === 0 && summary.passed === 12 ? "passed" : "failed";
    await fs.writeFile(path.join(artifacts, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
    console.log(JSON.stringify({ status: summary.status, passed: summary.passed, failed: summary.failed, fatal: Boolean(summary.fatalError), report: path.join(artifacts, "summary.json") }));
    if (summary.status !== "passed") process.exitCode = 1;
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
