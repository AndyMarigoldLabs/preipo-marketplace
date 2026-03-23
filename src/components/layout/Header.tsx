'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { shortenAddress, getPofTierLabel } from '@/lib/utils';

export function Header() {
  const { isAuthenticated, user, connectWallet, disconnect, loading } = useAuth();
  const pathname = usePathname();

  const handleConnect = async () => {
    const mockAddress = '0x' + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    await connectWallet(mockAddress);
  };

  const navItems = [
    { href: '/listings', label: 'Listings' },
    ...(isAuthenticated && user?.kycStatus === 'VERIFIED'
      ? [{ href: '/listings/create', label: 'Create' }]
      : []),
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-slate-950/70 glass">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
            </div>
            <span className="text-sm font-bold tracking-tight">PreIPO</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-[13px]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  pathname === item.href || pathname?.startsWith(item.href + '/')
                    ? 'text-white bg-white/5'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-white/5" />
          ) : isAuthenticated && user ? (
            <>
              {user.kycStatus === 'VERIFIED' && (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/15 bg-emerald-500/[.08] px-2 py-1 text-[11px] font-semibold text-emerald-400">
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  KYC
                </span>
              )}
              {user.pofTier && (
                <span className="inline-flex items-center rounded-md border border-white/[.08] bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-400 font-mono">
                  {getPofTierLabel(user.pofTier)}
                </span>
              )}
              <Link href="/profile" className="inline-flex items-center gap-1.5 rounded-md border border-white/[.08] px-2.5 py-1 text-[13px] font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors">
                <svg className="h-3.5 w-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>
                {shortenAddress(user.walletAddress)}
              </Link>
              <button onClick={disconnect} className="h-8 w-8 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 flex items-center justify-center transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
              </button>
            </>
          ) : (
            <>
              <button onClick={handleConnect} className="hidden sm:inline-flex items-center gap-2 rounded-md border border-white/[.08] px-3 py-1.5 text-[13px] font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>
                Connect
              </button>
              <Link href="/onboarding" className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-indigo-500 transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
