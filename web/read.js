// Public reader: a shelf of covers. Each story opens as a book (book.js), where readers can comment on passages.
import { openBook } from "./book.js";
import { appHref, getJSON, isGitHubPages } from "./snapshot.js";

const STATUS = { accepted: "پذیرفته", rejected: "رد شده", pending: "در جریان" };
const COVERS = ["#4a3322", "#2f4a5a", "#5a3a4a", "#3a4a32", "#5a4a2a", "#3a3a5a"];
const $ = (id) => document.getElementById(id);
let stories = [];

function savedProgress(id) {
  try { return Math.max(0, Math.min(1, Number(JSON.parse(localStorage.getItem(`the-writer-reading:${id}`) || "{}").progress) || 0)); }
  catch { return 0; }
}

async function showShelf() {
  stories = await getJSON("/api/stories");
  renderShelf();
}

function renderShelf() {
  const list = stories.filter(s => {
    const q = $("story-search").value.trim().toLocaleLowerCase("fa");
    const status = $("story-status").value;
    return (status === "all" || s.status === status) && (!q || `${s.title||""} ${s.stage||""}`.toLocaleLowerCase("fa").includes(q));
  });
  const sort = $("story-sort").value;
  list.sort((a,b) => sort === "title" ? String(a.title).localeCompare(String(b.title),"fa")
    : sort === "score" ? Number(b.score||0)-Number(a.score||0)
      : (Date.parse(a.created)||0)-(Date.parse(b.created)||0));
  if (sort === "newest") list.reverse();
  const shelf = $("covers");
  shelf.replaceChildren();
  list.forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "cover";
    b.style.setProperty("--cover", COVERS[i % COVERS.length]);
    const status = document.createElement("span"); status.className = "c-status"; status.textContent = STATUS[s.status] || s.status;
    const title = document.createElement("span"); title.className = "c-title"; title.textContent = s.title;
    const meta = document.createElement("span"); meta.className = "c-meta";
    meta.textContent = `${s.stage||"داستان"} · ${new Intl.NumberFormat("fa-IR").format(s.words||0)} کلمه`;
    const score = document.createElement("span"); score.className = "c-score"; score.textContent = `امتیاز ${new Intl.NumberFormat("fa-IR").format(s.score??"—")}`;
    const progress = savedProgress(s.id);
    const progressBox = document.createElement("span"); progressBox.className = "c-progress";
    const progressText = document.createElement("span"); progressText.textContent = progress ? `ادامهٔ مطالعه · ${Math.round(progress*100)}٪` : "برای خواندن باز کنید";
    const track = document.createElement("span"); track.className = "c-progress-track";
    const fill = document.createElement("span"); fill.style.width = `${progress*100}%`; track.append(fill); progressBox.append(progressText,track);
    b.setAttribute("aria-label",`${s.title}، ${STATUS[s.status]||s.status}، ${meta.textContent}`);
    b.append(status, title, meta, score, progressBox);
    b.addEventListener("click", () => { if (decodeURIComponent(location.hash.slice(1)) === s.id) route(); else location.hash = s.id; });
    shelf.appendChild(b);
  });
  $("shelf-count").textContent = `${new Intl.NumberFormat("fa-IR").format(list.length)} از ${new Intl.NumberFormat("fa-IR").format(stories.length)} داستان`;
  if (!list.length) shelf.textContent = stories.length ? "با این فیلتر داستانی پیدا نشد." : "هنوز داستانی نوشته نشده است.";
}

function route() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id) openBook(id).catch(() => { location.hash = ""; });
}
window.addEventListener("hashchange", route);
if(isGitHubPages()){
  $("reader-note").textContent="در این نسخهٔ عمومی، قفسه فقط آثار پذیرفته‌شدهٔ قابل انتشار را نشان می‌دهد. حاشیه‌نویسی و ثبت نظر در نسخهٔ محلی فعال است.";
  $("story-status").querySelector('option[value="rejected"]')?.remove();
}
$("home-link").href=appHref("");
$("story-search").addEventListener("input",renderShelf);
$("story-status").addEventListener("change",renderShelf);
$("story-sort").addEventListener("change",renderShelf);
showShelf().then(route).catch(() => { $("covers").textContent = "کتابخانه در دسترس نیست؛ اتصال را بررسی کنید."; });
