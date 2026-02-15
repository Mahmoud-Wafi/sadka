import { useState } from "react";

const HERO_IMAGE_SRC = "/images/abdelsalam.jpg";
const FALLBACK_SVG = encodeURI(
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800' viewBox='0 0 600 800'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%230b2c21'/><stop offset='100%' stop-color='%23145036'/></linearGradient></defs><rect width='600' height='800' fill='url(%23g)'/><circle cx='300' cy='280' r='115' fill='%23d4af37' fill-opacity='0.25'/><rect x='150' y='420' width='300' height='230' rx='28' fill='%23d4af37' fill-opacity='0.2'/><text x='300' y='730' text-anchor='middle' font-size='38' fill='%23e8d08b' font-family='Arial'>عبدالسلام عيسى</text></svg>"
);

export default function HeroSection() {
  const [imageError, setImageError] = useState(false);
  const [showPrayerMobile, setShowPrayerMobile] = useState(false);
  const fatihaAyat = [
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    "الرَّحْمَٰنِ الرَّحِيمِ",
    "مَالِكِ يَوْمِ الدِّينِ",
    "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
    "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-goldLight/20 bg-emeraldDeep/70 p-3 shadow-luxury backdrop-blur-sm animate-floatIn sm:p-6 lg:p-8">
      <div className="absolute -top-16 -left-16 text-[8rem] leading-none text-goldLight/10 select-none sm:text-[10rem]">☪</div>

      <div className="mb-4 grid items-start gap-3 lg:mb-5 lg:gap-4 lg:grid-cols-[230px_1fr]">
        <div className="mx-auto w-full max-w-[170px] sm:max-w-[210px] lg:max-w-[240px]">
          <div className="overflow-hidden rounded-2xl border border-goldLight/35 bg-emeraldNight/70 shadow-glow">
            <img
              src={imageError ? FALLBACK_SVG : HERO_IMAGE_SRC}
              alt="عبدالسلام عيسى"
              onError={() => setImageError(true)}
              className="h-auto w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-goldLight/25 bg-emeraldNight/60 p-3 sm:p-5">
          <h2 className="text-lg font-bold leading-8 text-goldSoft sm:text-xl md:text-2xl">
            الفاتحة على روح عبدالسلام عيسى
          </h2>

          <button
            type="button"
            onClick={() => setShowPrayerMobile((prev) => !prev)}
            className="mt-2 inline-flex rounded-lg border border-goldLight/35 bg-goldLight/10 px-3 py-1 text-xs font-bold text-goldSoft md:hidden"
          >
            {showPrayerMobile ? "إخفاء الفاتحة والدعاء" : "عرض الفاتحة والدعاء"}
          </button>

          <div className={`${showPrayerMobile ? "mt-3 block" : "hidden"} space-y-2 text-sm leading-7 text-slate-100 md:hidden`}>
            {fatihaAyat.map((ayah, index) => (
              <p key={ayah}>
                <span className="ml-2 text-goldSoft">﴿{index + 1}﴾</span>
                {ayah}
              </p>
            ))}
            <p className="mt-3 rounded-xl border border-goldLight/20 bg-goldLight/10 px-3 py-2 text-sm leading-7 text-goldSoft">
              اللهم اغفر لعبدالسلام عيسى وارحمه، واجعل قبره روضة من رياض الجنة، واجعل هذه الصدقة الجارية نورًا له
              ورفعةً في درجاته.
            </p>
          </div>

          <div className="mt-3 hidden space-y-2 text-sm leading-7 text-slate-100 md:block md:text-base">
            {fatihaAyat.map((ayah, index) => (
              <p key={ayah}>
                <span className="ml-2 text-goldSoft">﴿{index + 1}﴾</span>
                {ayah}
              </p>
            ))}
            <p className="mt-4 rounded-xl border border-goldLight/20 bg-goldLight/10 px-3 py-2 text-sm leading-7 text-goldSoft">
              اللهم اغفر لعبدالسلام عيسى وارحمه، واجعل قبره روضة من رياض الجنة، واجعل هذه الصدقة الجارية نورًا له
              ورفعةً في درجاته.
            </p>
          </div>
        </div>
      </div>

      <p className="mb-3 inline-flex rounded-full border border-goldLight/30 bg-goldLight/10 px-4 py-1 text-xs text-goldSoft sm:text-sm">
        منصة رمضانية تفاعلية
      </p>
      <h1 className="text-2xl font-bold leading-tight text-goldSoft sm:text-3xl md:text-5xl">
        صدقة جارية على روح عبدالسلام عيسى
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base md:mt-4 md:text-lg">
        ساهم بحجز جزء من القرآن، وشارك في التسبيح الجماعي، واجعل أثر الخير مستمرًا للجميع.
      </p>
    </section>
  );
}
