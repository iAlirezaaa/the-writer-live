#!/usr/bin/env python3
"""Apply only measured cover labels; never reintroduce notebook body/contact text."""
from pathlib import Path
import argparse,base64,gzip,hashlib,io,json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
def main():
    parser=argparse.ArgumentParser();parser.add_argument('capture',type=Path);args=parser.parse_args()
    room=ROOT/'web/reference-room';asset=room/'data/room.json.gz'
    payload=json.loads(gzip.decompress(asset.read_bytes()));scene=payload['scene']
    materials={m['uuid']:m for m in scene['materials']};textures={t['uuid']:t for t in scene['textures']};images={i['uuid']:i for i in scene['images']}
    changes=set();records=json.loads(args.capture.read_text())
    for record in records:
        path=record['path']
        if path[0] not in range(211,222) or path[1:] not in ([4],[1,5],[1,6],[1,7]):raise ValueError('Not a reviewed cover-label path')
        node=scene['object']
        for index in path:node=node['children'][index]
        material=materials[node['material']]
        if not material.get('transparent') or 'map' not in material:raise ValueError('Not a transparent cover decal')
        texture=textures[material['map']];image=images[texture['image']]
        decoded=Image.open(io.BytesIO(base64.b64decode(record['png'].split(',',1)[1]))).convert('RGBA')
        if decoded.getchannel('A').getextrema()[0]!=0:raise ValueError('Transparent matte was not captured')
        decoded.thumbnail((1536,1536),Image.Resampling.LANCZOS)
        stream=io.BytesIO();decoded.save(stream,format='WEBP',lossless=True,method=6,exact=True)
        image['url']='data:image/webp;base64,'+base64.b64encode(stream.getvalue()).decode();changes.add(image['uuid'])
    if len(changes)<30:raise ValueError('Incomplete cover-label capture')
    packed=gzip.compress(json.dumps(payload,separators=(',',':'),ensure_ascii=False).encode(),compresslevel=9,mtime=0);asset.write_bytes(packed)
    digest=hashlib.sha256(packed).hexdigest()
    for file in [room/'data/room-manifest.json',room/'RELEASE.json']:
        value=json.loads(file.read_text());value['asset_sha256']=digest;value['asset_bytes']=len(packed)
        if file.name=='room-manifest.json':value['alpha_repair']={'cover_images':len(changes),'method':'Original PNG alpha; lossless WebP; cover-only path allowlist'}
        file.write_text(json.dumps(value,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps({'asset_sha256':digest,'asset_bytes':len(packed),'cover_images':len(changes)}))
if __name__=='__main__':main()
