export default function DeveloperFooter() {
  return (
    <footer className="relative overflow-hidden rounded-3xl border border-goldLight/25 bg-emeraldDeep/80 p-5 shadow-luxury sm:p-6">
      <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-goldLight/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-emeraldSoft/20 blur-2xl" />

      <div className="relative text-center">
        <p className="text-xs tracking-wide text-slate-300">تم تطوير المنصة بواسطة</p>
        <h3 className="mt-2 text-2xl font-extrabold text-goldSoft sm:text-3xl">محمود وافي</h3>
        <p className="mt-1 text-lg font-semibold text-white">Mahmoud Wafi</p>
        <p className="mt-2 inline-flex rounded-full border border-goldLight/35 bg-goldLight/10 px-4 py-1 text-xs font-bold text-goldSoft sm:text-sm">
          Software Engineer
        </p>
      </div>
    </footer>
  );
}
