function JuzCard({ juz, onReserve, onOpenReader, loading }) {
  const isReserved = Boolean(juz.reserved_by);

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-3 backdrop-blur-sm transition duration-300 sm:p-4 ${
        isReserved
          ? "border-rubySoft/60 bg-rubyDark/70"
          : "border-emeraldSoft/70 bg-emeraldSoft/30 hover:-translate-y-1 hover:shadow-glow"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${
          isReserved ? "bg-rubySoft/75" : "bg-goldLight/75"
        }`}
      />
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-bold text-white sm:text-lg">الجزء {juz.juz_number}</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isReserved ? "bg-rubySoft/60 text-white" : "bg-emeraldSoft/60 text-emerald-100"
          }`}
        >
          {isReserved ? "محجوز" : "متاح"}
        </span>
      </div>

      {isReserved ? (
        <div className="space-y-3">
          <p className="text-sm text-rose-100">محجوز بواسطة {juz.reserved_by}</p>
          <button
            type="button"
            onClick={() => onOpenReader(juz.juz_number)}
            className="inline-flex rounded-lg border border-goldLight/30 bg-goldLight/15 px-3 py-1.5 text-xs font-bold text-goldSoft hover:bg-goldLight/25"
          >
            قراءة الجزء كاملًا
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => onReserve(juz.juz_number)}
            disabled={loading}
            className="w-full rounded-xl border border-goldLight/40 bg-goldLight/15 px-3 py-2 text-sm font-bold text-goldSoft transition hover:bg-goldLight/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "جارٍ الحجز..." : "حجز الجزء"}
          </button>
          <button
            type="button"
            onClick={() => onOpenReader(juz.juz_number)}
            className="inline-flex w-full justify-center rounded-lg border border-emeraldSoft/70 bg-emeraldSoft/25 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emeraldSoft/35"
          >
            قراءة الجزء كاملًا
          </button>
        </div>
      )}
    </article>
  );
}

export default function KhatmaGrid({ ajzaa, onReserve, onOpenReader, reserveLoadingJuz }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="relative inline-flex text-xl font-bold text-goldSoft sm:text-2xl">
          أجزاء الختمة الحالية
          <span className="absolute -bottom-1 right-0 h-[2px] w-20 rounded-full bg-goldLight/70" />
        </h2>
        <p className="text-sm text-slate-300">التحديث تلقائي كل 10 ثوانٍ</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {ajzaa.map((juz) => (
          <JuzCard
            key={juz.id}
            juz={juz}
            onReserve={onReserve}
            onOpenReader={onOpenReader}
            loading={reserveLoadingJuz === juz.juz_number}
          />
        ))}
      </div>
    </section>
  );
}
