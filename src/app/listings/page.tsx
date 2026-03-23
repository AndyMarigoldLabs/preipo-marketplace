'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useListings } from '@/hooks/useListings';
import { formatCurrency, formatValuationShort, formatPosMethod, daysAgo, daysUntil } from '@/lib/utils';
import { NO_GENERAL_SOLICITATION_NOTICE, SHARE_CLASSES } from '@/lib/constants';
import type { ListingFilters, ShareClass } from '@/lib/types';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low' },
  { value: 'price_desc', label: 'Price: High' },
  { value: 'valuation', label: 'Valuation' },
];

export default function ListingsPage() {
  const { loading, filterListings } = useListings();
  const [search, setSearch] = useState('');
  const [shareClass, setShareClass] = useState('');
  const [sortBy, setSortBy] = useState<ListingFilters['sortBy']>('newest');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filtered = useMemo(() => {
    return filterListings({
      companyName: search || undefined,
      shareClass: (shareClass || undefined) as ShareClass | undefined,
      posVerifiedOnly: verifiedOnly || undefined,
      sortBy,
    });
  }, [search, shareClass, sortBy, verifiedOnly, filterListings]);

  const verified = filtered.filter(l => l.posVerified);
  const unverified = filtered.filter(l => !l.posVerified);

  const totalActive = filtered.length;
  const totalVerified = verified.length;
  const priceMin = filtered.length > 0 ? Math.min(...filtered.map(l => l.askPriceMin)) : 0;
  const priceMax = filtered.length > 0 ? Math.max(...filtered.map(l => l.askPriceMax)) : 0;

  return (
    <div>
      {/* Fixed header spacer */}
      <div className="h-14" />

      {/* Compliance strip */}
      <div className="border-b border-amber-500/10 bg-amber-950/30 py-1.5">
        <p className="text-center text-[11px] text-amber-500/60 tracking-wide">{NO_GENERAL_SOLICITATION_NOTICE}</p>
      </div>

      <div className="mx-auto max-w-6xl px-6 pt-6 pb-16">

        {/* ===== CONTEXT BAR ===== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/5">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-widest font-medium mb-0.5">Active</div>
              <div className="text-base font-bold text-white font-mono">{totalActive}</div>
            </div>
            <div className="h-7 w-px bg-white/5" />
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-widest font-medium mb-0.5">Verified</div>
              <div className="text-base font-bold text-emerald-400 font-mono">{totalVerified}</div>
            </div>
            <div className="h-7 w-px bg-white/5" />
            <div>
              <div className="text-[10px] text-slate-600 uppercase tracking-widest font-medium mb-0.5">Ask range</div>
              <div className="text-base font-bold text-white font-mono">
                {totalActive > 0 ? `${formatCurrency(priceMin)} – ${formatCurrency(priceMax)}` : '—'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input
                type="text"
                placeholder="Filter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-36 rounded-md border border-white/[.08] bg-white/[.03] pl-8 pr-3 py-1.5 text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ListingFilters['sortBy'])}
              className="rounded-md border border-white/[.08] bg-white/[.03] px-2.5 py-1.5 text-[13px] text-slate-400 focus:outline-none focus:border-indigo-500/40 transition-colors"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={shareClass}
              onChange={(e) => setShareClass(e.target.value)}
              className="rounded-md border border-white/[.08] bg-white/[.03] px-2.5 py-1.5 text-[13px] text-slate-400 focus:outline-none focus:border-indigo-500/40 transition-colors"
            >
              <option value="">All classes</option>
              {SHARE_CLASSES.map(sc => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>
            <button
              onClick={() => setVerifiedOnly(v => !v)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[13px] transition-colors ${
                verifiedOnly
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/[.08] bg-white/[.03] text-slate-500 hover:text-emerald-400 hover:border-emerald-500/20'
              }`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              Verified
            </button>
          </div>
        </div>

        {/* ===== LOADING ===== */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/[.06] bg-white/[.02] p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-white/5" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 rounded bg-white/5" />
                    <div className="h-3 w-36 rounded bg-white/5" />
                  </div>
                </div>
                <div className="h-7 w-32 rounded bg-white/5 mb-2" />
                <div className="h-3 w-48 rounded bg-white/5" />
              </div>
            ))}
          </div>
        )}

        {/* ===== EMPTY ===== */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-20 text-center">
            <svg className="h-10 w-10 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>
            <h2 className="text-base font-semibold text-white mb-1">No listings found</h2>
            <p className="text-sm text-slate-500">Try adjusting your filters.</p>
          </div>
        )}

        {/* ===== VERIFIED CARDS ===== */}
        {!loading && verified.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verified.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="group block rounded-xl border border-white/[.06] bg-white/[.02] hover:border-indigo-500/20 hover:bg-white/[.03] transition-all">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {listing.companyLogo ? (
                        <Image src={listing.companyLogo} alt={listing.companyName} width={40} height={40} className="h-10 w-10 rounded-lg shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-base font-bold text-white border border-white/5 shrink-0">{listing.companyName[0]}</div>
                      )}
                      <div>
                        <div className="text-[15px] font-semibold text-white group-hover:text-indigo-300 transition-colors">{listing.companyName}</div>
                        <div className="text-[11px] text-slate-600">{listing.shareClass} &middot; {listing.quantityMin.toLocaleString()}–{listing.quantityMax.toLocaleString()} shares</div>
                      </div>
                    </div>
                    {listing.posMethod && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        {formatPosMethod(listing.posMethod)}
                      </span>
                    )}
                  </div>
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-white font-mono tracking-tight">{formatCurrency(listing.askPriceMin)} – {formatCurrency(listing.askPriceMax)}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      per share{listing.impliedValuation ? ` · implied ${formatValuationShort(listing.impliedValuation)} valuation` : ''}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-mono">Listed {daysAgo(listing.createdAt)}d ago</span>
                    <span className="font-mono">{daysUntil(listing.expiresAt)}d remaining</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ===== UNVERIFIED SECTION ===== */}
        {!loading && unverified.length > 0 && (
          <>
            <div className="flex items-center gap-3 mt-8 mb-4 px-1">
              <div className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">Unverified listings</div>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unverified.map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.id}`} className="group block rounded-xl border border-white/[.03] bg-white/[.008] hover:border-white/[.08] hover:bg-white/[.02] transition-all">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {listing.companyLogo ? (
                          <Image src={listing.companyLogo} alt={listing.companyName} width={40} height={40} className="h-10 w-10 rounded-lg shrink-0 opacity-40" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center text-base font-bold text-slate-600 border border-white/[.03] shrink-0">{listing.companyName[0]}</div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">{listing.companyName}</span>
                            {!listing.lockupExpired && (
                              <span className="rounded bg-red-500/[.08] border border-red-500/10 px-1.5 py-px text-[9px] font-semibold text-red-400/70 uppercase tracking-wider">Lockup active</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-700">{listing.shareClass} &middot; {listing.quantityMin.toLocaleString()}–{listing.quantityMax.toLocaleString()} shares</div>
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-md bg-white/[.03] border border-white/[.05] px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        Unverified
                      </span>
                    </div>
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-slate-400 font-mono tracking-tight">{formatCurrency(listing.askPriceMin)} – {formatCurrency(listing.askPriceMax)}</div>
                      <div className="text-[11px] text-slate-700 mt-0.5">
                        per share{listing.impliedValuation ? ` · implied ${formatValuationShort(listing.impliedValuation)} valuation` : ''}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-700">Listed {daysAgo(listing.createdAt)}d ago</span>
                      <span className={`font-mono ${daysUntil(listing.expiresAt) < 30 ? 'text-red-400/50' : 'text-slate-700'}`}>{daysUntil(listing.expiresAt)}d remaining</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
