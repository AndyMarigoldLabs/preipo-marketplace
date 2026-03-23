import { PLATFORM_DISCLAIMER, NO_GENERAL_SOLICITATION_NOTICE } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-lg border border-amber-500/10 bg-amber-950/20 px-5 py-4 mb-5">
          <p className="text-[10px] font-semibold text-amber-500/50 uppercase tracking-widest mb-1">Important Notice</p>
          <p className="text-[11px] text-amber-500/40 leading-relaxed">{NO_GENERAL_SOLICITATION_NOTICE}</p>
        </div>
        <div className="rounded-lg border border-white/[.04] bg-white/[.01] px-5 py-4 mb-8">
          <p className="text-[11px] text-slate-600 leading-relaxed">{PLATFORM_DISCLAIMER}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-700">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600/30">
              <svg className="h-3 w-3 text-indigo-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            </div>
            <span>PreIPO</span>
          </div>
          <div className="flex items-center gap-5">
            <span>Ink Chain (Kraken L2)</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
