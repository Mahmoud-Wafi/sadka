function formatDateTime(value) {
  if (!value) {
    return "غير متاح";
  }
  try {
    return new Date(value).toLocaleString("ar-EG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return value;
  }
}

export default function KhatmaHistorySection({ history }) {
  return (
    <section className="rounded-2xl border border-goldLight/25 bg-emeraldDeep/80 p-4 shadow-luxury sm:p-5">
      <h2 className="relative inline-flex text-xl font-bold text-goldSoft sm:text-2xl">
        سجل الختمات المكتملة
        <span className="absolute -bottom-1 right-0 h-[2px] w-20 rounded-full bg-goldLight/70" />
      </h2>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {history.length === 0 ? (
          <p className="text-sm text-slate-300">لا توجد ختمات مكتملة حتى الآن.</p>
        ) : (
          history.map((item) => (
            <article key={item.khatma_number} className="rounded-xl border border-goldLight/20 bg-emeraldNight/70 p-3">
              <h3 className="text-base font-bold text-goldSoft">الختمة رقم {item.khatma_number}</h3>
              <p className="mt-1 text-xs text-slate-300">اكتملت في: {formatDateTime(item.completed_at)}</p>
              <p className="mt-1 text-sm text-slate-100">الأجزاء المكتملة: {item.completed_juz_count} / 30</p>
              <p className="text-sm text-slate-100">عدد المتمّين: {item.participants_count}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
