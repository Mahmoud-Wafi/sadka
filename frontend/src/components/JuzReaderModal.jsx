import { useEffect, useMemo, useState } from "react";
import { getJuzContent, parseApiError } from "../services/api";

function groupAyahsBySurah(ayahs) {
  const map = new Map();

  ayahs.forEach((ayah) => {
    const key = `${ayah.surah_number}-${ayah.surah_name}`;
    if (!map.has(key)) {
      map.set(key, {
        surah_name: ayah.surah_name,
        surah_number: ayah.surah_number,
        ayahs: []
      });
    }
    map.get(key).ayahs.push(ayah);
  });

  return Array.from(map.values());
}

export default function JuzReaderModal({ juzNumber, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !juzNumber) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getJuzContent(juzNumber);
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(parseApiError(err));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [isOpen, juzNumber]);

  const groupedSurahs = useMemo(() => {
    if (!data?.ayahs) {
      return [];
    }
    return groupAyahsBySurah(data.ayahs);
  }, [data]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-3">
      <section className="flex h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-goldLight/40 bg-emeraldNight shadow-glow sm:h-[92vh]">
        <header className="flex flex-col gap-3 border-b border-goldLight/20 bg-emeraldDeep/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-goldSoft">قراءة الجزء {juzNumber}</h3>
            {data ? (
              <p className="text-xs text-slate-300">
                من {data.first_surah} إلى {data.last_surah} | مجموع الآيات: {data.ayah_count}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://quran.com/juz/${juzNumber}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-goldLight/30 bg-goldLight/15 px-3 py-1.5 text-xs font-bold text-goldSoft hover:bg-goldLight/25"
            >
              فتح خارجي
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-rubySoft/50 bg-rubyDark/70 px-3 py-1.5 text-xs font-bold text-rose-100"
            >
              إغلاق
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
          {loading ? <p className="text-center text-goldSoft">جارٍ تحميل نص الجزء...</p> : null}

          {error ? (
            <div className="rounded-xl border border-rubySoft/60 bg-rubyDark/70 px-4 py-3 text-sm text-rose-100">{error}</div>
          ) : null}

          {!loading && !error && groupedSurahs.length > 0 ? (
            <div className="space-y-4">
              {groupedSurahs.map((surah) => (
                <article
                  key={`${surah.surah_number}-${surah.surah_name}`}
                  className="rounded-xl border border-goldLight/20 bg-emeraldDeep/60 p-3 sm:p-4"
                >
                  <h4 className="mb-3 text-base font-bold text-goldSoft">{surah.surah_name}</h4>
                  <div className="space-y-2">
                    {surah.ayahs.map((ayah, index) => (
                      <p
                        key={`${ayah.surah_number}-${ayah.number_in_surah}-${index}`}
                        className="text-sm leading-8 text-slate-100 sm:text-base"
                      >
                        {ayah.text}
                        <span className="mr-2 rounded-full border border-goldLight/25 px-2 py-0.5 text-xs text-goldSoft">
                          {ayah.number_in_surah}
                        </span>
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
