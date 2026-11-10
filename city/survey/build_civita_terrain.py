#!/usr/bin/env python3
"""Build a small EPSG:4326 3D map height grid from TWO open Mapzen Terrarium PNGs.

Source per-cell terrain is an openly attributed EU-DEM/SRTM-based visualization.
This is NOT Regione Lazio's 5m regional DTM, a LiDAR cliff survey, or measured
building/pier-ground contact. No hand-painted fallback elevations.
"""
from __future__ import annotations
import datetime as dt
import json
import math
from pathlib import Path
import struct
import sys
from urllib.request import Request, urlopen
import zlib

MAP_Z=16
MAP_X_MIN=34972
MAP_X_MAX=34974
MAP_Y=24173
TERRAIN_Z=14
COLS=97
ROWS=49
SOURCE_URL='https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
ATTRIBUTION='Mapzen Terrain Tiles / EU-DEM (Copernicus European Union), SRTM/USGS where applicable'
LICENSE_URL='https://github.com/tilezen/joerd/blob/master/docs/attribution.md'
ORIGIN_LAT=42.6277
ORIGIN_LON=12.1137
PNG_MAX=1_000_000

def mercator_xy(lat,lon,z):
    if not all(map(math.isfinite,(lat,lon))) or abs(lat)>=85 or abs(lon)>180:
        raise ValueError('Invalid GPS coordinate')
    n=2**z
    return ((lon+180)/360*n,(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n)

def tile_lat(y,z):
    return math.degrees(math.atan(math.sinh(math.pi*(1-2*y/2**z))))
def tile_lon(x,z):
    return 360*x/2**z-180

def paeth(a,b,c):
    p=a+b-c;da=abs(p-a);db=abs(p-b);dc=abs(p-c)
    return a if da<=db and da<=dc else b if db<=dc else c

def decode_png_bytes(raw):
    if len(raw)>PNG_MAX or not raw.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError('Not a small PNG image')
    offset=8; data=bytearray();w=h=depth=kind=0
    while offset+12<=len(raw):
        size=struct.unpack_from('>I',raw,offset)[0]
        if size>PNG_MAX:raise ValueError('PNG chunk too large')
        marker=raw[offset+4:offset+8]
        content=raw[offset+8:offset+8+size]
        if len(content)!=size:raise ValueError('Truncated PNG')
        offset+=size+12
        if marker==b'IHDR':
            w,h,depth,kind,compression,filtering,interlace=struct.unpack('>IIBBBBB',content)
            if depth!=8 or kind not in (2,6) or compression or filtering or interlace or w!=256 or h!=256:
                raise ValueError('Unsupported Terrarium PNG format')
        elif marker==b'IDAT':data.extend(content)
        elif marker==b'IEND':break
    channels=3 if kind==2 else 4
    decompressed=zlib.decompress(bytes(data))
    stride=w*channels
    if len(decompressed)!=(stride+1)*h:raise ValueError('Corrupt Terrarium pixel payload')
    out=bytearray(w*h*channels);prior=bytearray(stride);pos=0
    for y in range(h):
        f=decompressed[pos];pos+=1
        line=bytearray(decompressed[pos:pos+stride]);pos+=stride
        if f not in (0,1,2,3,4):raise ValueError('Invalid PNG filter')
        for i in range(stride):
            left=line[i-channels] if i>=channels else 0
            above=prior[i];corner=prior[i-channels] if i>=channels else 0
            if f==1:line[i]=(line[i]+left)&255
            elif f==2:line[i]=(line[i]+above)&255
            elif f==3:line[i]=(line[i]+((left+above)//2))&255
            elif f==4:line[i]=(line[i]+paeth(left,above,corner))&255
        out[y*stride:(y+1)*stride]=line;prior=line
    return (w,h,channels,out)

def elevation(tile,fx,fy):
    width,height,channels,data=tile
    i=max(0,min(width-1,round(fx*(width-1))))
    j=max(0,min(height-1,round(fy*(height-1))))
    k=(j*width+i)*channels
    return data[k]*256+data[k+1]+data[k+2]/256-32768

def grid_from_tiles(tiles,acquired_at):
    west,east=tile_lon(MAP_X_MIN,MAP_Z),tile_lon(MAP_X_MAX,MAP_Z)
    north,south=tile_lat(MAP_Y,MAP_Z),tile_lat(MAP_Y+1,MAP_Z)
    def sample(lat,lon):
        x,y=mercator_xy(lat,lon,TERRAIN_Z)
        tx,ty=int(math.floor(x)),int(math.floor(y))
        t=tiles.get((tx,ty))
        if t is None:raise ValueError('Missing source tile '+str((tx,ty)))
        return elevation(t,x-tx,y-ty)
    baseline=sample(ORIGIN_LAT,ORIGIN_LON)
    if baseline<200 or baseline>700:raise ValueError('Implausible Civita ground baseline')
    row=[]
    for j in range(ROWS):
        lat=tile_lat(MAP_Y+j/(ROWS-1),MAP_Z)
        for i in range(COLS):
            lon=tile_lon(MAP_X_MIN+2*i/(COLS-1),MAP_Z)
            z=sample(lat,lon)
            if not math.isfinite(z) or z<0 or z>1500:raise ValueError('Invalid source elevation')
            row.append(round(z-baseline,2))
    return {
        'source':{'provider':'Mapzen Terrain Tiles (AWS Open Data)','url_pattern':SOURCE_URL,
           'attribution':ATTRIBUTION,'attribution_url':LICENSE_URL,
           'acquired_at':acquired_at,
           'horizontal_reference':'EPSG:4326 on output; source Web Mercator',
           'vertical_datum':'source DEM metadata not independently verified',
           'precision':'visual relief; underlying EU-DEM/SRTM data is not Lazio 5m DTM',
           'terrain_surveyed_in_field':False,'ground_contact_verified':False,
           'source_tiles':[[x,y,TERRAIN_Z] for x,y in sorted(tiles)]},
        'bounds':{'west':west,'east':east,'north':north,'south':south},
        'columns':COLS,'rows':ROWS,
        'origin_elevation_m':round(baseline,2),
        'min_relative_m':min(row),'max_relative_m':max(row),
        'relative_heights_m':row
    }

def main():
    if len(sys.argv)!=2:raise SystemExit('usage: build_civita_terrain.py OUTPUT.json')
    tiles={}
    for x in (8742,8743):
        y=6043
        url=SOURCE_URL.format(z=TERRAIN_Z,x=x,y=y)
        req=Request(url,headers={'User-Agent':'TheWriter-Civita-DigitalTwin/1.0 (https://github.com/iAlirezaaa/the-writer-live)'})
        with urlopen(req,timeout=15) as response:
            if response.status!=200:raise ValueError('Mapzen HTTP '+str(response.status))
            raw=response.read(PNG_MAX+1)
        tiles[(x,y)]=decode_png_bytes(raw)
    timestamp=dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
    result=grid_from_tiles(tiles,timestamp)
    target=Path(sys.argv[1]);target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(result,separators=(',',':'))+'\n',encoding='utf-8')
    print('CIVITA-TERRAIN-GRID-OK',
          result['columns'], 'x',result['rows'],
          'originM',result['origin_elevation_m'],
          'minRelativeM',result['min_relative_m'],
          'maxRelativeM',result['max_relative_m'],
          'sourceTiles',len(tiles))
if __name__=='__main__':main()
