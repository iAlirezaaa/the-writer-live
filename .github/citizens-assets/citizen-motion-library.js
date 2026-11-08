/* Citywide reusable pose clips; this is the ONE shared animation library.
 * Static procedural clips are authored once. Residents reference by clip id,
 * have their own phase offset, and NEVER instantiate per-citizen clip tracks.
 * 'talk' and 'listen' are RESERVED only; they are never scheduled.
 */
export const MOTION_LIBRARY_VERSION = "city-citizens-v1";
export const MOTION_CLIPS = Object.freeze({
  sleep: Object.freeze({id:"sleep",seconds:5.2,loop:true,layers:["breathing"],enabled:true}),
  idle: Object.freeze({id:"idle",seconds:7.3,loop:true,layers:["breathing","gaze","fidget"],enabled:true}),
  walk: Object.freeze({id:"walk",seconds:0.88,loop:true,layers:["stride","arm-swing","footfall"],enabled:true}),
  read: Object.freeze({id:"read",seconds:4.8,loop:true,layers:["book","page-turn","gaze"],enabled:true}),
  work: Object.freeze({id:"work",seconds:3.7,loop:true,layers:["hands","posture"],enabled:true}),
  carry: Object.freeze({id:"carry",seconds:2.2,loop:true,layers:["balance","load"],enabled:true}),
  sweep: Object.freeze({id:"sweep",seconds:2.5,loop:true,layers:["arm-sweep","torso"],enabled:true}),
  greet: Object.freeze({id:"greet",seconds:2.1,loop:false,layers:["wave"],enabled:true}),
  listen: Object.freeze({id:"listen",seconds:2.8,loop:true,layers:["head-tilt"],enabled:false}),
  talk: Object.freeze({id:"talk",seconds:2.4,loop:true,layers:["jaw","gesture"],enabled:false}),
});
export const MOTION_ARCHIVE = Object.freeze({
  id:MOTION_LIBRARY_VERSION,
  format:"reusable-procedural-rig-v1",
  clips:MOTION_CLIPS,
  instancesShareClips:true,
  clipDataSharedAcrossResidents:true,
  socialClipsDormant:true
});
const clipOf = (name)=>MOTION_CLIPS[name]||MOTION_CLIPS.idle;
/** Deterministic pose evaluation with zero new geometry and zero network calls.
    Returns a reusable scalar pose that the existing rigs can consume.
    No per-frame animation objects need be stored. */
export function evaluateClip(name,seconds,phase=0,out=null){
  const clip=clipOf(name);
  if(!clip.enabled && (name==="talk"||name==="listen"))return evaluateClip("idle",seconds,phase);
  const t=(Number(seconds)||0)+phase;
  const wave=Math.sin(t*2*Math.PI/clip.seconds);
  const gait=Math.sin(t*2*Math.PI/(name==="walk"?clip.seconds:clip.seconds*1.5));
  const pose=out||{};
  Object.assign(pose,{
    clip:clip.id,
    sway:wave,
    step:gait,
    bounce:name==="walk"?Math.abs(gait)*.022:Math.abs(wave)*.006,
    head:name==="read"?.12+wave*.02:wave*.11,
    arms:name==="walk"?gait*.43:wave*.08,
    intensity:name==="sleep"?.14:1
  });
  return pose;
}
export function animationUsage(){
  return Object.values(MOTION_CLIPS).map(c=>({
    id:c.id,seconds:c.seconds,loop:c.loop,enabled:c.enabled,layers:c.layers
  }));
}
