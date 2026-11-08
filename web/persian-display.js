/* Presentation-only Persian calendar and digits.
 * API/storage values, IDs and form inputs remain unchanged.
 */
export const PERSIAN_DIGITS="۰۱۲۳۴۵۶۷۸۹";
const ISO_VISIBLE=/\b((?:19|20)\d{2})[-\/](\d{1,2})[-\/](\d{1,2})(?!\d)(?:[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?/g;
const MONTHS=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
const SOLAR_PARTS=new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn",{timeZone:"UTC",year:"numeric",month:"numeric",day:"numeric"});
export function persianDigits(value){
  return String(value??"").replace(/[0-9]/g,d=>PERSIAN_DIGITS[d.charCodeAt(0)-48]);
}
function validGregorian(year,month,day){
  const d=new Date(Date.UTC(year,month-1,day,12));
  return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day;
}
export function solarParts(year,month,day){
  year=Number(year);month=Number(month);day=Number(day);
  if(!validGregorian(year,month,day))return null;
  const p=SOLAR_PARTS.formatToParts(new Date(Date.UTC(year,month-1,day,12)));
  const get=(type)=>Number(p.find(x=>x.type===type)?.value);
  return {year:get("year"),month:get("month"),day:get("day")};
}
export function solarDate(value,options={}){
  let match;
  if(value instanceof Date&&!Number.isNaN(value.getTime()))
    match=[null,value.getUTCFullYear(),value.getUTCMonth()+1,value.getUTCDate()];
  else match=String(value??"").match(/^((?:19|20)\d{2})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if(!match)return String(value??"");
  const p=solarParts(match[1],match[2],match[3]);
  if(!p)return String(value??"");
  return options.short
    ?persianDigits(p.year+"/"+String(p.month).padStart(2,"0")+"/"+String(p.day).padStart(2,"0"))
    :persianDigits(p.day)+" "+MONTHS[p.month-1]+" "+persianDigits(p.year);
}
export function solarDateTime(value){
  const iso=String(value??"");
  const p=iso.match(/^((?:19|20)\d{2})[-\/](\d{1,2})[-\/](\d{1,2})(?:[T ](\d{2}):(\d{2}))?/);
  if(!p)return persianDigits(iso);
  const isoDate=p[1]+"-"+p[2]+"-"+p[3];
  const d=solarDate(isoDate);
  if(d===isoDate)return persianDigits(iso);
  return d+(p[4]===undefined?"":"، ساعت "+persianDigits(p[4]+":"+p[5]));
}
export function displayText(text){
  const source=String(text??"");
  return persianDigits(source.replace(ISO_VISIBLE,(original,y,m,d,h,min)=>{
    const input=y+"-"+m+"-"+d;
    const transformed=solarDate(input);
    if(transformed===input)return original;
    return h===undefined?transformed:transformed+"، ساعت "+h+":"+min;
  }));
}
const SKIP=new Set(["SCRIPT","STYLE","NOSCRIPT","CODE","PRE","KBD","SAMP","TEXTAREA","INPUT"]);
export function installPersianPresentation(root=document.body){
  if(!root||root.__persianObserver)return ()=>{};
  function allowed(node){
    let p=node.parentElement;
    while(p&&p!==root.parentElement){
      if(SKIP.has(p.tagName)||p.dataset?.numericRaw!==undefined||p.isContentEditable)return false;
      if(p===root)break;
      p=p.parentElement;
    }
    return true;
  }
  function changeText(node){
    if(!allowed(node))return;
    const previous=node.nodeValue;
    const value=displayText(previous);
    if(previous!==value)node.nodeValue=value;
  }
  function walk(node){
    if(node.nodeType===3){changeText(node);return;}
    if(node.nodeType!==1||SKIP.has(node.tagName)||node.dataset?.numericRaw!==undefined)return;
    const tree=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
    while(tree.nextNode())changeText(tree.currentNode);
  }
  walk(root);
  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==="characterData"){changeText(record.target);continue;}
      for(const node of record.addedNodes)walk(node);
    }
  });
  observer.observe(root,{subtree:true,childList:true,characterData:true});
  root.__persianObserver=observer;
  return ()=>{observer.disconnect();delete root.__persianObserver;};
}
