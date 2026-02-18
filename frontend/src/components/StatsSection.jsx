function StatCard({ title, value, subtitle, tone }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-goldLight/20 bg-emeraldDeep/70 p-4 shadow-luxury sm:p-5">
      <div className={`absolute inset-x-0 top-0 h-1 ${tone}`} />
      <div className="pointer-events-none absolute -left-8 -top-8 h-20 w-20 rounded-full bg-goldLight/10 blur-2xl" />
      <p className="relative text-sm text-slate-300">{title}</p>
      <p className="relative mt-2 text-2xl font-bold text-goldSoft sm:text-3xl">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
    </article>
  );
}

export default function StatsSection({ stats }) {
  return (
    <section className="grid gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard title="الختمات المكتملة" value={stats.total_completed_khatmas ?? 0} tone="bg-goldLight/80" />
      <StatCard title="الختمة الحالية" value={stats.current_khatma_number ?? 1} tone="bg-emeraldSoft/80" />
      <StatCard title="الأجزاء المحجوزة" value={`${stats.reserved_count ?? 0} / 30`} tone="bg-goldSoft/80" />
      <StatCard title="الأجزاء المكتملة" value={`${stats.completed_count ?? 0} / 30`} tone="bg-emerald-200/80" />
      <StatCard title="إجمالي المشاركين" value={stats.total_participants ?? 0} tone="bg-emerald-300/80" />
      <StatCard title="قرب انتهاء المهلة" value={stats.due_soon_count ?? 0} tone="bg-rubySoft/75" subtitle="خلال ساعة" />
    </section>
  );
}
