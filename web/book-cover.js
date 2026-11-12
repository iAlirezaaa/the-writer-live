/* Stable, procedural editorial covers shared by shelf and title page.
 * No remote images, HTML injection, metadata changes or randomness.
 */
const PALETTES = Object.freeze([
  {base:"#283f46",ink:"#f7f0e4",soft:"#7ea9a5",accent:"#f3c791"},
  {base:"#a85c4c",ink:"#fff5e9",soft:"#e4ac95",accent:"#f0d8b0"},
  {base:"#252f45",ink:"#f8eddf",soft:"#738ba7",accent:"#e0b877"},
  {base:"#567065",ink:"#fff3dc",soft:"#94b4a3",accent:"#e3ba8a"},
  {base:"#c9b99a",ink:"#302e2d",soft:"#a18d79",accent:"#866453"},
  {base:"#574c61",ink:"#fff0de",soft:"#9b8eac",accent:"#e1bb9d"},
  {base:"#8b745c",ink:"#fff5e4",soft:"#c5ad90",accent:"#f1d39a"},
  {base:"#314e53",ink:"#f7eadd",soft:"#6f999b",accent:"#dba6a0"}
]);
export function coverVisual(story={}) {
  const seed=String(story.id||story.title||"untitled");
  let hash=2166136261;
  for(const character of seed){
    hash=Math.imul(hash ^ character.codePointAt(0),16777619)>>>0;
  }
  const palette=PALETTES[hash%PALETTES.length];
  return {...palette, motif:(hash>>>7)%6, edition:String(100+((hash>>>13)%900)).padStart(3,"0")};
}
const verifiedScenes=new Map();
const sceneKey=story=>JSON.stringify([String(story?.id??""),story?.title,story?.status]);
// Called only after the current authorized manuscript passes editorial checks.
export function registerCoverScene(story,image){
 if(story&&typeof story.body==="string"&&typeof image==="string")verifiedScenes.set(sceneKey(story),{body:story.body,image});
}
export function applyCoverVisual(element,story) {
  const c=coverVisual(story);
  element.dataset.motif=String(c.motif);
  element.style.setProperty("--cover-base",c.base);
  element.style.setProperty("--cover-ink",c.ink);
  element.style.setProperty("--cover-soft",c.soft);
  element.style.setProperty("--cover-accent",c.accent);
  const scene=verifiedScenes.get(sceneKey(story));
  if(scene&&(typeof story?.body!=="string"||story.body===scene.body)){
    element.dataset.coverScene="verified";element.style.setProperty("--cover-scene",`url(${JSON.stringify(scene.image)})`);
  }else{delete element.dataset.coverScene;element.style.removeProperty("--cover-scene");}
  return c;
}
export function createCoverArt() {
  const art=document.createElement("span");
  art.className="cover-art";
  art.setAttribute("aria-hidden","true");
  const inner=document.createElement("span");
  inner.className="cover-art-shape";
  art.appendChild(inner);
  return art;
}
