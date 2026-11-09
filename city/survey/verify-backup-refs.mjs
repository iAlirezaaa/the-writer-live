/* MAYOR-054: read-only Git-ref integrity check for frozen Tehran city backups.
 * The absence of any file in a 2026-11-09 snapshot must not be interpreted
 * as evidence that the backup branch no longer exists.
 *
 * CLI requires access to private repo through GH_TOKEN / GITHUB_TOKEN.
 * Exit nonzero on unverified data; never mutate a branch or log a token.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const FROZEN_WRITER_BLOCK_BACKUPS = Object.freeze([
  Object.freeze({
    repository: "iAlirezaaa/the-writer",
    branch: "backup/writer-block-pre-tehran-rebuild-2026-11-09",
    sha: "cfdac995b6e070d472627b484c93d8fbf5f6ed2b"
  }),
  Object.freeze({
    repository: "iAlirezaaa/the-writer-live",
    branch: "backup/writer-block-pre-tehran-rebuild-2026-11-09",
    sha: "ececf9ffc041b1666b0425f4f1746d162b9dcf67"
  })
]);

export function gitRefUrl(entry) {
  if(!/^[-\w]+\/[-\w]+$/.test(entry.repository) ||
     !entry.branch.startsWith("backup/"))
    throw new TypeError("Invalid repository or frozen backup ref");
  return `https://api.github.com/repos/${entry.repository}/git/ref/heads/${entry.branch}`;
}

export function validateBackupManifest(manifestText) {
  if(typeof manifestText!=="string") return false;
  return FROZEN_WRITER_BLOCK_BACKUPS.every(entry =>
    manifestText.includes(entry.repository) &&
    manifestText.includes(entry.sha) &&
    manifestText.includes(entry.branch));
}

export async function verifyBackupRefs({
  request=globalThis.fetch,
  token="",
  manifestText,
}={}) {
  if(typeof request!=="function") throw new TypeError("GitHub fetch required");
  const manifestValid=validateBackupManifest(manifestText);
  const entries=[];
  for (const entry of FROZEN_WRITER_BLOCK_BACKUPS) {
    const headers={
      "Accept":"application/vnd.github+json",
      "X-GitHub-Api-Version":"2022-11-28",
      "User-Agent":"writer-block-backup-ref-audit"
    };
    if(token) headers.Authorization=`Bearer ${token}`;
    let status="unverified", observedSha=null, reason="unavailable";
    try {
      const res=await request(gitRefUrl(entry),{headers,method:"GET"});
      if(!res?.ok){
        status="unverified";
        reason=`GitHub HTTP ${res?.status ?? "unknown"}`;
      }else{
        const json=await res.json();
        observedSha=typeof json?.object?.sha==="string"?json.object.sha:null;
        if(json?.ref!==`refs/heads/${entry.branch}` ||
          json?.object?.type!=="commit" ||
          !/^[0-9a-f]{40}$/.test(observedSha??"")) {
          status="unverified";
          reason="Unexpected Git-ref response";
        }else if(observedSha!==entry.sha){
          status="mismatch";
          reason="Frozen branch SHA differs";
        }else{
          status="verified";
          reason="Exact immutable Git-ref SHA";
        }
      }
    }catch{
      status="unverified";
      reason="GitHub request or JSON decoding failed";
    }
    entries.push({
      repository:entry.repository,
      branch:entry.branch,
      expectedSha:entry.sha,
      observedSha,
      status,
      reason
    });
  }
  return {
    manifestValid,
    entries,
    passed:manifestValid && entries.every(entry=>entry.status==="verified"),
    note:"Git-ref and local manifest only; historical tree/file content not audited"
  };
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
  const manifestText=readFileSync(
    resolve(root,"city/backups/writer-block-pre-tehran-rebuild-2026-11-09.md"),
    "utf8"
  );
  const result=await verifyBackupRefs({
    token:process.env.GH_TOKEN||process.env.GITHUB_TOKEN||"",
    manifestText
  });
  process.stdout.write(JSON.stringify(result,null,2)+"\n");
  if(!result.passed)process.exitCode=1;
}
