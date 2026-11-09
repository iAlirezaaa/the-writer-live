import test from "node:test";
import assert from "node:assert/strict";
import {
  FROZEN_WRITER_BLOCK_BACKUPS,
  gitRefUrl,
  validateBackupManifest,
  verifyBackupRefs
} from "../survey/verify-backup-refs.mjs";

const manifest=FROZEN_WRITER_BLOCK_BACKUPS
  .map(x=>`${x.repository} / ${x.branch} / ${x.sha}`).join("\n");
const good=(url)=>({
  ok:true,status:200,
  async json(){
    const record=FROZEN_WRITER_BLOCK_BACKUPS.find(x=>gitRefUrl(x)===url);
    assert.ok(record,"Only frozen approved Git refs should be read");
    return {ref:`refs/heads/${record.branch}`,object:{sha:record.sha,type:"commit"}};
  }
});

test("exact private and public frozen refs and manifest pass",async()=>{
  const urls=[];
  const result=await verifyBackupRefs({
    manifestText:manifest,
    request:async(url,init)=>{
      urls.push(url);
      assert.equal(init.method,"GET");
      assert.ok(!init.headers.Authorization);
      return good(url);
    }
  });
  assert.equal(result.passed,true);
  assert.equal(result.entries.length,2);
  assert.deepEqual(result.entries.map(x=>x.status),["verified","verified"]);
  assert.equal(urls.length,2);
});

test("missing backup file in a historical commit is not used for ref verification",()=>{
  assert.ok(FROZEN_WRITER_BLOCK_BACKUPS.every(x=>gitRefUrl(x).includes("/git/ref/heads/backup/")));
  assert.ok(FROZEN_WRITER_BLOCK_BACKUPS.every(x=>!gitRefUrl(x).includes("/contents/")));
});

test("missing local backup manifest fails closed",async()=>{
  assert.equal(validateBackupManifest(""),false);
  const result=await verifyBackupRefs({
    manifestText:"incorrect contents",
    request:async url=>good(url)
  });
  assert.equal(result.passed,false);
  assert.ok(result.entries.every(x=>x.status==="verified"));
});

test("missing ref or missing token permission never reports a verified snapshot",async()=>{
  const result=await verifyBackupRefs({
    manifestText:manifest,
    request:async(url)=>url.includes("the-writer-live")?good(url):{ok:false,status:404}
  });
  assert.equal(result.passed,false);
  assert.equal(result.entries[0].status,"unverified");
  assert.equal(result.entries[1].status,"verified");
});

test("mismatched SHA cannot pass, even with otherwise valid ref",async()=>{
  const result=await verifyBackupRefs({
    manifestText:manifest,
    request:async(url)=>{
      const response=good(url),data=await response.json();
      if(url.includes("the-writer-live"))data.object.sha="0".repeat(40);
      return {ok:true,status:200,json:async()=>data};
    }
  });
  assert.equal(result.passed,false);
  assert.equal(result.entries[1].status,"mismatch");
});

test("invalid JSON, bad object type and network errors fail closed",async()=>{
  const badJSON=await verifyBackupRefs({
    manifestText:manifest,
    request:async()=>({ok:true,json:async()=>{throw new SyntaxError("invalid JSON")}})
  });
  assert.equal(badJSON.passed,false);
  const badType=await verifyBackupRefs({
    manifestText:manifest,
    request:async(url)=>{const data=await good(url).json();data.object.type="blob";return {ok:true,json:async()=>data}}
  });
  assert.equal(badType.passed,false);
  const network=await verifyBackupRefs({
    manifestText:manifest,
    request:async()=>{throw new Error("disconnected")}
  });
  assert.equal(network.passed,false);
});
