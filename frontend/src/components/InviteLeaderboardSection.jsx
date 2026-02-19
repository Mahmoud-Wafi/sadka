export default function InviteLeaderboardSection({ leaders }) {
  return (
    <section className="rounded-2xl border border-goldLight/25 bg-emeraldDeep/80 p-4 shadow-luxury sm:p-5">
      <h2 className="relative inline-flex text-xl font-bold text-goldSoft sm:text-2xl">
        صدارة الدعوة في رمضان
        <span className="absolute -bottom-1 right-0 h-[2px] w-20 rounded-full bg-goldLight/70" />
      </h2>

      <div className="mt-4 space-y-2">
        {(leaders || []).length === 0 ? (
          <p className="text-sm text-slate-300">لا توجد بيانات دعوة بعد.</p>
        ) : (
          leaders.map((item) => (
            <article
              key={`${item.referral_code}-${item.rank}`}
              className="rounded-xl border border-goldLight/15 bg-emeraldNight/70 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-goldSoft">
                  #{item.rank} {item.name}
                </h3>
                <span className="rounded-full border border-emeraldSoft/50 bg-emeraldSoft/20 px-2 py-0.5 text-[11px] text-emerald-100">
                  النقاط {item.score}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-200">
                المدعوون: {item.invited_people_count} | الإجراءات المنجزة: {item.invited_actions_count}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
