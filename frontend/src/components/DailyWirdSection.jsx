export default function DailyWirdSection({ wird, onApplyTasbeehPhrase }) {
  if (!wird) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-goldLight/25 bg-emeraldDeep/80 p-4 shadow-luxury sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-goldSoft sm:text-xl">{wird.title}</h2>
        <span className="rounded-full border border-goldLight/35 bg-goldLight/10 px-3 py-1 text-xs text-goldSoft">
          {wird.date}
        </span>
      </div>
      <p className="mt-2 text-sm leading-7 text-slate-100">{wird.body}</p>
      <p className="mt-3 rounded-xl border border-goldLight/20 bg-goldLight/10 px-3 py-2 text-sm leading-7 text-goldSoft">
        {wird.dua}
      </p>
      <button
        type="button"
        onClick={() => onApplyTasbeehPhrase?.(wird.tasbeeh_phrase)}
        className="mt-3 rounded-lg border border-emeraldSoft/60 bg-emeraldSoft/25 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emeraldSoft/35"
      >
        اجعل الذكر المقترح: {wird.tasbeeh_phrase}
      </button>
    </section>
  );
}
