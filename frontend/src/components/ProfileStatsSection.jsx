function Stat({ title, value }) {
  return (
    <div className="rounded-xl border border-goldLight/20 bg-emeraldNight/70 p-3 text-center">
      <p className="text-xs text-slate-300">{title}</p>
      <p className="mt-1 text-xl font-bold text-goldSoft">{value}</p>
    </div>
  );
}

export default function ProfileStatsSection({ profile }) {
  if (!profile) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-goldLight/25 bg-emeraldDeep/80 p-4 shadow-luxury sm:p-5">
      <h2 className="text-lg font-bold text-goldSoft sm:text-xl">إحصائي الشخصي: {profile.name}</h2>

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat title="الأجزاء المحجوزة" value={profile.reservations_count ?? 0} />
        <Stat title="الأجزاء المكتملة" value={profile.completions_count ?? 0} />
        <Stat title="التسبيحات" value={profile.tasbeeh_count ?? 0} />
        <Stat title="حجوزات قيد القراءة" value={profile.pending_reservations ?? 0} />
      </div>

      <div className="mt-3">
        <p className="mb-2 text-sm text-slate-300">الشارات</p>
        <div className="flex flex-wrap gap-2">
          {(profile.badges || []).length === 0 ? (
            <span className="text-xs text-slate-400">ابدأ بالمشاركة لتحصل على شاراتك.</span>
          ) : (
            profile.badges.map((badge) => (
              <span
                key={badge.key}
                className="rounded-full border border-goldLight/35 bg-goldLight/10 px-3 py-1 text-xs font-bold text-goldSoft"
                title={badge.description}
              >
                {badge.title}
              </span>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
