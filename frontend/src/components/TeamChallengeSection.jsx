import { useState } from "react";

export default function TeamChallengeSection({ participantName, profile, teams, loading, onCreate, onJoin }) {
  const [teamName, setTeamName] = useState("");
  const [targetPoints, setTargetPoints] = useState(300);
  const [joinCode, setJoinCode] = useState("");

  const hasName = Boolean(participantName?.trim());

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!hasName || !teamName.trim()) {
      return;
    }
    const ok = await onCreate({
      team_name: teamName.trim(),
      owner_name: participantName.trim(),
      target_points: Number(targetPoints) || 300
    });
    if (ok) {
      setTeamName("");
    }
  };

  const handleJoin = async (event) => {
    event.preventDefault();
    if (!hasName || !joinCode.trim()) {
      return;
    }
    const ok = await onJoin({
      team_code: joinCode.trim().toUpperCase(),
      name: participantName.trim()
    });
    if (ok) {
      setJoinCode("");
    }
  };

  return (
    <section className="rounded-2xl border border-goldLight/25 bg-emeraldDeep/80 p-4 shadow-luxury sm:p-5">
      <h2 className="relative inline-flex text-xl font-bold text-goldSoft sm:text-2xl">
        تحدي الفرق
        <span className="absolute -bottom-1 right-0 h-[2px] w-20 rounded-full bg-goldLight/70" />
      </h2>

      {!hasName ? <p className="mt-3 text-xs text-amber-200">اكتب اسمك أولًا للانضمام أو إنشاء فريق.</p> : null}

      {profile?.team ? (
        <div className="mt-3 rounded-xl border border-emeraldSoft/45 bg-emeraldSoft/20 p-3 text-sm text-emerald-100">
          <p className="font-bold">فريقك الحالي: {profile.team.name}</p>
          <p className="mt-1 text-xs">الرمز: {profile.team.code}</p>
          <p className="text-xs">
            النقاط: {profile.team.points} / {profile.team.target_points}
          </p>
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <form onSubmit={handleCreate} className="rounded-xl border border-goldLight/20 bg-emeraldNight/70 p-3">
          <h3 className="text-sm font-bold text-goldSoft">إنشاء فريق</h3>
          <input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder="اسم الفريق"
            className="mt-2 w-full rounded-lg border border-goldLight/25 bg-emeraldDeep/70 px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-goldLight focus:outline-none"
          />
          <input
            value={targetPoints}
            onChange={(event) => setTargetPoints(event.target.value)}
            type="number"
            min={50}
            max={5000}
            className="mt-2 w-full rounded-lg border border-goldLight/25 bg-emeraldDeep/70 px-3 py-2 text-xs text-white focus:border-goldLight focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !hasName || !teamName.trim()}
            className="mt-2 rounded-lg border border-goldLight/35 bg-goldLight/10 px-3 py-1.5 text-xs font-bold text-goldSoft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "جارٍ التنفيذ..." : "إنشاء الفريق"}
          </button>
        </form>

        <form onSubmit={handleJoin} className="rounded-xl border border-goldLight/20 bg-emeraldNight/70 p-3">
          <h3 className="text-sm font-bold text-goldSoft">الانضمام لفريق</h3>
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            placeholder="رمز الفريق"
            className="mt-2 w-full rounded-lg border border-goldLight/25 bg-emeraldDeep/70 px-3 py-2 text-xs text-white placeholder:text-slate-400 focus:border-goldLight focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !hasName || !joinCode.trim()}
            className="mt-2 rounded-lg border border-emeraldSoft/60 bg-emeraldSoft/20 px-3 py-1.5 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "جارٍ التنفيذ..." : "انضمام"}
          </button>
        </form>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-bold text-goldSoft">أفضل الفرق</h3>
        {(teams || []).length === 0 ? (
          <p className="text-xs text-slate-300">لا توجد فرق بعد.</p>
        ) : (
          teams.map((team) => (
            <article
              key={team.code}
              className="rounded-xl border border-goldLight/15 bg-emeraldNight/70 px-3 py-2 text-xs text-slate-200"
            >
              <p className="font-bold text-goldSoft">
                #{team.rank} {team.name} <span className="text-slate-400">({team.code})</span>
              </p>
              <p>
                النقاط: {team.points} / {team.target_points} | الأعضاء: {team.members_count}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
