/* Shared reader for the local API and the public GitHub Pages snapshot.
   The public snapshot is intentionally a small, allow-listed read-only projection. */
export function isGitHubPages() {
  return location.hostname.endsWith("github.io");
}

export function appPath(path) {
  const clean=String(path||"").replace(/^\/+/,"");
  if(!isGitHubPages())return `/${clean}`;
  const ownerPage=location.pathname.split("/").filter(Boolean)[0]||"";
  return `/${ownerPage}/${clean}`;
}

export function appHref(path) {
  return appPath(path);
}

function snapshotPath(apiPath) {
  if(apiPath==="/api/status")return appPath("snapshot/status.json");
  if(apiPath==="/api/timeline")return appPath("snapshot/timeline.json");
  if(apiPath==="/api/stories")return appPath("snapshot/stories.json");
  if(apiPath==="/api/skillbook")return appPath("snapshot/growth.json");
  if(apiPath==="/api/learning")return appPath("snapshot/learning.json");
  if(apiPath==="/api/achievements")return appPath("snapshot/achievements.json");
  const comments=apiPath.match(/^\/api\/stories\/([^/]+)\/comments$/);
  if(comments)return null; // comments remain available only on the local API-backed reader
  const story=apiPath.match(/^\/api\/stories\/([^/]+)$/);
  if(story)return appPath(`snapshot/stories/${encodeURIComponent(decodeURIComponent(story[1]))}.json`);
  return null;
}

export async function getJSON(path, options={}) {
  try {
    const response=await fetch(path,options);
    if(!response.ok)throw new Error(`${path} -> ${response.status}`);
    return await response.json();
  } catch(error) {
    const pathname=new URL(path,location.href).pathname;
    if(pathname.endsWith("/comments"))return [];
    const fallback=snapshotPath(pathname);
    if(!fallback)throw error;
    const response=await fetch(fallback,{cache:"no-store"});
    if(!response.ok)throw error;
    return response.json();
  }
}
