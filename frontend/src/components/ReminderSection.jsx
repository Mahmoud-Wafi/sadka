export default function ReminderSection({
  enabled,
  onToggle,
  participantName,
  reminders,
  loading,
  onRequestCheck,
  onSendTestNotification
}) {
  const hasName = Boolean(participantName?.trim());
  const hasReminderData = reminders && typeof reminders.pending_count === "number";

  return (
    <section className="rounded-2xl border border-goldLight/25 bg-emeraldDeep/80 p-4 shadow-luxury sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-goldSoft sm:text-xl">تذكير القراءة</h2>
        <button
          type="button"
          onClick={onToggle}
          className={`rounded-full border px-3 py-1 text-xs font-bold ${
            enabled
              ? "border-emeraldSoft/70 bg-emeraldSoft/25 text-emerald-100"
              : "border-goldLight/35 bg-goldLight/10 text-goldSoft"
          }`}
        >
          {enabled ? "مفعّل" : "غير مفعّل"}
        </button>
      </div>

      <p className="mt-2 text-xs leading-6 text-slate-300">
        عند التفعيل، ستصلك إشعارات في التطبيق عندما يقترب انتهاء مهلة الجزء الذي حجزته.
      </p>

      {!hasName ? <p className="mt-2 text-xs text-amber-200">اكتب اسم المشارك أولًا لتفعيل التذكيرات.</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRequestCheck}
          disabled={loading || !hasName}
          className="rounded-lg border border-goldLight/35 bg-goldLight/10 px-3 py-1.5 text-xs font-bold text-goldSoft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "جارٍ الفحص..." : "فحص التذكيرات الآن"}
        </button>
        <button
          type="button"
          onClick={onSendTestNotification}
          className="rounded-lg border border-emeraldSoft/60 bg-emeraldSoft/20 px-3 py-1.5 text-xs font-bold text-emerald-100"
        >
          إشعار تجريبي
        </button>
      </div>

      {hasReminderData ? (
        <div className="mt-3 rounded-xl border border-goldLight/20 bg-emeraldNight/70 p-3 text-xs text-slate-200">
          <p>لديك {reminders.pending_count} جزء قيد القراءة.</p>
          <p>القريب انتهاءه خلال ساعة: {reminders.due_soon_count}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-400">اضغط "فحص التذكيرات الآن" لعرض حالتك الحالية.</p>
      )}
    </section>
  );
}
