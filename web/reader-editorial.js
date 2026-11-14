/* Editorial interpretation of EXISTING public, owner-authorized manuscripts.
 * Separate from story bodies: changed source evidence or release status suppresses the
 * introduction instead of fabricating a synopsis. Text and rights remain untouched.
 */
const EDITORIAL=Object.freeze({
  "0016":Object.freeze({"title":"ثبتِ نام","status":"accepted","fragments":["کابلِ پاک‌کنندهٔ حافظه را برید","نوشت، دیوار خالی ماند"],"summary":"مهتاب در بایگانی دروازه برای نجات خاطرات مادرش دست به انتخاب می‌زند. نامی که می‌نویسد کسی را بازمی‌گرداند، اما گشودن راه بازگشت مادر به همان سادگی نیست؛ داستانی بسیار کوتاه دربارهٔ انتخاب و بهای بازگرداندن نام‌ها.","alt":"دروازه‌ای برنجی، یک نام ثبت‌شده و جای خالی نامی دیگر","image":"0016.svg"}),
  "0003":Object.freeze({"title":"نامی که از پل برگشت","status":"accepted","fragments":["سه دایره‌ی مسی کوچک","کابل پاره شد."],"summary":"در شهری که نام پل‌ها و آدم‌ها یکی‌یکی از حافظه محو می‌شود، مهتاب در بایگانی ردّ نام‌های گمشده و نشانه‌های مادرش را دنبال می‌کند. جست‌وجوی او به دستگاهی در زیرزمین می‌رسد و او را میان حفظ خاطره‌ای شخصی و نجات نام‌های شهر قرار می‌دهد.","alt":"پل سنگی در مه شامگاهی؛ دفتر بایگانی با سه حلقهٔ مسی و قایق کاغذی روی رودخانه","image":"0003.svg"}),
  "0005":Object.freeze({"title":"کوچه‌ی بازگشت","status":"accepted","fragments":["اگر نامی برگشت، سنگی روشن می‌شود","کوچه‌ی بازگشت."],"summary":"پس از خاموش شدن دستگاهی که نام‌ها را می‌زدود، مهتاب نشانه‌های مادرش را میان پل روشن، فهرستی پنهان و گذرگاهی بی‌نام جست‌وجو می‌کند. در این شهر، نام‌بردن از آدم‌ها و مکان‌ها دو پیامد متفاوت دارد و انتخاب واژه‌ها می‌تواند راه بازگشت را باز نگه دارد.","alt":"پل سنگی روشن در باران، کوچه‌ای مه‌آلود و دروازه‌ای گشوده کنار رودخانه","image":"0005.svg"}),
  "owner-20261110-jaye-doxt":Object.freeze({"title":"جای دوخت","status":"owner_shared","fragments":["درزِ زیرِ بغلِ کت باز شد","تکهٔ خاکستری"],"summary":"چند ساعت مانده به مصاحبهٔ کاری ناهید، درز کت سرمه‌ای او در خیاطی باز می‌شود. پروین باید اشتباه خود در کم‌گذاشتنِ جای دوخت را بپذیرد؛ ترمیم محکم کت، بخشی خاکستری را نمایان می‌کند. داستانی دربارهٔ مسئولیت، ظاهر آراسته و آزادیِ حرکت.","alt":"کت سرمه‌ای روی میز خیاطی، دوخت مرمت‌شدهٔ خاکستری، قرقره و قیچی کنار آن","image":"owner-20261110-jaye-doxt.svg"}),
});
export function readerEditorial(story) {
  if(!story||typeof story.body!=="string")return null;
  const entry=EDITORIAL[String(story.id??"")];
  if(!entry||story.title!==entry.title||story.status!==entry.status)return null;
  if(!entry.fragments.every(part=>story.body.includes(part)))return null;
  return {summary:entry.summary,image:entry.image,alt:entry.alt};
}
