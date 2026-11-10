"""Offline PNG decoder and EU-DEM-derived Civita grid safeguards, no network."""
from pathlib import Path
import importlib.util
import struct
import unittest
import zlib
P=Path(__file__).resolve().parents[1]/'survey'/'build_civita_terrain.py'
spec=importlib.util.spec_from_file_location('civita_terrain_build',P)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def png_constant(height_m):
    h=height_m+32768
    pixel=bytes([h//256,int(h)%256,0])
    line=b'\0'+pixel*256
    data=zlib.compress(line*256)
    def chunk(k,p):return struct.pack('>I',len(p))+k+p+struct.pack('>I',zlib.crc32(k+p))
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',256,256,8,2,0,0,0))+chunk(b'IDAT',data)+chunk(b'IEND',b'')
class Tests(unittest.TestCase):
 def test_decoder_meter_values(self):
    x=m.decode_png_bytes(png_constant(443))
    self.assertEqual((x[0],x[1],x[2]),(256,256,3))
    self.assertAlmostEqual(m.elevation(x,.5,.5),443)
 def test_unverified_grid_retains_metadata_and_relative_heights(self):
    tile=m.decode_png_bytes(png_constant(443))
    payload=m.grid_from_tiles({(8742,6043):tile,(8743,6043):tile},'2026-11-10T10:00:00Z')
    self.assertEqual(payload['columns'],97)
    self.assertEqual(payload['rows'],49)
    self.assertEqual(len(payload['relative_heights_m']),97*49)
    self.assertEqual(payload['origin_elevation_m'],443)
    self.assertTrue(all(x==0 for x in payload['relative_heights_m']))
    self.assertFalse(payload['source']['ground_contact_verified'])
    self.assertIn('EU-DEM',payload['source']['precision'])
 def test_failure_without_valid_elevation(self):
    with self.assertRaises(ValueError):m.decode_png_bytes(b'not image')
    with self.assertRaises(ValueError):
      m.grid_from_tiles({(8743,6043):m.decode_png_bytes(png_constant(120))},'today')
if __name__=='__main__':unittest.main()
