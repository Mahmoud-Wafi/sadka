function formatRemaining(expiryValue) {
  if (!expiryValue) {
    return "";
  }
  const expiry = new Date(expiryValue);
  const diffMs = expiry.getTime() - Date.now();
  if (Number.isNaN(diffMs) || diffMs <= 0) {
    return "انتهت المهلة";
  }

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  if (hours <= 0) {
    return `متبقي ${remainMinutes} دقيقة`;
  }
  return `متبقي ${hours}س ${remainMinutes}د`;
}

function namesEqual(a, b) {
  return (a || "").trim() === (b || "").trim();
}

function JuzCard({
  juz,
  participantName,
  onReserve,
  onComplete,
  onOpenReader,
  reserveLoading,
  completeLoading
}) {
  const isReserved = Boolean(juz.reserved_by);
  const isCompleted = Boolean(juz.completed_at);
  const canComplete = isReserved && !isCompleted && namesEqual(participantName, juz.reserved_by);

  let cardClass = "border-emeraldSoft/70 bg-emeraldSoft/30 hover:-translate-y-1 hover:shadow-glow";
  let statusClass = "bg-emeraldSoft/60 text-emerald-100";
  let statusText = "متاح";
  let topBarClass = "bg-goldLight/75";

  if (isCompleted) {
    cardClass = "border-emerald-300/70 bg-emerald-800/45";
    statusClass = "bg-emerald-500/70 text-white";
    statusText = "مكتمل";
    topBarClass = "bg-emerald-300/85";
  } else if (isReserved) {
    cardClass = "border-rubySoft/60 bg-rubyDark/70";
    statusClass = "bg-rubySoft/60 text-white";
    statusText = "محجوز";
    topBarClass = "bg-rubySoft/75";
  }

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-3 backdrop-blur-sm transition duration-300 sm:p-4 ${cardClass}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${topBarClass}`} />
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-bold text-white sm:text-lg">الجزء {juz.juz_number}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>{statusText}</span>
      </div>

      {isCompleted ? (
        <div className="space-y-2 text-sm">
          <p className="text-emerald-100">أتمه: {juz.completed_by || juz.reserved_by}</p>
          <button
            type="button"
            onClick={() => onOpenReader(juz.juz_number)}
            className="inline-flex rounded-lg border border-goldLight/30 bg-goldLight/15 px-3 py-1.5 text-xs font-bold text-goldSoft hover:bg-goldLight/25"
          >
            إعادة قراءة الجزء
          </button>
        </div>
      ) : isReserved ? (
        <div className="space-y-2">
          <p className="text-sm text-rose-100">محجوز بواسطة {juz.reserved_by}</p>
          {juz.reservation_expires_at ? (
            <p className="text-xs text-slate-300">{formatRemaining(juz.reservation_expires_at)}</p>
          ) : null}
          <div className="grid grid-cols-1 gap-2">
            {canComplete ? (
              <button
                type="button"
                onClick={() => onComplete(juz.juz_number)}
                disabled={completeLoading}
                className="rounded-xl border border-emerald-200/45 bg-emerald-700/45 px-3 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-700/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {completeLoading ? "جارٍ التسجيل..." : "تم الإنجاز"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onOpenReader(juz.juz_number)}
              className="inline-flex justify-center rounded-lg border border-goldLight/30 bg-goldLight/15 px-3 py-1.5 text-xs font-bold text-goldSoft hover:bg-goldLight/25"
            >
              قراءة الجزء
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => onReserve(juz.juz_number)}
            disabled={reserveLoading}
            className="w-full rounded-xl border border-goldLight/40 bg-goldLight/15 px-3 py-2 text-sm font-bold text-goldSoft transition hover:bg-goldLight/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reserveLoading ? "جارٍ الحجز..." : "حجز الجزء"}
          </button>
          <button
            type="button"
            onClick={() => onOpenReader(juz.juz_number)}
            className="inline-flex w-full justify-center rounded-lg border border-emeraldSoft/70 bg-emeraldSoft/25 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emeraldSoft/35"
          >
            قراءة الجزء
          </button>
        </div>
      )}
    </article>
  );
}

export default function KhatmaGrid({
  ajzaa,
  participantName,
  onReserve,
  onComplete,
  onOpenReader,
  reserveLoadingJuz,
  completeLoadingJuz
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="relative inline-flex text-xl font-bold text-goldSoft sm:text-2xl">
          أجزاء الختمة الحالية
          <span className="absolute -bottom-1 right-0 h-[2px] w-20 rounded-full bg-goldLight/70" />
        </h2>
        <p className="text-sm text-slate-300">حجز، ثم قراءة، ثم اضغط تم الإنجاز</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {ajzaa.map((juz) => (
          <JuzCard
            key={juz.id}
            juz={juz}
            participantName={participantName}
            onReserve={onReserve}
            onComplete={onComplete}
            onOpenReader={onOpenReader}
            reserveLoading={reserveLoadingJuz === juz.juz_number}
            completeLoading={completeLoadingJuz === juz.juz_number}
          />
        ))}
      </div>
    </section>
  );
}
