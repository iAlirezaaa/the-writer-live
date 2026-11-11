/* MAYOR-068 — Civita di Bagnoregio main-town adapter.
 * Licensed OSM 2D underlay + source-identified OSM way footprints.
 * Geometric elevations/facades/bridge/cliff are NOT validated scans.
 * Writer room, publisher state and citizen paths are outside this group.
 */
import {MAP_TILES,MAP_ZOOM,mapTileRect,CIVITA_ORIGIN,SANTA_MARIA_GATE,geoToCivita,CAMERA_TARGET_LIMITS} from './civita-geo.mjs';
import {attachCivitaVectors} from './civita-osm-render.js';
import {createCivitaPedestrians} from './civita-pedestrians.js?v=mayor083-v1';
import {createCivitaCrowd} from './civita-crowd.js?v=mayor084-v2';
import {buildCivitaStreetFurnishing} from './civita-street-furnishing.js?v=mayor084-v3';
import {bridgeEdges} from './civita-details.js?v=mayor084-v3';
import {attachCivitaBridge} from './civita-bridge.js';
import {loadCivitaTerrain} from './civita-terrain.js';
import {loadCivitaMeasuredTerrain} from './civita-measured-terrain.js?v=mayor084-v4';
import {buildCivitaBuildings} from './civita-buildings.js?v=mayor085-v1';
import {buildCivitaDetails} from './civita-details.js?v=mayor084-v3';

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
 let ambientPedestrians=null,sourceRelief=null,bridgeModel=null,vectorModel=null,measuredWorld=null,measuredLayer=null,buildingModel=null,detailModel=null,writerSite=null;
 let writerPlacedWayId=null,writerHome=null,homeCut=false,resolveSurvey=null;
 const surveyReady=new Promise(resolve=>{resolveSurvey=resolve;});
 const suppressWriterParcelProxy=()=>{
   if(!writerPlacedWayId||!vectorModel?.layer)return;
   for(const mesh of vectorModel.layer.children){
     if(mesh.isMesh&&mesh.userData?.source_id===writerPlacedWayId){
       mesh.visible=false;
       mesh.userData.suppressedForPlanCorrelatedWriterHome=true;
     }
   }
 };
 let furnishing=null,walks=null;
 // People walk the surveyed lanes and the bridge deck, and sit at the cafe tables.
 const populate=()=>{
   if(ambientPedestrians?.selfGrounded||!measuredWorld||!furnishing)return;
   // The OSM snapshot can arrive first with its small fallback crowd; the survey replaces it.
   if(ambientPedestrians){status.remove(ambientPedestrians.group);ambientPedestrians=null;}
   const {data,heightAt}=measuredWorld;
   const seats=furnishing.terraces.filter(t=>Number.isFinite(t.y)).flatMap((t,i)=>i%2?[]:[{x:t.x-.8,z:t.z+.55,y:t.y+.45,yaw:0},{x:t.x+.8,z:t.z-.35,y:t.y+.45,yaw:Math.PI}]);
   if(walks){
     ambientPedestrians=createCivitaCrowd(THREE,status,walks,{maxPeople:84,heightAt,seated:seats,obstacles:furnishing.obstacles||[]});
     group.userData.cityBuild.ambientPedestrianCount=ambientPedestrians.count;
     return;
   }
   const lanes=data.paths.filter(p=>p.points.every(q=>q[0]>-100&&q[0]<190)).map(p=>({id:p.id,points:p.points.map(q=>({x:q[0],z:q[1]}))}));
   const [left,right]=bridgeEdges(data);
   const deck={id:'surveyed-bridge-deck',points:left.map((a,i)=>{const b=right[Math.min(i,right.length-1)];return {x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,y:(a[2]+b[2])/2};})};
   const seated=seats;
   // The piazza and the main lane are where people gather, so they count several times over.
   const busy=lanes.filter(l=>data.paths.find(p=>p.id===l.id)?.kind==='pedestrian');
   ambientPedestrians=createCivitaPedestrians(THREE,status,[...lanes,...busy,...busy,...busy,...busy,deck,deck],{maxPeople:90,heightAt,seated});
   group.userData.cityBuild.ambientPedestrianCount=ambientPedestrians.count;
 };
 const renderMeasuredBuildings=()=>{
   if(!measuredWorld)return;
   if(buildingModel){
     measuredLayer.remove(buildingModel.layer);
     buildingModel.layer.traverse(o=>{o.geometry?.dispose?.();});
   }
   buildingModel=buildCivitaBuildings(THREE,measuredLayer,measuredWorld.data,measuredWorld.heightAt,{site:writerSite,home:writerHome,passages:walks?.passages||[]});
   buildingModel.cutHome?.(homeCut,writerHome);
   Object.assign(group.userData.cityBuild,{realBuildingHeightsMeasured:true,measuredBuildingCount:buildingModel.counts.volumes,
     roofsAndOpeningsInterpretive:true});
   if(detailModel){measuredLayer.remove(detailModel.layer);detailModel.layer.traverse(o=>{o.geometry?.dispose?.();});}
   try{
     detailModel=buildCivitaDetails(THREE,measuredLayer,measuredWorld.data,measuredWorld.heightAt,{doors:buildingModel.doors,passages:walks?.passages||[],wallMap:buildingModel.wallMap});
     bridgeLayer.visible=false;
     group.userData.cityBuild.detailCounts=detailModel.counts;
   }catch(error){detailModel=null;group.userData.cityBuild.detailStatus='details failed: '+String(error.message).slice(0,100);}
   try{
     if(furnishing){measuredLayer.remove(furnishing.layer);furnishing.layer.traverse(o=>{o.geometry?.dispose?.();});}
     // OSM sits a few metres off the survey; named places and lanes are moved onto it before anything is placed by them.
     const [odx,odz]=walks?.osm_offset||[0,0],source=measuredWorld.data;
     const aligned={...source,places:source.places.map(p=>({...p,x:p.x+odx,z:p.z+odz})),paths:source.paths.map(p=>({...p,points:p.points.map(q=>[q[0]+odx,q[1]+odz,...q.slice(2)])}))};
     furnishing=buildCivitaStreetFurnishing(THREE,measuredLayer,aligned,measuredWorld.heightAt,{doors:buildingModel.doors,windows:buildingModel.windows,passages:walks?.passages||[]});
     group.userData.cityBuild.furnishingCounts=furnishing.counts;
     populate();
   }catch(error){group.userData.cityBuild.furnishingStatus='failed: '+String(error.message).slice(0,100);}
 };
 const groundSourceGeometry=()=>{
   if(!sourceRelief)return;
   // With the measured survey loaded, the OSM proxies give way to it; their records stay for provenance and routes.
   if(measuredWorld&&vectorModel?.layer)for(const obj of vectorModel.layer.children)if(obj.isMesh||obj.isLine)obj.visible=false;
   const height=sourceRelief.heightAtLocal;
   const markHeight=height(gate.x,gate.z);
   if(Number.isFinite(markHeight))marker.position.y=.4+markHeight;
   if(bridgeModel?.group){
     const start=bridgeModel.stations?.[0];
     const h=start&&height(start.x,start.z);
     if(Number.isFinite(h)){
       bridgeModel.group.position.y=h;
       bridgeModel.group.userData.deckStartGroundElevationFromApproximateDEM=true;
       bridgeModel.group.userData.pierGroundContactVerified=false;
     }
   }
   if(vectorModel?.layer){
     for(const obj of vectorModel.layer.children){
       if(obj.isMesh){
         const h=height(obj.position.x,obj.position.z);
         if(Number.isFinite(h)){
           obj.position.y=.18+h;
           obj.userData.elevationSource='Mapzen EU-DEM visual terrain (not surveyed)';
           obj.userData.groundContactVerified=false;
         }
       }else if(obj.isLine&&obj.geometry?.attributes?.position){
         const pos=obj.geometry.attributes.position;
         for(let i=0;i<pos.count;i++){
           const h=height(pos.getX(i),pos.getZ(i));
           if(Number.isFinite(h))pos.setY(i,.30+h);
         }
         pos.needsUpdate=true;obj.geometry.computeBoundingSphere();
       }
     }
   }
 };

 // Node geometry tests have no browser images; do not load tiles there.
 if(typeof window!=='undefined'&&typeof Image!=='undefined'){
   // The measured Lazio survey is the ground. Raster tiles are only the fallback if it fails to load.
   const useRasterFallback=()=>{
     const loader=new THREE.TextureLoader();
     loader.setCrossOrigin('anonymous');
     for(const {x,y,material} of baseMaterials){
       loader.load(`https://tile.openstreetmap.org/${MAP_ZOOM}/${x}/${y}.png`,
         texture=>{texture.colorSpace=THREE.SRGBColorSpace;material.map=texture;material.needsUpdate=true;},
         undefined,()=>{group.userData.cityBuild.tileLoadErrors=(group.userData.cityBuild.tileLoadErrors||0)+1;});
     }
     // Optional open-terrain grid drapes the original raster map in real-source
     // relative elevations; missing/invalid source leaves the safe flat map.
     void loadCivitaTerrain(THREE,survey.children,{onStatus:message=>{
       group.userData.cityBuild.terrainStatus=message;
     }}).then(result=>{
       if(!result.error){
         sourceRelief=result;
         group.userData.cityBuild.terrainReliefSource='Mapzen open DEM (EU-DEM / USGS), approximate';
         group.userData.cityBuild.terrainHeightRangeM=[result.minRelativeM,result.maxRelativeM];
         group.userData.cityBuild.terrainElevationSurveyed=false;
         groundSourceGeometry();
       }
     });
   };
   measuredLayer=new THREE.Group();measuredLayer.name='civita-measured-world';group.add(measuredLayer);
   const walksReady=fetch(new URL('./data/civita-walks.json',import.meta.url),{cache:'default'}).then(r=>r.ok?r.json():null).catch(()=>null);
   void Promise.all([loadCivitaMeasuredTerrain(THREE,measuredLayer,{streetY,onStatus:message=>{group.userData.cityBuild.terrainStatus=message;}}),walksReady]).then(([result,walkData])=>{
     walks=walkData;measuredWorld=result;survey.visible=false;marker.visible=false;
     sourceRelief={heightAtLocal:result.heightAt};
     Object.assign(group.userData.cityBuild,{terrainReliefSource:result.data.source.attribution,terrainElevationSurveyed:true,terrainSurveyScale:result.data.source.scale});
     renderMeasuredBuildings();
     groundSourceGeometry();
     resolveSurvey(result);
   }).catch(error=>{
     resolveSurvey(null);
     group.userData.cityBuild.terrainStatus='survey unavailable, using raster map: '+String(error.message).slice(0,80);
     useRasterFallback();
   });
   // The actual viaduct is a separately provenance-gated, 14-span geometric
   // model. If the documented OSM centerline is missing, never draw a fake bridge.
   void attachCivitaBridge(THREE,bridgeLayer,{onStatus:message=>{
     group.userData.cityBuild.bridgeStatus=message;
   }}).then(result=>{
     if(!result.error){
       bridgeModel=result;groundSourceGeometry();
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
     vectorModel=result;groundSourceGeometry();
     // Suppress ONLY the sourced polygon if the independent writer-location gate succeeds.
     suppressWriterParcelProxy();
     // Source-backed, anonymous ambient pedestrians: the protected resident
     // identities/routes of the author's private core are untouched.
     if(!measuredWorld&&!ambientPedestrians){
       ambientPedestrians=createCivitaPedestrians(THREE,status,result.paths,{maxPeople:18});
       group.userData.cityBuild.ambientPedestrianCount=ambientPedestrians.count;
     }
   }).catch(error=>{group.userData.cityBuild.vectorStatus='OSM unavailable: '+error.message;});
 }
 scene.add(group);
 return {group,districts:null,growth:null,surveyReady,trafficState(){return [];},
   // Indoors the house stays standing, opened along its street wall, instead of disappearing.
   setHomeCut(active){homeCut=active;buildingModel?.cutHome?.(active,writerHome);},
   setWriterPlacement(site){
     if(!site||site.sourceWay!=='way/464102189'||!site.footprintInteriorClear)
       throw new TypeError('Sourced writer parcel match required');
     writerPlacedWayId=464102189;
     writerSite={x:site.x,z:site.z};
     writerHome=site.home||null;
     renderMeasuredBuildings();
     group.userData.cityBuild.writerSourceWayId=writerPlacedWayId;
     group.userData.cityBuild.authorHomeLocation='official Institute plan D / candidate OSM way/464102189';
     group.userData.cityBuild.writerParcelCadastralVerified=false;
     suppressWriterParcelProxy();
   },
   update(day,elapsed,_crossingDemand,_weather){
     ambientPedestrians?.update(day,elapsed);
     const dusk=Math.max(0,Math.min(1,(.45-(Number(day)||0))/.35));
     if(buildingModel)buildingModel.litGlass.emissiveIntensity=dusk*1.5;
     if(detailModel)detailModel.street.bulbMaterial.color.setRGB(.29+dusk*.71,.27+dusk*.55,.21+dusk*.2);
     if(sourceRelief&&ambientPedestrians&&!ambientPedestrians.selfGrounded){
       for(const walker of ambientPedestrians.group.children){
         const h=sourceRelief.heightAtLocal(walker.position.x,walker.position.z);
         if(Number.isFinite(h))walker.position.y=.13+h;
       }
     }
   }};
}
