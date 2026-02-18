import { useCallback, useEffect, useMemo, useState } from "react";
import ActivityFeedSection from "./components/ActivityFeedSection";
import DailyWirdSection from "./components/DailyWirdSection";
import DeveloperFooter from "./components/DeveloperFooter";
import DuaWallSection from "./components/DuaWallSection";
import HeroSection from "./components/HeroSection";
import InstallPrompt from "./components/InstallPrompt";
import JuzReaderModal from "./components/JuzReaderModal";
import KhatmaGrid from "./components/KhatmaGrid";
import KhatmaHistorySection from "./components/KhatmaHistorySection";
import ProfileStatsSection from "./components/ProfileStatsSection";
import ReminderSection from "./components/ReminderSection";
import StatsSection from "./components/StatsSection";
import TasbeehSection from "./components/TasbeehSection";
import {
  API_BASE_URL,
  completeJuz,
  createDua,
  getActivityFeed,
  getCurrentKhatma,
  getDailyWird,
  getDuaWall,
  getKhatmaHistory,
  getProfileStats,
  getReminders,
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
const REMINDER_INTERVAL_MS = 60000;
const NOTIFICATIONS_STORAGE_KEY = "sadaqah_notifications_enabled";
const NOTIFIED_REMINDERS_KEY = "sadaqah_notified_reminders";

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

function readStorageBool(key, defaultValue = false) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) {
      return defaultValue;
    }
    return value === "true";
  } catch {
    return defaultValue;
  }
}

function writeStorageBool(key, value) {
  try {
    localStorage.setItem(key, value ? "true" : "false");
  } catch {
    // ignore
  }
}

function readStorageJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorageJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function makeShareText({ actionLabel, name, juzNumber, khatmaNumber }) {
  return `بفضل الله ${name} ${actionLabel} الجزء ${juzNumber} في الختمة رقم ${khatmaNumber} على منصة الصدقة الجارية 🤍\nhttps://sadka-ten.vercel.app/`;
}

async function shareContributionText(payload) {
  const text = makeShareText(payload);
  if (navigator.share) {
    await navigator.share({
      title: "صدقة جارية",
      text,
      url: "https://sadka-ten.vercel.app/"
    });
    return;
  }

  await navigator.clipboard.writeText(text);
}

function downloadShareCard(payload) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const gradient = context.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, "#062216");
  gradient.addColorStop(1, "#145036");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(212,175,55,0.18)";
  context.beginPath();
  context.arc(880, 180, 120, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#e8d08b";
  context.font = "700 60px Tajawal, Arial";
  context.textAlign = "right";
  context.fillText("صدقة جارية على روح عبدالسلام عيسى", 980, 150);

  context.strokeStyle = "rgba(212,175,55,0.45)";
  context.lineWidth = 3;
  context.strokeRect(70, 230, 940, 670);

  context.fillStyle = "#ffffff";
  context.font = "700 52px Tajawal, Arial";
  context.fillText(`${payload.name}`, 940, 350);

  context.fillStyle = "#e8d08b";
  context.font = "700 46px Tajawal, Arial";
  context.fillText(`${payload.actionLabel} الجزء ${payload.juzNumber}`, 940, 450);
  context.fillText(`الختمة رقم ${payload.khatmaNumber}`, 940, 525);

  context.fillStyle = "#d9e6de";
  context.font = "600 34px Tajawal, Arial";
  context.fillText("اللهم تقبل واجعلها في ميزان حسناته", 940, 630);

  context.fillStyle = "#d4af37";
  context.font = "700 30px Tajawal, Arial";
  context.fillText("https://sadka-ten.vercel.app/", 940, 780);

  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = `sadaqah-${payload.juzNumber}.png`;
  link.click();
}

export default function App() {
  const [khatma, setKhatma] = useState(null);
  const [stats, setStats] = useState({});
  const [tasbeehCounters, setTasbeehCounters] = useState([]);
  const [activityEvents, setActivityEvents] = useState([]);
  const [duaMessages, setDuaMessages] = useState([]);
  const [khatmaHistory, setKhatmaHistory] = useState([]);
  const [dailyWird, setDailyWird] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [reminders, setReminders] = useState(null);
  const [name, setName] = useState("");
  const [lastReserved, setLastReserved] = useState(null);
  const [lastCompleted, setLastCompleted] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserveLoadingJuz, setReserveLoadingJuz] = useState(null);
  const [completeLoadingJuz, setCompleteLoadingJuz] = useState(null);
  const [duaLoading, setDuaLoading] = useState(false);
  const [activeTasbeehPhrase, setActiveTasbeehPhrase] = useState("");
  const [selectedJuzForReading, setSelectedJuzForReading] = useState(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(() =>
    readStorageBool(NOTIFICATIONS_STORAGE_KEY, false)
  );

  const loadProfileData = useCallback(async (participantName) => {
    const safeName = participantName.trim();
    if (!safeName) {
      setProfileStats(null);
      setReminders(null);
      return;
    }

    try {
      const [profileRes, remindersRes] = await Promise.all([
        getProfileStats(safeName),
        getReminders(safeName)
      ]);
      setProfileStats(profileRes);
      setReminders(remindersRes);
    } catch (error) {
      setErrorMessage(parseApiError(error));
    }
  }, []);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const [khatmaRes, statsRes, tasbeehRes, activityRes, duaRes, historyRes, wirdRes] = await Promise.all([
        getCurrentKhatma(),
        getStats(),
        getTasbeeh(),
        getActivityFeed(35),
        getDuaWall(),
        getKhatmaHistory(24),
        getDailyWird()
      ]);

      setKhatma(khatmaRes.khatma);
      setStats(statsRes);
      setTasbeehCounters(tasbeehRes);
      setActivityEvents(activityRes);
      setDuaMessages(duaRes);
      setKhatmaHistory(historyRes);
      setDailyWird(wirdRes);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(parseApiError(error));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const checkRemindersAndNotify = useCallback(
    async (participantName) => {
      const safeName = (participantName || name).trim();
      if (!safeName) {
        return;
      }

      try {
        const result = await getReminders(safeName);
        setReminders(result);

        if (!notificationEnabled || typeof Notification === "undefined" || Notification.permission !== "granted") {
          return;
        }

        const notifiedMap = readStorageJson(NOTIFIED_REMINDERS_KEY, {});
        let hasUpdates = false;

        for (const item of result.items || []) {
          if (!item.due_soon) {
            continue;
          }
          const key = `${item.khatma_number}-${item.juz_number}-${item.reservation_expires_at}`;
          if (notifiedMap[key]) {
            continue;
          }

          new Notification(`تذكير بقراءة الجزء ${item.juz_number}`, {
            body: `المتبقي ${item.minutes_left} دقيقة قبل انتهاء الحجز.`,
            icon: "/icons/icon-192.svg"
          });
          notifiedMap[key] = true;
          hasUpdates = true;
        }

        if (hasUpdates) {
          writeStorageJson(NOTIFIED_REMINDERS_KEY, notifiedMap);
        }
      } catch {
        // نترك التذكيرات صامتة عند الفشل.
      }
    },
    [name, notificationEnabled]
  );

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadProfileData(name);
    }, 500);
    return () => clearTimeout(handler);
  }, [name, loadProfileData]);

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

      socket.onmessage = async () => {
        await loadData(true);
        if (name.trim()) {
          await loadProfileData(name);
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
  }, [loadData, loadProfileData, name]);

  useEffect(() => {
    writeStorageBool(NOTIFICATIONS_STORAGE_KEY, notificationEnabled);
  }, [notificationEnabled]);

  useEffect(() => {
    if (!notificationEnabled || !name.trim()) {
      return undefined;
    }

    checkRemindersAndNotify(name);
    const interval = setInterval(() => checkRemindersAndNotify(name), REMINDER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkRemindersAndNotify, notificationEnabled, name]);

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
      setLastCompleted(null);
      setProfileStats(response.participant_stats || null);
      setSuccessMessage(`تم تأكيد حجز الجزء ${response.reserved_juz.juz_number} باسم ${trimmedName}.`);
      await loadData(true);
      await loadProfileData(trimmedName);
      await checkRemindersAndNotify(trimmedName);
    } catch (error) {
      setSuccessMessage("");
      setErrorMessage(parseApiError(error));
    } finally {
      setReserveLoadingJuz(null);
    }
  };

  const handleComplete = async (juzNumber) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("أدخل نفس اسم الحجز أولًا ثم اضغط تم الإنجاز.");
      setSuccessMessage("");
      return;
    }

    setCompleteLoadingJuz(juzNumber);
    setErrorMessage("");
    try {
      const response = await completeJuz({ juz_number: juzNumber, name: trimmedName });
      setLastCompleted({
        ...response.completed_juz,
        khatma_number: response.khatma_number
      });
      setLastReserved(null);
      setProfileStats(response.participant_stats || null);

      if (response.khatma_completed_now) {
        setSuccessMessage(
          `مبارك! اكتملت الختمة رقم ${response.khatma_number} وبدأت الختمة رقم ${response.next_khatma_number}.`
        );
      } else {
        setSuccessMessage(`تم تسجيل إنجاز الجزء ${response.completed_juz.juz_number}.`);
      }

      await loadData(true);
      await loadProfileData(trimmedName);
    } catch (error) {
      setSuccessMessage("");
      setErrorMessage(parseApiError(error));
    } finally {
      setCompleteLoadingJuz(null);
    }
  };

  const handleTasbeehIncrement = async (phrase) => {
    setActiveTasbeehPhrase(phrase);

    try {
      const updatedCounter = await incrementTasbeeh({ phrase, name: name.trim() });
      setTasbeehCounters((prev) =>
        prev.map((counter) => (counter.id === updatedCounter.id ? updatedCounter : counter))
      );

      if (name.trim()) {
        loadProfileData(name);
      }
    } catch (error) {
      setErrorMessage(parseApiError(error));
    } finally {
      setTimeout(() => setActiveTasbeehPhrase(""), 500);
    }
  };

  const handleCreateDua = async (payload) => {
    setDuaLoading(true);
    try {
      const created = await createDua(payload);
      setDuaMessages((prev) => [created, ...prev]);
      setSuccessMessage("تمت إضافة الدعاء بنجاح.");
      return true;
    } catch (error) {
      setErrorMessage(parseApiError(error));
      return false;
    } finally {
      setDuaLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (notificationEnabled) {
      setNotificationEnabled(false);
      return;
    }

    if (typeof Notification === "undefined") {
      setErrorMessage("متصفحك لا يدعم الإشعارات.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setErrorMessage("يرجى السماح بالإشعارات لتفعيل التذكير.");
      return;
    }

    setNotificationEnabled(true);
    setSuccessMessage("تم تفعيل تذكيرات القراءة.");
    await checkRemindersAndNotify(name);
  };

  const handleShareLastAction = async (actionType) => {
    const source = actionType === "complete" ? lastCompleted : lastReserved;
    if (!source) {
      return;
    }
    const payload = {
      actionLabel: actionType === "complete" ? "أتم قراءة" : "حجز",
      name: source.completed_by || source.reserved_by || name.trim(),
      juzNumber: source.juz_number,
      khatmaNumber: source.khatma_number
    };

    try {
      await shareContributionText(payload);
      setSuccessMessage("تم تجهيز رسالة المشاركة.");
    } catch {
      setErrorMessage("تعذر مشاركة النص الآن.");
    }
  };

  const handleDownloadCard = (actionType) => {
    const source = actionType === "complete" ? lastCompleted : lastReserved;
    if (!source) {
      return;
    }
    downloadShareCard({
      actionLabel: actionType === "complete" ? "أتم قراءة" : "حجز",
      name: source.completed_by || source.reserved_by || name.trim(),
      juzNumber: source.juz_number,
      khatmaNumber: source.khatma_number
    });
    setSuccessMessage("تم تحميل بطاقة المشاركة.");
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
          <span className="text-xs leading-6 text-slate-300">التحديث الفوري + تحديث احتياطي كل 10 ثوانٍ</span>
        </div>

        <DailyWirdSection wird={dailyWird} onApplyTasbeehPhrase={handleTasbeehIncrement} />
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
            placeholder="اكتب اسمك لحجز الجزء وحفظ إنجازك"
            className="w-full rounded-xl border border-goldLight/30 bg-emeraldNight/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-goldLight focus:outline-none sm:px-4 sm:py-3 sm:text-base"
          />
        </section>

        <ProfileStatsSection profile={profileStats} />
        <ReminderSection
          enabled={notificationEnabled}
          onToggle={handleToggleNotifications}
          reminders={reminders}
          onRequestCheck={() => checkRemindersAndNotify(name)}
        />

        {lastReserved ? (
          <section className="animate-floatIn rounded-2xl border border-goldLight/40 bg-goldLight/10 p-3 shadow-glow sm:p-5">
            <h2 className="text-lg font-bold text-goldSoft">تم حجزك بنجاح</h2>
            <p className="mt-1 text-base text-white sm:text-xl">
              الجزء {lastReserved.juz_number} في الختمة رقم {lastReserved.khatma_number}
            </p>
            <p className="text-sm text-slate-300">الاسم: {lastReserved.reserved_by}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedJuzForReading(lastReserved.juz_number)}
                className="rounded-xl border border-goldLight/40 bg-goldLight/20 px-4 py-2 text-sm font-bold text-goldSoft transition hover:bg-goldLight/30"
              >
                اقرأ الجزء الآن
              </button>
              <button
                type="button"
                onClick={() => handleShareLastAction("reserve")}
                className="rounded-xl border border-emeraldSoft/60 bg-emeraldSoft/25 px-4 py-2 text-sm font-bold text-emerald-100"
              >
                مشاركة نص الإنجاز
              </button>
              <button
                type="button"
                onClick={() => handleDownloadCard("reserve")}
                className="rounded-xl border border-goldLight/40 bg-goldLight/15 px-4 py-2 text-sm font-bold text-goldSoft"
              >
                تحميل بطاقة مشاركة
              </button>
            </div>
          </section>
        ) : null}

        {lastCompleted ? (
          <section className="animate-floatIn rounded-2xl border border-emeraldSoft/45 bg-emeraldSoft/25 p-3 shadow-glow sm:p-5">
            <h2 className="text-lg font-bold text-emerald-100">تم تسجيل الإنجاز</h2>
            <p className="mt-1 text-base text-white sm:text-xl">
              أتممت الجزء {lastCompleted.juz_number} في الختمة رقم {lastCompleted.khatma_number}
            </p>
            <p className="text-sm text-slate-200">أحسن الله أجرك وتقبل منك.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleShareLastAction("complete")}
                className="rounded-xl border border-emerald-100/50 bg-emerald-700/40 px-4 py-2 text-sm font-bold text-emerald-100"
              >
                مشاركة نص الإنجاز
              </button>
              <button
                type="button"
                onClick={() => handleDownloadCard("complete")}
                className="rounded-xl border border-goldLight/40 bg-goldLight/15 px-4 py-2 text-sm font-bold text-goldSoft"
              >
                تحميل بطاقة مشاركة
              </button>
            </div>
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
            <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
              <KhatmaGrid
                ajzaa={sortedAjzaa}
                participantName={name}
                onReserve={handleReserve}
                onComplete={handleComplete}
                onOpenReader={setSelectedJuzForReading}
                reserveLoadingJuz={reserveLoadingJuz}
                completeLoadingJuz={completeLoadingJuz}
              />
              <ActivityFeedSection events={activityEvents} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <TasbeehSection
                counters={tasbeehCounters}
                onIncrement={handleTasbeehIncrement}
                activePhrase={activeTasbeehPhrase}
              />
              <DuaWallSection
                defaultName={name}
                messages={duaMessages}
                onSubmit={handleCreateDua}
                loading={duaLoading}
              />
            </div>

            <KhatmaHistorySection history={khatmaHistory} />
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
