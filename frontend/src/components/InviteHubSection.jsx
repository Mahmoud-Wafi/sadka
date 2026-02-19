function ShareLinkButton({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-lg border border-goldLight/35 bg-goldLight/10 px-3 py-1.5 text-xs font-bold text-goldSoft transition hover:bg-goldLight/20"
    >
      {label}
    </a>
  );
}

function buildShareText(profile, impact) {
  const completions = profile?.completions_count ?? 0;
  const invites = profile?.invited_people_count ?? 0;
  const totalCompletions = impact?.total_completions ?? 0;
  return `شاركني أجر الصدقة الجارية في رمضان 🌙
أكملت ${completions} أجزاء ودعوت ${invites} مشاركين.
إجمالي إنجاز المنصة الآن ${totalCompletions} جزء مكتمل.`;
}

export default function InviteHubSection({
  profile,
  impact,
  onCopyInviteLink,
  onNativeShare,
  onDownloadImpactCard
}) {
  if (!profile) {
    return null;
  }

  const inviteLink = profile.invite_link || "";
  const text = buildShareText(profile, impact);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${text}\n${inviteLink}`)}`;
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text}\n${inviteLink}`)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`;

  return (
    <section className="rounded-2xl border border-goldLight/25 bg-emeraldDeep/80 p-4 shadow-luxury sm:p-5">
      <h2 className="relative inline-flex text-xl font-bold text-goldSoft sm:text-2xl">
        رابط الدعوة الرمضاني
        <span className="absolute -bottom-1 right-0 h-[2px] w-20 rounded-full bg-goldLight/70" />
      </h2>

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-goldLight/20 bg-emeraldNight/70 p-3 text-center">
          <p className="text-xs text-slate-300">رمز الدعوة</p>
          <p className="mt-1 text-lg font-bold text-goldSoft">{profile.referral_code || "-"}</p>
        </div>
        <div className="rounded-xl border border-goldLight/20 bg-emeraldNight/70 p-3 text-center">
          <p className="text-xs text-slate-300">المدعوون</p>
          <p className="mt-1 text-lg font-bold text-goldSoft">{profile.invited_people_count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-goldLight/20 bg-emeraldNight/70 p-3 text-center">
          <p className="text-xs text-slate-300">نشطوا عبر رابطك</p>
          <p className="mt-1 text-lg font-bold text-goldSoft">{profile.invited_active_people_count ?? 0}</p>
        </div>
        <div className="rounded-xl border border-goldLight/20 bg-emeraldNight/70 p-3 text-center">
          <p className="text-xs text-slate-300">إجمالي أثر الدعوة</p>
          <p className="mt-1 text-lg font-bold text-goldSoft">{profile.invited_actions_count ?? 0}</p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-goldLight/25 bg-emeraldNight/70 p-3">
        <p className="text-xs text-slate-300">رابطك الشخصي</p>
        <p className="mt-1 break-all text-xs text-goldSoft">{inviteLink || "غير متاح"}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <ShareLinkButton href={whatsappHref} label="واتساب" />
        <ShareLinkButton href={telegramHref} label="تيليجرام" />
        <ShareLinkButton href={xHref} label="X" />
        <ShareLinkButton href={facebookHref} label="فيسبوك" />
        <button
          type="button"
          onClick={onCopyInviteLink}
          className="rounded-lg border border-emeraldSoft/60 bg-emeraldSoft/20 px-3 py-1.5 text-xs font-bold text-emerald-100"
        >
          نسخ الرابط
        </button>
        <button
          type="button"
          onClick={onNativeShare}
          className="rounded-lg border border-goldLight/35 bg-goldLight/10 px-3 py-1.5 text-xs font-bold text-goldSoft"
        >
          مشاركة مباشرة
        </button>
        <button
          type="button"
          onClick={onDownloadImpactCard}
          className="rounded-lg border border-goldLight/35 bg-goldLight/10 px-3 py-1.5 text-xs font-bold text-goldSoft"
        >
          تحميل بطاقة الأثر
        </button>
      </div>
    </section>
  );
}
