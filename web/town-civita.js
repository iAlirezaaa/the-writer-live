/* MAYOR-068 — Civita di Bagnoregio main-town adapter.
 * Licensed OSM 2D underlay + source-identified OSM way footprints.
 * Geometric elevations/facades/bridge/cliff are NOT validated scans.
 * Writer room, publisher state and citizen paths are outside this group.
 */
import {MAP_TILES,MAP_ZOOM,mapTileRect,CIVITA_ORIGIN,SANTA_MARIA_GATE,geoToCivita,CAMERA_TARGET_LIMITS} from './civita-geo.mjs';
import {attachCivitaVectors} from './civita-osm-render.js';
import {createCivitaPedestrians} from './civita-pedestrians.js';
import {attachCivitaBridge} from './civita-bridge.js';

export function buildCivitaTown({THREE,scene,streetY=-3}){
 if(!THREE?.Group||!scene?.add||!Number.isFinite(streetY))throw new TypeError('Civita needs existing Three.js scene');
 const group=new THREE.Group();group.name='town';group.position.y=streetY;
 group.userData.cityBuild={
   activeCity:'Civita di Bagnoregio', source:'OpenStreetMap (ODbL 1.0)',
   latitude:CIVITA_ORIGIN.latitude,longitude:CIVITA_ORIGIN.longitude,
   sourceMapLayers:2,realBuildingHeightsMeasured:false,unknownBuildingVolumeProxyMeters:6,
   terrainElevationSurveyed:false,authorRoomProtected:true,
   authorHomeLocation:'temporary visual anchor; not verified Lo Studio parcel',
   physicalCityCollidersAdded:false,citizenPathsModified:false,
   mapMode:'civita',cameraBounds:CAMERA_TARGET_LIMITS
 };
 const survey=new THREE.Group();survey.name='civita-osm-map-underlay';group.add(survey);
 const baseMaterials=[];
 for(const [x,y] of MAP_TILES){
   const rect=mapTileRect(x,y,MAP_ZOOM);
   const material=new THREE.MeshBasicMaterial({color:0xc7bda9,side:THREE.DoubleSide});
   baseMaterials.push({x,y,material});
   const tile=new THREE.Mesh(new THREE.PlaneGeometry(rect.width,rect.depth),material);
   tile.rotation.x=-Math.PI/2;tile.position.set(rect.x,-.12,rect.z);
   tile.name=`civita-osm-tile-${MAP_ZOOM}-${x}-${y}`;
   tile.userData={source:'OpenStreetMap',license:'ODbL-1.0',copyright:'© OpenStreetMap contributors',
     mappedHeights:false,physicalCollider:false};
   survey.add(tile);
 }
 // A source point marker, not a claimed reconstruction of the medieval gate.
 const gate=geoToCivita(SANTA_MARIA_GATE.latitude,SANTA_MARIA_GATE.longitude);
 const marker=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,.25,16),
   new THREE.MeshBasicMaterial({color:0x3174a6,depthTest:false}));
 marker.position.set(gate.x,.4,gate.z);marker.name='OSM-Porta-di-Santa-Maria-marker-not-architecture';
 marker.userData={source:SANTA_MARIA_GATE.source,license:'ODbL-1.0',architecturalModel:false};
 group.add(marker);
 const status=new THREE.Group();status.name='civita-source-volumes';group.add(status);
 const bridgeLayer=new THREE.Group();bridgeLayer.name='civita-verified-viaduct-study';group.add(bridgeLayer);
 let ambientPedestrians=null;
 // Node geometry tests have no browser images; do not load tiles there.
 if(typeof window!=='undefined'&&typeof Image!=='undefined'){
   const loader=new THREE.TextureLoader();
   loader.setCrossOrigin('anonymous');
   for(const {x,y,material} of baseMaterials){
     loader.load(`https://tile.openstreetmap.org/${MAP_ZOOM}/${x}/${y}.png`,
       texture=>{texture.colorSpace=THREE.SRGBColorSpace;material.map=texture;material.needsUpdate=true;},
       undefined,()=>{group.userData.cityBuild.tileLoadErrors=(group.userData.cityBuild.tileLoadErrors||0)+1;});
   }
   // The actual viaduct is a separately provenance-gated, 14-span geometric
   // model. If the documented OSM centerline is missing, never draw a fake bridge.
   void attachCivitaBridge(THREE,bridgeLayer,{onStatus:message=>{
     group.userData.cityBuild.bridgeStatus=message;
   }}).then(result=>{
     if(!result.error){
       group.userData.cityBuild.bridgeOSMWay=result.source.sourceId;
       group.userData.cityBuild.bridgeStructuralSpanCount=14;
       group.userData.cityBuild.bridgePierFootingElevationSurveyed=false;
     }
   });
   // One bounded Overpass request for sourced polygons. No unlicensed fallback geometry.
   void attachCivitaVectors(THREE,status,{onStatus:message=>{
     group.userData.cityBuild.vectorStatus=message;
   }}).then(result=>{
     if(result.error)return;
     // The original writer room/exterior occupies a protected temporary anchor.
     // Do not draw an unrelated OSM building across it until Lo Studio is geolocated.
     for(const child of result.layer.children){
       if(!child.isMesh)continue;
       const bbox=new THREE.Box3().setFromObject(child);
       if(bbox.min.x<8&&bbox.max.x>-8&&bbox.min.z<8&&bbox.max.z>-8){
         child.visible=false;child.userData.suppressedForUnlocatedWriterRoom=true;
       }
     }
     // Source-backed, anonymous ambient pedestrians: old Tehran resident identities/routes are untouched.
     ambientPedestrians=createCivitaPedestrians(THREE,status,result.paths,{maxPeople:18});
     group.userData.cityBuild.ambientPedestrianCount=ambientPedestrians.count;
   }).catch(error=>{group.userData.cityBuild.vectorStatus='OSM unavailable: '+error.message;});
 }
 scene.add(group);
 return {group,districts:null,growth:null,trafficState(){return [];},
   update(day,elapsed,_crossingDemand,_weather){ambientPedestrians?.update(day,elapsed);}};
}
