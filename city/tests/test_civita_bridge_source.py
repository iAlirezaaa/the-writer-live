"""Offline checks for licensed Civita bridge corridor converter."""
import importlib.util
from pathlib import Path
import unittest
S=Path(__file__).resolve().parents[1]/'survey'/'build_civita_bridge_source.py'
spec=importlib.util.spec_from_file_location('civita_bridge_source',S)
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
XML=b"""<osm version="0.6">
<node id="1" lat="42.62741" lon="12.11272"/>
<node id="2" lat="42.62720" lon="12.11249"/>
<node id="3" lat="42.62689" lon="12.11210"/>
<node id="4" lat="42.62675" lon="12.11190"/>
<way id="444" timestamp="2026-11-01T00:00:00Z"><nd ref="1"/><nd ref="2"/><nd ref="3"/><tag k="highway" v="footway"/><tag k="bridge" v="yes"/></way>
<way id="445"><nd ref="3"/><nd ref="4"/><tag k="highway" v="steps"/></way>
<way id="446"><nd ref="1"/><nd ref="4"/><tag k="building" v="yes"/></way>
</osm>"""
class BridgeTests(unittest.TestCase):
 def test_ways_and_tagged(self):
  r=m.convert(XML,'2026-11-10T10:00:00Z')
  self.assertEqual([w['id'] for w in r['ways']],[444,445])
  self.assertEqual(r['ways'][0]['tags']['bridge'],'yes')
  self.assertTrue(r['ways'][0]['bridge_tagged'])
  self.assertFalse(r['ways'][1]['bridge_tagged'])
  self.assertEqual(r['ways'][0]['node_ids'],[1,2,3])
  self.assertTrue(r['source']['terrain_elevation_verified'] is False)
  self.assertEqual(r['source']['license'],'ODbL-1.0')
 def test_missing_nodes_skip(self):
  r=m.convert(XML.replace(b'<node id="4" lat="42.62675" lon="12.11190"/>',b''),'now')
  self.assertEqual(len(r['ways']),1)
 def test_bad_input_rejected(self):
  with self.assertRaises(ValueError):m.convert(b'<html/>','now')
  with self.assertRaises(ValueError):m.convert(b'<osm/>','now')
 def test_corridor_bbox_small(self):
  w,s,e,n=m.BBOX;self.assertLess((e-w)*(n-s),.0001)
  self.assertEqual(m.URL.count('bbox='),1)
if __name__=='__main__':unittest.main()
