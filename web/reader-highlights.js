// Reader-owned highlights stay on this browser, separate from public comments.
const prefix = "the-writer-highlights:";

export function readHighlights(storyId, storage = globalThis.localStorage) {
  try {
    const items = JSON.parse(storage.getItem(prefix + storyId) || "[]");
    return Array.isArray(items) ? items.filter(item => typeof item === "string" && item.length >= 3 && item.length <= 300) : [];
  } catch { return []; }
}

export function writeHighlights(storyId, highlights, storage = globalThis.localStorage) {
  const values = [...new Set(highlights.filter(item => typeof item === "string" && item.length >= 3 && item.length <= 300))];
  storage.setItem(prefix + storyId, JSON.stringify(values));
  return values;
}
