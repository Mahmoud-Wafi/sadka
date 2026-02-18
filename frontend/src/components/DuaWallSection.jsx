import { useState } from "react";

export default function DuaWallSection({ defaultName, messages, onSubmit, loading }) {
  const [content, setContent] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!defaultName.trim() || !content.trim()) {
      return;
    }

    const ok = await onSubmit({ name: defaultName.trim(), content: content.trim() });
    if (ok) {
      setContent("");
    }
  };

  return (
    <section className="rounded-2xl border border-goldLight/25 bg-emeraldDeep/80 p-4 shadow-luxury sm:p-5">
      <h2 className="relative inline-flex text-xl font-bold text-goldSoft sm:text-2xl">
        حائط الدعاء
        <span className="absolute -bottom-1 right-0 h-[2px] w-20 rounded-full bg-goldLight/70" />
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-2">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="اكتب دعاءً طيبًا له"
          maxLength={500}
          className="h-24 w-full resize-none rounded-xl border border-goldLight/25 bg-emeraldNight/70 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-goldLight focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{content.length}/500</span>
          <button
            type="submit"
            disabled={loading || !defaultName.trim() || !content.trim()}
            className="rounded-lg border border-goldLight/40 bg-goldLight/15 px-3 py-1.5 text-xs font-bold text-goldSoft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "جارٍ الإرسال..." : "إضافة الدعاء"}
          </button>
        </div>
      </form>

      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-300">لم تُضف أدعية بعد.</p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className="rounded-xl border border-goldLight/15 bg-emeraldNight/70 px-3 py-2">
              <p className="text-sm leading-7 text-slate-100">{message.content}</p>
              <p className="mt-1 text-[11px] text-goldSoft">{message.name}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
