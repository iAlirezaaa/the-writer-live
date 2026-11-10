/* Civita public map catalog. Locations are sourced WGS84 anchors or clearly
 * labelled temporary author-room anchor. Do NOT copy Tehran fictional POIs.
 */
import {CIVITA_ORIGIN,SANTA_MARIA_GATE,geoToCivita} from './civita-geo.mjs';
const gate=geoToCivita(SANTA_MARIA_GATE.latitude,SANTA_MARIA_GATE.longitude);
export const CITY_PLACE_CATALOG=Object.freeze([
 {id:'civita-village-center',name:'Civita di Bagnoregio',zone:'مرکز تاریخی سیویتا',
  kind:'مبدأ OSM',x:0,z:0,y:0,
  description:'نقطهٔ مرجع ثبت‌شدهٔ روستای Civita در OpenStreetMap؛ این نقطه محل دقیق خانه یا بنای مشخصی نیست.',
  activity:'مشاهدهٔ ردپای واقعی ساختمان‌ها',access:'برچسب جغرافیایی، نه سازهٔ قابل بازدید',source:'OSM node 1778014513'},
 {id:'porta-santa-maria',name:'دروازهٔ سانتا ماریا',zone:'ورودی تاریخی سیویتا',
  kind:'اثر تاریخی',x:gate.x,z:gate.z,y:0,
  description:'موقعیت نقطه‌ای ثبت‌شدهٔ Porta di Santa Maria. مدل هندسی دروازه و ارتفاع دقیق آن هنوز استخراج نشده است.',
  activity:'آغاز مسیر بررسی بافت تاریخی',access:'نشانگر منبع‌دار، مدل معماری هنوز موجود نیست',source:'OSM node 1079071522'},
 {id:'writer-civita-proxy',name:'خانهٔ نویسنده — پوستهٔ سیویتا',zone:'جایگذاری موقت اتاق نویسنده',
  kind:'مطالعهٔ معماری دوطبقه',x:0,z:0,y:0,
  description:'اتاق اصلی نویسنده حفظ شده و در یک پوستهٔ تفسیریِ سنگ توف و سفال قرار گرفته است. این محل هنوز به قطعهٔ واقعی Lo Studio متصل نشده است.',
  activity:'نویسندگی در اتاق محفوظ',access:'ورود با دوربین؛ موقعیت جغرافیایی واقعی خانه تأیید نشده',source:'Civita Institute Lo Studio reference, unlocated model'}
]);
export function auditCityPlan(){return {activeCity:'Civita di Bagnoregio',venues:CITY_PLACE_CATALOG.length,
  verifiedAnchorCount:2,geolocatedWriterHome:false,exactCliffElevation:false,
  buildingsSource:'OSM ODbL',verifiedBuildingFacades:0,writerRoomUntouched:true,
  createdTehranBuildings:0,roadAndCitizenPhysicalGraphChanged:false};}
