import { useEffect, useState } from "react";

function isRunningStandalone() {
  const standaloneByMedia = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const standaloneByNavigator = window.navigator?.standalone === true;
  return Boolean(standaloneByMedia || standaloneByNavigator);
}

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setIsInstalled(isRunningStandalone());

    const handler = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setPromptEvent(null);
      setShowHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) {
      setShowHelp((prev) => !prev);
      return;
    }

    promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleInstall}
        disabled={isInstalled}
        className="rounded-xl border border-goldLight/40 bg-goldLight/20 px-4 py-2 text-sm font-bold text-goldSoft transition hover:bg-goldLight/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isInstalled ? "التطبيق مثبت بالفعل" : "إضافة إلى الشاشة الرئيسية"}
      </button>

      {!promptEvent && !isInstalled && showHelp ? (
        <div className="max-w-xl rounded-xl border border-goldLight/25 bg-emeraldDeep/80 p-3 text-xs leading-6 text-slate-200">
          <p className="font-bold text-goldSoft">خطوات التثبيت:</p>
          <p>أندرويد (Chrome): افتح قائمة المتصفح ثم اختر تثبيت التطبيق أو خيار إضافة إلى الشاشة الرئيسية.</p>
          <p>آيفون (Safari): اضغط زر المشاركة ثم اختر إضافة إلى الشاشة الرئيسية.</p>
          <p>سطح المكتب (Chrome/Edge): اضغط أيقونة التثبيت بجانب شريط العنوان.</p>
        </div>
      ) : null}
    </div>
  );
}
