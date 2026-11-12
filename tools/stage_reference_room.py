#!/usr/bin/env python3
"""Verify the new experience, then derive /read/ without deleting the old engine.

Legacy reader unit tests continue to validate their preserved sources. The active
public entrypoint is now derived from reference-room/index.html at staging time.
The WebGL room has its own browser gate; legacy tests are not its visual evidence.
"""
from pathlib import Path
import argparse,gzip,hashlib,json,re,shutil
ROOT=Path(__file__).resolve().parents[1]
ROOM=ROOT/'web/reference-room'
def verify():
    release=json.loads((ROOM/'RELEASE.json').read_text())
    if release['mode']!='reference-empty' or release['content']!='empty':raise ValueError('Unexpected reader mode')
    for name,expected in release['files_git_blob_sha1'].items():
        data=(ROOT/name).read_bytes()
        digest=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
        if digest!=expected:raise ValueError('Unreviewed reference-room file: '+name)
    packed=(ROOM/'data/room.json.gz').read_bytes()
    if len(packed)!=release['asset_bytes'] or hashlib.sha256(packed).hexdigest()!=release['asset_sha256']:raise ValueError('Unreviewed reference-room visual asset')
    payload=json.loads(gzip.decompress(packed))
    if payload['content_mode']!='empty' or len(payload['states']['desktop-shelf']['items'])!=11:raise ValueError('Notebook content contract changed')
    if any(m['type'] in ('ShaderMaterial','RawShaderMaterial') for m in payload['scene']['materials']):raise ValueError('Unexpected executable source material')
    if any(not i['url'].startswith('data:image/webp;base64,') for i in payload['scene']['images']):raise ValueError('Unexpected external visual asset')
    return release

def stage(site):
    release=verify();site=Path(site).resolve()
    if site==ROOT:raise ValueError('Use a staging directory, not the repository root')
    target=site/'web/reference-room';target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copytree(ROOM,target,dirs_exist_ok=True)
    vendor=site/'web/vendor';vendor.mkdir(parents=True,exist_ok=True)
    shutil.copy2(ROOT/'web/vendor/three.module.js',vendor/'three.module.js')
    html=(ROOM/'index.html').read_text()
    html=html.replace('href="./room.css?', 'href="../web/reference-room/room.css?').replace('src="./room.js?', 'src="../web/reference-room/room.js?')
    html=html.replace('<head>','<head>\n<meta name="reader-mode" content="reference-empty">')
    if '<iframe' in html or 'src="./room.js' in html or 'href="./room.css' in html:raise ValueError('Invalid canonical room entry')
    destination=site/'read/index.html';destination.parent.mkdir(parents=True,exist_ok=True);destination.write_text(html)
    for asset in re.findall(r'(?:src|href)="(\.\./web/[^"?#]+)',html):
        if not (destination.parent/asset).is_file():raise ValueError('Missing published asset '+asset)
    print('REFERENCE-ROOM-STAGED',release['private_source_commit'],release['asset_sha256'])
    return destination
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--site',type=Path);args=parser.parse_args()
    if args.site:stage(args.site)
    else:verify();print('REFERENCE-ROOM-VERIFIED')
