function ImpactCard({ title, value, subtitle }) {
  return (
    <article className="rounded-xl border border-goldLight/20 bg-emeraldNight/70 p-3 text-center">
      <p className="text-xs text-slate-300">{title}</p>
      <p className="mt-1 text-xl font-bold text-goldSoft">{value}</p>
      {subtitle ? <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p> : null}
    </article>
  );
}

export default function RamadanImpactSection({ impact }) {
  if (!impact) {
    return null;
  }

  const completionPercent = Math.min(
    100,
    Math.round(((impact.total_completions || 0) * 100) / Math.max(impact.target_completions || 1, 1))
  );

  return (
    <section className="rounded-2xl border border-goldLight/25 bg-emeraldDeep/80 p-4 shadow-luxury sm:p-5">
      <h2 className="relative inline-flex text-xl font-bold text-goldSoft sm:text-2xl">
        الأثر الرمضاني المباشر
        <span className="absolute -bottom-1 right-0 h-[2px] w-20 rounded-full bg-goldLight/70" />
      </h2>

      <div className="mt-4 grid gap-2.5 min-[460px]:grid-cols-2 xl:grid-cols-4">
        <ImpactCard title="المشاركون النشطون" value={impact.active_participants ?? 0} />
        <ImpactCard title="الأجزاء المكتملة" value={impact.total_completions ?? 0} />
        <ImpactCard title="إجمالي التسبيح" value={impact.total_tasbeeh ?? 0} />
        <ImpactCard title="نقاط الأثر" value={impact.impact_score ?? 0} />
      </div>

      <div className="mt-3 rounded-xl border border-goldLight/20 bg-emeraldNight/70 p-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>تقدم الأجزاء نحو الهدف الرمضاني</span>
          <span>
            {impact.total_completions ?? 0} / {impact.target_completions ?? 0}
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-emeraldDeep/80">
          <div
            className="h-full rounded-full bg-goldLight/70 transition-all"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>
    </section>
  );
}
