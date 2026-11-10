#!/usr/bin/env python3
"""Discover/reproduce source-identified Civita bridge approach via a single OSM API map.

The bridge is NOT drawn from guessed endpoints. This exports signed OSM ways,
with original node references and timestamps, for a future 14-span model.
"""
from __future__ import annotations
import datetime as dt
import json
import math
from pathlib import Path
import sys
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

# Bridge corridor from Bagnoregio towards Porta Santa Maria; tighter than 0.01 square degrees.
BBOX = (12.1083,42.6240,12.1136,42.6280)  # W,S,E,N; research bounding region, not surveyed bridge extent
GATE = (42.62741,12.11272)
URL = 'https://api.openstreetmap.org/api/0.6/map?bbox='+','.join(map(str,BBOX))
HIGHWAY = {'footway','pedestrian','path','steps','track','service','unclassified','residential'}
MAX_BYTES=9_000_000
MAX_WAYS=450
MAX_NODES_PER_WAY=300

def planar(lat,lon):
    return ((lon-GATE[1])*81800, (GATE[0]-lat)*111090)

def dist(a,b):
    return math.hypot(a[0]-b[0],a[1]-b[1])

def convert(body: bytes, acquired_at: str) -> dict:
    if len(body)>MAX_BYTES: raise ValueError('Oversized Civita bridge source')
    root=ET.fromstring(body)
    if root.tag!='osm': raise ValueError('Not OSM XML')
    nodes={}
    for n in root.findall('node'):
        try: nodes[n.attrib['id']] = (float(n.attrib['lat']),float(n.attrib['lon']))
        except (ValueError,KeyError): pass
    ways=[]
    for w in root.findall('way'):
        tags={t.get('k'):t.get('v') for t in w.findall('tag')}
        if tags.get('highway') not in HIGHWAY: continue
        refs=[n.get('ref') for n in w.findall('nd')]
        if len(refs)<2 or len(refs)>MAX_NODES_PER_WAY or any(r not in nodes for r in refs):continue
        coords=[nodes[r] for r in refs]
        length=sum(dist(planar(*a),planar(*b)) for a,b in zip(coords,coords[1:]))
        gate_near=min(dist(planar(*p),(0,0)) for p in coords)
        bridge=tags.get('bridge') not in (None,'no','false','0') or tags.get('man_made')=='bridge'
        ways.append({
            'type':'way','id':int(w.attrib['id']),'timestamp':w.attrib.get('timestamp'),
            'tags':{k:v for k,v in tags.items() if k in {'highway','bridge','name','width','layer','incline','ele','surface','man_made','foot','access'}},
            'node_ids':[int(r) for r in refs],
            'geometry':[{'lat':p[0],'lon':p[1]} for p in coords],
            'length_m_approx':round(length,2),'nearest_gate_m_approx':round(gate_near,2),
            'bridge_tagged':bridge
        })
        if len(ways)>MAX_WAYS:raise ValueError('Too many highway ways in corridor')
    ways.sort(key=lambda w:(not w['bridge_tagged'],w['nearest_gate_m_approx'],w['id']))
    if not ways:raise ValueError('No sourced pedestrian routes found')
    return {'ways':ways,'source':{'provider':'OpenStreetMap contributors','license':'ODbL-1.0','url':URL,
        'acquired_at':acquired_at,'geometry_crs':'EPSG:4326','bounds_wsen':list(BBOX),
        'engineering_design_ref':'https://doi.org/10.1007/s13349-022-00628-7',
        'route_verification':'NOT_CERTIFIED_TO_BE_COMPLETE',
        'terrain_elevation_verified':False}}

def main():
    if len(sys.argv)!=2:raise SystemExit('usage: build_civita_bridge_source.py OUT.json')
    req=Request(URL,headers={'User-Agent':'TheWriter-Civita-DigitalTwin/1.0 (https://github.com/iAlirezaaa/the-writer-live)',
                             'Accept':'application/xml'})
    with urlopen(req,timeout=20) as res:
        if res.status!=200:raise ValueError('OSM API HTTP '+str(res.status))
        body=res.read(MAX_BYTES+1)
    date=dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
    payload=convert(body,date)
    p=Path(sys.argv[1]);p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    tagged=[w for w in payload['ways'] if w['bridge_tagged']]
    print('CIVITA-BRIDGE-CORRIDOR-OK',len(payload['ways']),'highway ways',len(tagged),'bridge-tagged',
          'OSM bbox',BBOX,'fetched',date)
    for w in (tagged[:18] if tagged else payload['ways'][:18]):
        print('CIVITA-BRIDGE-CANDIDATE',w['id'],w['tags'],w['length_m_approx'],w['nearest_gate_m_approx'],
              'ends',w['geometry'][0],w['geometry'][-1])
if __name__=='__main__':main()
