'use client';

import Link from 'next/link';
import Image from 'next/image';
import { NO_GENERAL_SOLICITATION_NOTICE } from '@/lib/constants';

export default function HomePage() {
  return (
    <div>
      {/* Fixed header spacer */}
      <div className="h-14" />

      {/* Compliance strip */}
      <div className="border-b border-amber-500/10 bg-amber-950/30 py-1.5">
        <p className="text-center text-[11px] text-amber-500/60 tracking-wide">
          {NO_GENERAL_SOLICITATION_NOTICE}
        </p>
      </div>

      {/* ===== HERO — asymmetric split ===== */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-16 items-start pt-16 pb-20 lg:pt-24 lg:pb-28">

            {/* Left: copy */}
            <div className="max-w-xl">
              <p className="text-[13px] font-mono font-medium text-indigo-400/80 mb-6 tracking-wide">FOR ACCREDITED INVESTORS</p>

              <h1 className="text-[2.75rem] sm:text-5xl font-extrabold tracking-tight leading-[1.08] text-white">
                Find pre-IPO<br />secondary positions.
              </h1>

              <p className="mt-5 text-[15px] text-slate-400 leading-relaxed max-w-md">
                Sellers prove share ownership on-chain. Buyers prove capital.
                You find each other here. You transact on your own terms.
              </p>

              <p className="mt-3 text-[13px] text-slate-600 leading-relaxed max-w-md">
                Not a broker-dealer. Not an ATS. Not an exchange.
                A verified bulletin board — nothing more.
              </p>

              <div className="mt-8 flex items-center gap-3">
                <Link href="/onboarding" className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
                  Get Verified
                  <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
                <Link href="/listings" className="inline-flex items-center rounded-lg border border-white/[.08] px-5 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                  Browse Listings
                </Link>
              </div>

              {/* Trust line */}
              <div className="mt-10 flex items-center gap-5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <svg className="h-3 w-3 text-indigo-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  Ink Chain (Kraken L2)
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="h-3 w-3 text-indigo-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                  KYC via Persona
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="h-3 w-3 text-indigo-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" /></svg>
                  USDC settlement
                </div>
              </div>
            </div>

            {/* Right: product preview */}
            <div className="mt-12 lg:mt-4">
              <div className="rounded-xl border border-white/[.06] bg-white/[.015] overflow-hidden shadow-2xl shadow-black/40">
                {/* Tab bar */}
                <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="rounded-md bg-white/5 px-12 py-1 text-[10px] text-slate-600 font-mono">preipo.market/listings</div>
                  </div>
                </div>

                {/* Listing cards */}
                <div className="p-5 space-y-3">
                  <PreviewCard logo="/logos/spacex.svg" name="SpaceX" detail="Common · 100–500 shares" price="$95 – $110" valuation="Implied $250B" verified />
                  <PreviewCard logo="/logos/stripe.svg" name="Stripe" detail="Preferred · 50–200 shares" price="$28 – $35" valuation="Implied $65B" verified />
                  <div className="rounded-lg border border-white/[.06] bg-white/[.02] p-4 opacity-40">
                    <div className="flex items-center gap-3">
                      <Image src="/logos/anduril.svg" alt="Anduril" width={36} height={36} className="h-9 w-9 rounded-lg" />
                      <div>
                        <div className="text-sm font-semibold text-white">Anduril</div>
                        <div className="text-[11px] text-slate-500">Preferred · 75–300 shares</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== VERIFICATION MECHANICS ===== */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-lg mb-14">
            <p className="text-[13px] font-mono font-medium text-indigo-400/80 mb-3 tracking-wide">HOW TRUST WORKS HERE</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
              Both sides of the table prove what they claim before anyone talks.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seller side */}
            <div className="rounded-xl border border-white/[.06] bg-white/[.015] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" /></svg>
                </div>
                <h3 className="text-base font-semibold text-white">Sellers prove shares</h3>
              </div>
              <div className="space-y-4">
                <MethodRow num="1" title="Document hash" desc="Upload stock certificate or cap table entry. SHA-256 hash goes on-chain. Document stays with you." />
                <MethodRow num="2" title="Transfer agent verification" desc="Third-party agent confirms you hold what you claim. Verifier address recorded on-chain." />
                <MethodRow num="3" title="Escrow attestation" desc="Shares held in escrow. Escrow agent signs attestation recorded to the ListingRegistry contract." />
              </div>
            </div>

            {/* Buyer side */}
            <div className="rounded-xl border border-white/[.06] bg-white/[.015] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" /></svg>
                </div>
                <h3 className="text-base font-semibold text-white">Buyers prove funds</h3>
              </div>
              <div className="space-y-4">
                <MethodRow num="1" title="Stablecoin wallet" desc="USDC/USDT/PYUSD balance checked on-chain. Tiered: <$25K, $25K–$250K, $250K–$1M, $1M+." />
                <MethodRow num="2" title="Bank verification" desc="Plaid-verified bank balance. Account read-only — no transactions. Proof expires after 30 days." />
                <MethodRow num="3" title="Letter of credit" desc="Upload institution LOC. Document hashed, stored on IPFS, hash recorded to chain. 30-day expiry." />
              </div>
            </div>
          </div>

          {/* Credential flow pipeline */}
          <div className="mt-12 rounded-xl border border-white/[.06] bg-white/[.015] px-8 py-6">
            <div className="flex items-center gap-2 mb-5">
              <svg className="h-4 w-4 text-indigo-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
              <span className="text-[13px] font-medium text-white/60">Onboarding credential flow</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0">
              <PipelineStep icon="wallet" label="Connect wallet" />
              <PipelineArrow />
              <PipelineStep icon="user" label="Persona KYC" />
              <PipelineArrow />
              <PipelineStep icon="check" label="Attest accredited status" />
              <PipelineArrow />
              <PipelineStep icon="shield" label="On-chain credential issued" color="emerald" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHAT THIS IS / ISN'T ===== */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h3 className="text-lg font-bold text-white mb-6">What this is</h3>
              <div className="space-y-4">
                <CheckItem>A <span className="text-white font-medium">bulletin board</span> where verified holders list pre-IPO positions they want to sell</CheckItem>
                <CheckItem><span className="text-white font-medium">Cryptographic proof</span> that a seller owns shares and a buyer has capital — before anyone enters a deal room</CheckItem>
                <CheckItem><span className="text-white font-medium">Private deal rooms</span> for document exchange and signing a deal memo between two parties</CheckItem>
                <CheckItem><span className="text-white font-medium">On-chain attestation only</span> — identity hashes, listing metadata, deal memos. No assets held.</CheckItem>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-6">What this is not</h3>
              <div className="space-y-4">
                <CrossItem>Not a broker-dealer. We don&apos;t execute, arrange, or facilitate transactions.</CrossItem>
                <CrossItem>Not an ATS or exchange. No order book, no matching engine, no settlement.</CrossItem>
                <CrossItem>Not custodial. No assets, funds, or securities are held by the platform at any time.</CrossItem>
                <CrossItem>Not investment advice. Consult your own legal and financial counsel before any transaction.</CrossItem>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA STRIP ===== */}
      <section className="border-b border-white/5 bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-6 py-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Verified and ready to browse?</h2>
            <p className="text-sm text-slate-500">Active listings from verified sellers. All compliance flags visible.</p>
          </div>
          <Link href="/listings" className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shrink-0">
            View Listings
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ── Helper components ── */

function PreviewCard({ logo, name, detail, price, valuation, verified }: { logo: string; name: string; detail: string; price: string; valuation: string; verified?: boolean }) {
  return (
    <div className="rounded-lg border border-white/[.06] bg-white/[.02] p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Image src={logo} alt={name} width={36} height={36} className="h-9 w-9 rounded-lg" />
          <div>
            <div className="text-sm font-semibold text-white">{name}</div>
            <div className="text-[11px] text-slate-500">{detail}</div>
          </div>
        </div>
        {verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            Verified
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-lg font-bold text-white">{price}</span>
          <span className="text-[11px] text-slate-600 ml-1">/ share</span>
        </div>
        <div className="text-[11px] text-slate-500">{valuation}</div>
      </div>
    </div>
  );
}

function MethodRow({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/5 text-[10px] font-bold text-slate-500 font-mono">{num}</div>
      <div>
        <div className="text-sm font-medium text-white/80">{title}</div>
        <div className="text-[13px] text-slate-500">{desc}</div>
      </div>
    </div>
  );
}

function PipelineStep({ icon, label, color = 'indigo' }: { icon: string; label: string; color?: string }) {
  const bgColor = color === 'emerald' ? 'bg-emerald-500/15' : 'bg-indigo-500/15';
  const textColor = color === 'emerald' ? 'text-emerald-400' : 'text-indigo-400';
  const labelColor = color === 'emerald' ? 'text-emerald-400' : 'text-white/70';

  const icons: Record<string, React.ReactNode> = {
    wallet: <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />,
    user: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    shield: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />,
  };

  return (
    <div className="flex items-center gap-2.5">
      <div className={`h-7 w-7 rounded-md ${bgColor} flex items-center justify-center`}>
        <svg className={`h-3.5 w-3.5 ${textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{icons[icon]}</svg>
      </div>
      <span className={`text-sm ${labelColor} font-medium`}>{label}</span>
    </div>
  );
}

function PipelineArrow() {
  return (
    <svg className="hidden sm:block h-3.5 w-8 text-white/10 shrink-0" fill="none" viewBox="0 0 32 14"><path d="M0 7h28m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <svg className="h-4 w-4 mt-0.5 text-emerald-500/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
      <p className="text-[14px] text-slate-400 leading-relaxed">{children}</p>
    </div>
  );
}

function CrossItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <svg className="h-4 w-4 mt-0.5 text-red-500/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      <p className="text-[14px] text-slate-500 leading-relaxed">{children}</p>
    </div>
  );
}
