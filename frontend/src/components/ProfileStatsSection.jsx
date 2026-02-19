function Stat({ title, value }) {
  return (
    <div className="rounded-xl border border-goldLight/20 bg-emeraldNight/70 p-3 text-center">
      <p className="text-xs text-slate-300">{title}</p>
      <p className="mt-1 text-xl font-bold text-goldSoft">{value}</p>
    </div>
  );
}

export default function ProfileStatsSection({ profile, onDownloadCertificate }) {
  if (!profile) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-goldLight/25 bg-emeraldDeep/80 p-4 shadow-luxury sm:p-5">
      <h2 className="text-lg font-bold text-goldSoft sm:text-xl">إحصائي الشخصي: {profile.name}</h2>

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <Stat title="الأجزاء المحجوزة" value={profile.reservations_count ?? 0} />
        <Stat title="الأجزاء المكتملة" value={profile.completions_count ?? 0} />
        <Stat title="التسبيحات" value={profile.tasbeeh_count ?? 0} />
        <Stat title="الأدعية" value={profile.dua_count ?? 0} />
        <Stat title="المدعوون" value={profile.invited_people_count ?? 0} />
        <Stat title="سلسلة النشاط" value={`${profile.streak_days ?? 0} يوم`} />
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

      <div className="mt-3 rounded-xl border border-goldLight/20 bg-emeraldNight/70 p-3">
        <p className="text-sm font-bold text-goldSoft">الشهادة الرمضانية</p>
        {profile.certificate?.eligible ? (
          <>
            <p className="mt-1 text-xs text-emerald-100">{profile.certificate.title}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(profile.certificate.milestones || []).map((item) => (
                <span key={item} className="rounded-full border border-emeraldSoft/50 bg-emeraldSoft/20 px-2 py-0.5 text-[11px] text-emerald-100">
                  {item}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={onDownloadCertificate}
              className="mt-2 rounded-lg border border-goldLight/35 bg-goldLight/10 px-3 py-1.5 text-xs font-bold text-goldSoft"
            >
              تحميل الشهادة
            </button>
          </>
        ) : (
          <p className="mt-1 text-xs text-slate-300">أكمل المزيد لتحصل على شهادة رمضان.</p>
        )}
      </div>
    </section>
  );
}
