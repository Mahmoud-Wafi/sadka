function formatTime(value) {
  if (!value) {
    return "";
  }
  try {
    return new Date(value).toLocaleString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit"
    });
  } catch {
    return "";
  }
}

export default function ActivityFeedSection({ events }) {
  return (
    <section className="rounded-2xl border border-goldLight/25 bg-emeraldDeep/80 p-4 shadow-luxury sm:p-5">
      <h2 className="relative inline-flex text-xl font-bold text-goldSoft sm:text-2xl">
        النشاط المباشر
        <span className="absolute -bottom-1 right-0 h-[2px] w-20 rounded-full bg-goldLight/70" />
      </h2>

      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <p className="text-sm text-slate-300">لا يوجد نشاط بعد.</p>
        ) : (
          events.map((event) => (
            <article key={event.id} className="rounded-xl border border-goldLight/15 bg-emeraldNight/70 px-3 py-2">
              <p className="text-sm text-slate-100">{event.message}</p>
              <p className="mt-1 text-[11px] text-slate-400">{formatTime(event.created_at)}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
