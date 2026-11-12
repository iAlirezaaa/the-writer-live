#!/usr/bin/env python3
"""Compile measured visual evidence; never copy source executable bundles/fonts."""
from __future__ import annotations
import argparse, base64, gzip, hashlib, io, json
from pathlib import Path
from PIL import Image, ImageDraw
SOURCE_SHA='78a7ce36d1ffce35652c5001c9bbb04aa757acb0c82ddc10b438975e981ca57b'
def load(path):
    raw=path.read_bytes()
    return json.loads(gzip.decompress(raw) if path.suffix=='.gz' else raw)
def walk(node):
    yield node
    for child in node.get('children',[]):yield from walk(child)
def encode(im):
    out=io.BytesIO();im.save(out,format='WEBP',quality=94,method=6,exact=True)
    return 'data:image/webp;base64,'+base64.b64encode(out.getvalue()).decode('ascii')
def main():
    p=argparse.ArgumentParser();p.add_argument('evidence',type=Path);p.add_argument('destination',type=Path);a=p.parse_args()
    source=a.evidence/'desktop-shelf-scene.json.gz';digest=hashlib.sha256(source.read_bytes()).hexdigest()
    if digest!=SOURCE_SHA:raise ValueError('Unreviewed source visual evidence')
    scene=load(source);states={}
    for path in sorted(a.evidence.glob('*.json')):
        if path.name=='errors.json' or '-scene' in path.name:continue
        value=load(path)
        if isinstance(value,dict) and 'camera' in value and 'nodes' in value:states[path.stem]=value
    baseline=states['desktop-shelf']
    if len(baseline['items'])!=11:raise ValueError('Unexpected source notebook count')
    nodes={v['uuid']:v for v in walk(scene['object'])};materials={v['uuid']:v for v in scene['materials']}
    blanked=0
    for book in baseline['items']:
        sid=book.get('still',{}).get('uuid')
        if sid in nodes:
            mat=materials[nodes[sid]['material']];mat.pop('map',None);mat.update(color=0xf1ede3,opacity=1,transparent=False);blanked+=1
    for mat in scene['materials']:
        if mat['type'] in ('ShaderMaterial','RawShaderMaterial'):
            uid=mat['uuid'];mat.clear();mat.update(uuid=uid,type='PointsMaterial',color=0xffdfac,size=.012,sizeAttenuation=True,transparent=True,opacity=.3,depthWrite=False)
    stats={'images':0,'bytes_before':0,'bytes_after':0,'empty_contact_cards':0,'blank_demo_surfaces':blanked}
    for index,record in enumerate(scene.get('images',[])):
        url=record.get('url')
        if not isinstance(url,str) or not url.startswith('data:image/'):raise ValueError('Unexpected external image')
        stats['bytes_before']+=len(url)
        im=Image.open(io.BytesIO(base64.b64decode(url.split(',',1)[1]))).convert('RGBA')
        if index in (41,42):
            if im.size!=(1024,1024):raise ValueError('Contact texture layout changed')
            im=Image.new('RGB',(512,512),'#b69656');draw=ImageDraw.Draw(im)
            for r in (.43,.41):draw.ellipse((512*(.5-r),512*(.5-r),512*(.5+r),512*(.5+r)),outline='#806932',width=1)
            im=im.convert('RGBA');stats['empty_contact_cards']+=1
        elif im.width==1024 and im.height>=1500:im=Image.new('RGBA',(64,96),(0,0,0,0))
        else:
            limit=1536 if im.width>im.height*2.8 or im.height>im.width*2.8 else 1024
            im.thumbnail((limit,limit),Image.Resampling.LANCZOS)
        record['url']=encode(im);stats['images']+=1;stats['bytes_after']+=len(record['url'])
    if stats['empty_contact_cards']!=2:raise ValueError('Contact identity was not removed')
    refs={v for m in scene['materials'] for k,v in m.items() if (k.endswith('Map') or k=='map') and isinstance(v,str)}
    scene['textures']=[t for t in scene['textures'] if t['uuid'] in refs]
    used={t['image'] for t in scene['textures']};scene['images']=[i for i in scene['images'] if i['uuid'] in used]
    for value in states.values():value.pop('html',None);value.pop('rects',None)
    model={'schema':1,'reference':'https://library.jjangik.kr/','source_asset_sha256':digest,'content_mode':'empty','scene':scene,'states':states}
    raw=json.dumps(model,separators=(',',':'),ensure_ascii=False).encode();packed=gzip.compress(raw,compresslevel=9,mtime=0)
    a.destination.mkdir(parents=True,exist_ok=True);(a.destination/'room.json.gz').write_bytes(packed)
    audit={'schema':1,'source_sha256':digest,'asset_sha256':hashlib.sha256(packed).hexdigest(),'asset_bytes':len(packed),'uncompressed_bytes':len(raw),'notebooks':11,'content_mode':'empty','copied_executable_source':False,'font_files_included':False,'original_contact_included':False,'stats':stats}
    (a.destination/'room-manifest.json').write_text(json.dumps(audit,indent=2)+'\n');print(json.dumps(audit,indent=2))
if __name__=='__main__':main()
