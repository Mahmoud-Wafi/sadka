function TasbeehButton({ phrase, count, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-goldLight/25 bg-emeraldDeep/80 p-4 text-right shadow-luxury transition duration-300 hover:-translate-y-1 hover:shadow-glow sm:p-6 ${
        active ? "animate-pulseGold" : ""
      }`}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-goldLight/70" />
      <p className="text-sm font-bold leading-7 text-goldSoft sm:text-2xl">{phrase}</p>
      <p className="mt-3 text-xs text-slate-300 sm:mt-4 sm:text-sm">العدد الإجمالي</p>
      <p className="text-2xl font-extrabold text-white sm:text-4xl">{count}</p>
      <p className="mt-2 text-[11px] text-goldSoft/80 sm:mt-3 sm:text-xs">اضغط للزيادة</p>
    </button>
  );
}

export default function TasbeehSection({ counters, onIncrement, activePhrase }) {
  return (
    <section className="space-y-4">
      <h2 className="relative inline-flex text-xl font-bold text-goldSoft sm:text-2xl">
        التسبيح الجماعي
        <span className="absolute -bottom-1 right-0 h-[2px] w-20 rounded-full bg-goldLight/70" />
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {counters.map((counter) => (
          <TasbeehButton
            key={counter.id}
            phrase={counter.phrase}
            count={counter.count}
            active={activePhrase === counter.phrase}
            onClick={() => onIncrement(counter.phrase)}
          />
        ))}
      </div>
    </section>
  );
}
