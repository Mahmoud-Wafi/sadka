import { useCallback, useEffect, useMemo, useState } from "react";
import HeroSection from "./components/HeroSection";
import InstallPrompt from "./components/InstallPrompt";
import JuzReaderModal from "./components/JuzReaderModal";
import KhatmaGrid from "./components/KhatmaGrid";
import StatsSection from "./components/StatsSection";
import TasbeehSection from "./components/TasbeehSection";
import DeveloperFooter from "./components/DeveloperFooter";
import {
  API_BASE_URL,
  getCurrentKhatma,
  getStats,
  getTasbeeh,
  incrementTasbeeh,
  parseApiError,
  reserveJuz
} from "./services/api";

const POLL_INTERVAL_MS = 10000;
const WS_RETRY_BASE_MS = 2500;
const WS_RETRY_MAX_MS = 30000;
const WS_MAX_RETRIES = 20;

function buildLiveWebSocketUrl() {
  const explicit = import.meta.env.VITE_WS_BASE_URL;
  if (explicit) {
    return explicit;
  }

  const parsed = new URL(API_BASE_URL);
  parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  parsed.pathname = "/ws/live/";
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

export default function App() {
  const [khatma, setKhatma] = useState(null);
  const [stats, setStats] = useState({});
  const [tasbeehCounters, setTasbeehCounters] = useState([]);
  const [name, setName] = useState("");
  const [lastReserved, setLastReserved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserveLoadingJuz, setReserveLoadingJuz] = useState(null);
  const [activeTasbeehPhrase, setActiveTasbeehPhrase] = useState("");
  const [selectedJuzForReading, setSelectedJuzForReading] = useState(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const [khatmaRes, statsRes, tasbeehRes] = await Promise.all([
        getCurrentKhatma(),
        getStats(),
        getTasbeeh()
      ]);

      setKhatma(khatmaRes.khatma);
      setStats(statsRes);
      setTasbeehCounters(tasbeehRes);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(parseApiError(error));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    let socket = null;
    let retryTimer = null;
    let stopped = false;
    let retryCount = 0;

    const connect = () => {
      try {
        socket = new WebSocket(buildLiveWebSocketUrl());
      } catch {
        retryTimer = setTimeout(connect, WS_RETRY_BASE_MS);
        return;
      }

      socket.onopen = () => {
        setLiveConnected(true);
        retryCount = 0;
      };

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.type && data.type !== "connected") {
            await loadData(true);
          }
        } catch {
          // نتجاهل الرسائل غير الصالحة.
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        setLiveConnected(false);
        if (!stopped) {
          if (retryCount >= WS_MAX_RETRIES) {
            return;
          }
          const delay = Math.min(WS_RETRY_BASE_MS * 2 ** retryCount, WS_RETRY_MAX_MS);
          retryCount += 1;
          retryTimer = setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      stopped = true;
      setLiveConnected(false);
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
    };
  }, [loadData]);

  const handleReserve = async (juzNumber) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("يرجى إدخال الاسم قبل حجز الجزء.");
      setSuccessMessage("");
      return;
    }

    setReserveLoadingJuz(juzNumber);
    setErrorMessage("");

    try {
      const response = await reserveJuz({ juz_number: juzNumber, name: trimmedName });
      setLastReserved({
        ...response.reserved_juz,
        khatma_number: response.khatma_number
      });

      if (response.khatma_completed_now) {
        setSuccessMessage(
          `تم اكتمال الختمة رقم ${response.khatma_number}، وبدأت الختمة رقم ${response.next_khatma_number}.`
        );
      } else {
        setSuccessMessage(`تم تأكيد حجز الجزء ${response.reserved_juz.juz_number} باسم ${trimmedName}.`);
      }

      await loadData(true);
    } catch (error) {
      setSuccessMessage("");
      setErrorMessage(parseApiError(error));
    } finally {
      setReserveLoadingJuz(null);
    }
  };

  const handleTasbeehIncrement = async (phrase) => {
    setActiveTasbeehPhrase(phrase);

    try {
      const updatedCounter = await incrementTasbeeh(phrase);
      setTasbeehCounters((prev) =>
        prev.map((counter) => (counter.id === updatedCounter.id ? updatedCounter : counter))
      );
    } catch (error) {
      setErrorMessage(parseApiError(error));
    } finally {
      setTimeout(() => setActiveTasbeehPhrase(""), 500);
    }
  };

  const handleOpenReader = (juzNumber) => {
    setSelectedJuzForReading(juzNumber);
  };

  const sortedAjzaa = useMemo(() => {
    return [...(khatma?.ajzaa || [])].sort((a, b) => a.juz_number - b.juz_number);
  }, [khatma]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-emeraldNight px-3 py-4 font-arabic text-white sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -right-16 top-6 text-[18rem] leading-none text-goldLight/20">☾</div>
        <div className="absolute left-8 bottom-8 text-[10rem] leading-none text-goldLight/10">☪</div>
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6">
        <HeroSection />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <InstallPrompt />
          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs ${
              liveConnected
                ? "border-emeraldSoft/70 bg-emeraldSoft/25 text-emerald-100"
                : "border-rubySoft/60 bg-rubyDark/60 text-rose-100"
            }`}
          >
            {liveConnected ? "تحديث مباشر متصل" : "تحديث مباشر غير متصل"}
          </span>
          <span className="text-xs leading-6 text-slate-300">يمكن إضافة التطبيق للشاشة الرئيسية للوصول السريع</span>
        </div>

        <StatsSection stats={stats} />

        <section className="rounded-2xl border border-goldLight/25 bg-emeraldDeep/80 p-3 shadow-luxury sm:p-5">
          <label htmlFor="name" className="mb-2 block text-sm text-goldSoft">
            اسم المشارك
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="اكتب اسمك لحجز الجزء"
            className="w-full rounded-xl border border-goldLight/30 bg-emeraldNight/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-goldLight focus:outline-none sm:px-4 sm:py-3 sm:text-base"
          />
        </section>

        {lastReserved ? (
          <section className="animate-floatIn rounded-2xl border border-goldLight/40 bg-goldLight/10 p-3 shadow-glow sm:p-5">
            <h2 className="text-lg font-bold text-goldSoft">تم حجزك بنجاح</h2>
            <p className="mt-1 text-base text-white sm:text-xl">
              الجزء {lastReserved.juz_number} في الختمة رقم {lastReserved.khatma_number}
            </p>
            <p className="text-sm text-slate-300">الاسم: {lastReserved.reserved_by}</p>
            <button
              type="button"
              onClick={() => handleOpenReader(lastReserved.juz_number)}
              className="mt-4 inline-flex w-full justify-center rounded-xl border border-goldLight/40 bg-goldLight/20 px-4 py-2 text-sm font-bold text-goldSoft transition hover:bg-goldLight/30 sm:w-auto"
            >
              اقرأ الجزء كاملًا الآن
            </button>
          </section>
        ) : null}

        {successMessage ? (
          <section className="rounded-xl border border-emeraldSoft/60 bg-emeraldSoft/30 px-4 py-3 text-sm text-emerald-100">
            {successMessage}
          </section>
        ) : null}

        {errorMessage ? (
          <section className="rounded-xl border border-rubySoft/60 bg-rubyDark/70 px-4 py-3 text-sm text-rose-100">{errorMessage}</section>
        ) : null}

        {loading ? (
          <section className="rounded-2xl border border-goldLight/20 bg-emeraldDeep/70 p-8 text-center text-goldSoft">
            جارٍ تحميل بيانات المنصة...
          </section>
        ) : (
          <>
            <KhatmaGrid
              ajzaa={sortedAjzaa}
              onReserve={handleReserve}
              onOpenReader={handleOpenReader}
              reserveLoadingJuz={reserveLoadingJuz}
            />
            <TasbeehSection
              counters={tasbeehCounters}
              onIncrement={handleTasbeehIncrement}
              activePhrase={activeTasbeehPhrase}
            />
          </>
        )}

        <DeveloperFooter />
      </div>

      <JuzReaderModal
        juzNumber={selectedJuzForReading}
        isOpen={Boolean(selectedJuzForReading)}
        onClose={() => setSelectedJuzForReading(null)}
      />
    </main>
  );
}
