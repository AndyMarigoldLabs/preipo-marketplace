'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useListings } from '@/hooks/useListings';
import { useDeals } from '@/hooks/useDeals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatValuationShort, shortenAddress, daysUntil, getPofTierLabel } from '@/lib/utils';
import { PLATFORM_DISCLAIMER } from '@/lib/constants';
import type { InterestRequest, ListingPrivateInfo } from '@/lib/types';
import {
  Plus,
  Building2,
  Eye,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  FileCheck,
  ArrowRight,
  AlertTriangle,
  Inbox,
  Send,
  Lock,
  Unlock,
  FileText,
} from 'lucide-react';

type Tab = 'my-listings' | 'my-interests' | 'incoming-requests';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { listings, loading: listingsLoading } = useListings();
  const {
    getRequestsForListing,
    getRequestsByBuyer,
    updateRequestStatus,
    withdrawRequest,
    getPrivateInfo,
    setPrivateInfo,
    loading: dealsLoading,
  } = useDeals();

  const [activeTab, setActiveTab] = useState<Tab>('my-listings');
  const [reviewModal, setReviewModal] = useState<InterestRequest | null>(null);
  const [sellerNote, setSellerNote] = useState('');
  const [privateInfoModal, setPrivateInfoModal] = useState<string | null>(null);
  const [privateInfoForm, setPrivateInfoForm] = useState<Partial<ListingPrivateInfo>>({});

  const loading = authLoading || listingsLoading || dealsLoading;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <Shield className="mx-auto h-12 w-12 text-white/20 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
        <p className="text-white/40 mb-6">Connect your wallet and complete KYC to access the dashboard.</p>
        <Button onClick={() => router.push('/onboarding')}>Get Started</Button>
      </div>
    );
  }

  const myListings = listings.filter(l => l.sellerId === user.id);
  const myInterests = getRequestsByBuyer(user.id);

  // Collect all incoming requests across all of the user's listings
  const incomingRequests: (InterestRequest & { companyName: string })[] = [];
  for (const listing of myListings) {
    const reqs = getRequestsForListing(listing.id);
    for (const r of reqs) {
      incomingRequests.push({ ...r, companyName: listing.companyName });
    }
  }
  incomingRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const pendingIncoming = incomingRequests.filter(r => r.status === 'PENDING').length;

  const handleApprove = (requestId: string) => {
    updateRequestStatus(requestId, 'APPROVED', sellerNote || undefined);
    setReviewModal(null);
    setSellerNote('');
  };

  const handleDecline = (requestId: string) => {
    updateRequestStatus(requestId, 'DECLINED', sellerNote || undefined);
    setReviewModal(null);
    setSellerNote('');
  };

  const handleSavePrivateInfo = (listingId: string) => {
    setPrivateInfo({ listingId, ...privateInfoForm } as ListingPrivateInfo);
    setPrivateInfoModal(null);
    setPrivateInfoForm({});
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'APPROVED': return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'DECLINED': return <Badge variant="danger"><XCircle className="h-3 w-3 mr-1" />Declined</Badge>;
      case 'WITHDRAWN': return <Badge variant="default">Withdrawn</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'my-listings', label: 'My Listings', icon: <Building2 className="h-4 w-4" /> },
    { key: 'my-interests', label: 'My Interests', icon: <Send className="h-4 w-4" />, count: myInterests.filter(r => r.status === 'APPROVED').length || undefined },
    { key: 'incoming-requests', label: 'Incoming Requests', icon: <Inbox className="h-4 w-4" />, count: pendingIncoming || undefined },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">
            Manage your listings, track interest requests, and review incoming inquiries.
          </p>
        </div>
        <Button onClick={() => router.push('/listings/create')} disabled={user.kycStatus !== 'VERIFIED'}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Listing
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{myListings.length}</p>
            <p className="text-xs text-white/40 mt-1">My Listings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{myListings.filter(l => l.status === 'ACTIVE').length}</p>
            <p className="text-xs text-white/40 mt-1">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{pendingIncoming}</p>
            <p className="text-xs text-white/40 mt-1">Pending Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{myInterests.filter(r => r.status === 'APPROVED').length}</p>
            <p className="text-xs text-white/40 mt-1">Approved Access</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/5 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'my-listings' && (
        <div className="space-y-4">
          {myListings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="mx-auto h-10 w-10 text-white/15 mb-3" />
                <p className="text-white/40 mb-4">You haven&apos;t created any listings yet.</p>
                <Button onClick={() => router.push('/listings/create')}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Your First Listing
                </Button>
              </CardContent>
            </Card>
          ) : (
            myListings.map(listing => {
              const reqs = getRequestsForListing(listing.id);
              const pendingCount = reqs.filter(r => r.status === 'PENDING').length;
              const approvedCount = reqs.filter(r => r.status === 'APPROVED').length;
              const info = getPrivateInfo(listing.id);

              return (
                <Card key={listing.id}>
                  <CardContent className="py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 flex-shrink-0">
                          <Building2 className="h-5 w-5 text-white/40" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate">{listing.companyName}</h3>
                            <Badge variant={listing.status === 'ACTIVE' ? 'success' : 'default'}>
                              {listing.status}
                            </Badge>
                            <Badge variant="info">{listing.shareClass}</Badge>
                            {listing.posVerified && (
                              <Badge variant="success"><FileCheck className="h-3 w-3 mr-1" />PoS</Badge>
                            )}
                          </div>
                          <p className="text-xs text-white/40 mt-1">
                            {formatCurrency(listing.askPriceMin)}–{formatCurrency(listing.askPriceMax)} / share
                            {listing.impliedValuation && <> &middot; {formatValuationShort(listing.impliedValuation)} valuation</>}
                            {' '}&middot; Expires in {daysUntil(listing.expiresAt)}d
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-4 text-xs text-white/40">
                          <span className="flex items-center gap-1" title="Pending requests">
                            <Clock className="h-3.5 w-3.5" />
                            {pendingCount}
                          </span>
                          <span className="flex items-center gap-1" title="Approved viewers">
                            <Users className="h-3.5 w-3.5" />
                            {approvedCount}
                          </span>
                          <span className="flex items-center gap-1" title="Private docs">
                            {info ? <Unlock className="h-3.5 w-3.5 text-emerald-400" /> : <Lock className="h-3.5 w-3.5" />}
                            {info ? 'Docs set' : 'No docs'}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => {
                            const existing = getPrivateInfo(listing.id);
                            setPrivateInfoForm(existing || {});
                            setPrivateInfoModal(listing.id);
                          }}>
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            Docs
                          </Button>
                          <Link href={`/listings/${listing.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'my-interests' && (
        <div className="space-y-4">
          {myInterests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="mx-auto h-10 w-10 text-white/15 mb-3" />
                <p className="text-white/40 mb-4">You haven&apos;t expressed interest in any listings yet.</p>
                <Button onClick={() => router.push('/listings')}>
                  Browse Listings
                </Button>
              </CardContent>
            </Card>
          ) : (
            myInterests.map(request => {
              const listing = listings.find(l => l.id === request.listingId);
              return (
                <Card key={request.id}>
                  <CardContent className="py-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{listing?.companyName || 'Unknown Listing'}</h3>
                          {statusBadge(request.status)}
                        </div>
                        <p className="text-xs text-white/40 mt-1">
                          Submitted {new Date(request.createdAt).toLocaleDateString()}
                          {request.intendedQuantityMin && (
                            <> &middot; Intent: {request.intendedQuantityMin}–{request.intendedQuantityMax} shares</>
                          )}
                        </p>
                        {request.sellerNote && (
                          <p className="text-xs text-white/50 mt-2 italic">
                            Seller note: &ldquo;{request.sellerNote}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Credentials you broadcasted */}
                        <div className="flex gap-1.5">
                          {request.buyerCredentials.kycStatus === 'VERIFIED' && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/15 bg-emerald-500/[.08] px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                              KYC
                            </span>
                          )}
                          {request.buyerCredentials.pofTier && (
                            <span className="inline-flex items-center rounded-md border border-white/[.08] bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                              {getPofTierLabel(request.buyerCredentials.pofTier)}
                            </span>
                          )}
                          {request.buyerCredentials.accreditedInvestorAttestation && (
                            <span className="inline-flex items-center rounded-md border border-indigo-500/15 bg-indigo-500/[.08] px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400">
                              AI
                            </span>
                          )}
                        </div>

                        {request.status === 'APPROVED' && listing && (
                          <Link href={`/listings/${listing.id}`}>
                            <Button size="sm">
                              <ArrowRight className="h-3.5 w-3.5 mr-1" />
                              View Details
                            </Button>
                          </Link>
                        )}
                        {request.status === 'PENDING' && (
                          <Button size="sm" variant="ghost" onClick={() => withdrawRequest(request.id)}>
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'incoming-requests' && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Inbox className="mx-auto h-10 w-10 text-white/15 mb-3" />
                <p className="text-white/40">No incoming interest requests yet.</p>
                <p className="text-xs text-white/25 mt-1">When buyers express interest in your listings, they&apos;ll appear here.</p>
              </CardContent>
            </Card>
          ) : (
            incomingRequests.map(request => (
              <Card key={request.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm">{request.companyName}</h3>
                        {statusBadge(request.status)}
                      </div>
                      <p className="text-xs text-white/40">
                        From: {shortenAddress(request.buyerWallet)}
                        {' '}&middot; {new Date(request.createdAt).toLocaleDateString()}
                      </p>

                      {/* Buyer's broadcasted credentials */}
                      <div className="flex gap-1.5 mt-2">
                        {request.buyerCredentials.kycStatus === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/15 bg-emerald-500/[.08] px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                            <CheckCircle className="h-2.5 w-2.5" /> KYC Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/15 bg-amber-500/[.08] px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                            <AlertTriangle className="h-2.5 w-2.5" /> KYC {request.buyerCredentials.kycStatus}
                          </span>
                        )}
                        {request.buyerCredentials.accreditedInvestorAttestation && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-indigo-500/15 bg-indigo-500/[.08] px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400">
                            <Shield className="h-2.5 w-2.5" /> Accredited
                          </span>
                        )}
                        {request.buyerCredentials.pofTier && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-white/[.08] bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                            PoF: {getPofTierLabel(request.buyerCredentials.pofTier)}
                          </span>
                        )}
                        {request.buyerCredentials.didTokenId && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-white/[.08] bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                            DID: {shortenAddress(request.buyerCredentials.didTokenId, 3)}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-white/50 mt-2 bg-white/[.03] rounded-md px-3 py-2">
                        &ldquo;{request.message}&rdquo;
                      </p>
                      {request.intendedQuantityMin && (
                        <p className="text-xs text-white/40 mt-1">
                          Intent: {request.intendedQuantityMin}–{request.intendedQuantityMax} shares
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {request.status === 'PENDING' && (
                        <Button size="sm" onClick={() => { setReviewModal(request); setSellerNote(''); }}>
                          Review
                        </Button>
                      )}
                      {request.status !== 'PENDING' && request.sellerNote && (
                        <p className="text-xs text-white/30 italic max-w-[200px] truncate">
                          Your note: &ldquo;{request.sellerNote}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-white/20 text-center mt-12 pb-4 max-w-3xl mx-auto">
        {PLATFORM_DISCLAIMER}
      </p>

      {/* Review Request Modal */}
      <Modal open={!!reviewModal} onClose={() => setReviewModal(null)} title="Review Interest Request">
        {reviewModal && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">
                <span className="font-medium text-gray-200">{shortenAddress(reviewModal.buyerWallet)}</span>
                {' '}is requesting access to your listing.
              </p>
            </div>

            {/* Credential summary */}
            <div className="rounded-lg bg-white/[.03] border border-white/5 p-3 space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Buyer Credentials</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-white/40">KYC</span>
                  <p className="font-medium">{reviewModal.buyerCredentials.kycStatus}</p>
                </div>
                <div>
                  <span className="text-white/40">Accredited</span>
                  <p className="font-medium">{reviewModal.buyerCredentials.accreditedInvestorAttestation ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="text-white/40">Proof of Funds</span>
                  <p className="font-medium">{reviewModal.buyerCredentials.pofTier ? getPofTierLabel(reviewModal.buyerCredentials.pofTier) : 'None'}</p>
                </div>
                <div>
                  <span className="text-white/40">DID</span>
                  <p className="font-medium font-mono">{reviewModal.buyerCredentials.didTokenId ? shortenAddress(reviewModal.buyerCredentials.didTokenId, 4) : 'None'}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-white/40 mb-1">Their message:</p>
              <p className="text-sm bg-white/[.03] rounded-md px-3 py-2">&ldquo;{reviewModal.message}&rdquo;</p>
            </div>

            {reviewModal.intendedQuantityMin && (
              <p className="text-xs text-white/50">
                Intended quantity: {reviewModal.intendedQuantityMin}–{reviewModal.intendedQuantityMax} shares
              </p>
            )}

            <div>
              <label className="text-xs text-white/40 block mb-1">Note to buyer (optional)</label>
              <textarea
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/20 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px] resize-y"
                placeholder="Add a note for the buyer..."
                value={sellerNote}
                onChange={(e) => setSellerNote(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="danger" size="sm" onClick={() => handleDecline(reviewModal.id)}>
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Decline
              </Button>
              <Button size="sm" onClick={() => handleApprove(reviewModal.id)}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Approve Access
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Private Info / Documents Modal */}
      <Modal open={!!privateInfoModal} onClose={() => setPrivateInfoModal(null)} title="Listing Private Documents">
        {privateInfoModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Set the private documents and contact info that approved viewers will see.
            </p>

            <div>
              <label className="text-xs text-white/40 block mb-1">Side Letter Document Hash</label>
              <input
                type="text"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/20 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0x..."
                value={privateInfoForm.sideLetterHash || ''}
                onChange={e => setPrivateInfoForm(prev => ({ ...prev, sideLetterHash: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs text-white/40 block mb-1">Side Letter Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/20 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g., ROFR Waiver Letter"
                value={privateInfoForm.sideLetterName || ''}
                onChange={e => setPrivateInfoForm(prev => ({ ...prev, sideLetterName: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs text-white/40 block mb-1">Certificate Document Hash</label>
              <input
                type="text"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/20 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0x..."
                value={privateInfoForm.certificateDocHash || ''}
                onChange={e => setPrivateInfoForm(prev => ({ ...prev, certificateDocHash: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs text-white/40 block mb-1">Transfer Agent Contact</label>
              <input
                type="text"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/20 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Name / email / phone"
                value={privateInfoForm.transferAgentContact || ''}
                onChange={e => setPrivateInfoForm(prev => ({ ...prev, transferAgentContact: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs text-white/40 block mb-1">Escrow Agent Contact</label>
              <input
                type="text"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/20 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Name / email / phone"
                value={privateInfoForm.escrowAgentContact || ''}
                onChange={e => setPrivateInfoForm(prev => ({ ...prev, escrowAgentContact: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs text-white/40 block mb-1">Seller Notes (private)</label>
              <textarea
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/20 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px] resize-y"
                placeholder="Additional notes for approved viewers..."
                value={privateInfoForm.sellerNotes || ''}
                onChange={e => setPrivateInfoForm(prev => ({ ...prev, sellerNotes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPrivateInfoModal(null)}>Cancel</Button>
              <Button onClick={() => handleSavePrivateInfo(privateInfoModal)}>
                Save Documents
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
