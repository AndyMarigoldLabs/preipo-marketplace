'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useListings } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { useDeals } from '@/hooks/useDeals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatNumber, daysAgo, daysUntil, shortenAddress, getPofTierLabel } from '@/lib/utils';
import { PLATFORM_DISCLAIMER } from '@/lib/constants';
import type { BuyerCredentials } from '@/lib/types';
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Shield,
  FileCheck,
  Building2,
  Clock,
  Coins,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Send,
  FileText,
  UserCheck,
  Wallet,
} from 'lucide-react';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { listings } = useListings();
  const { user, isAuthenticated } = useAuth();
  const {
    hasApprovedAccess,
    getExistingRequest,
    submitInterest,
    getPrivateInfo,
    getRequestsForListing,
  } = useDeals();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [message, setMessage] = useState('');
  const [intendedQtyMin, setIntendedQtyMin] = useState('');
  const [intendedQtyMax, setIntendedQtyMax] = useState('');
  const [broadcastPof, setBroadcastPof] = useState(true);
  const [broadcastDid, setBroadcastDid] = useState(true);

  const listingId = params.id as string;
  const listing = listings.find(l => l.id === listingId);

  if (!listing) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg">Listing not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push('/listings')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Listings
        </Button>
      </div>
    );
  }

  const dealSizeMin = listing.askPriceMin * listing.quantityMin;
  const dealSizeMax = listing.askPriceMax * listing.quantityMax;
  const isKycVerified = user?.kycStatus === 'VERIFIED';
  const isSeller = user?.id === listing.sellerId;
  const isApproved = user ? hasApprovedAccess(listing.id, user.id) : false;
  const existingRequest = user ? getExistingRequest(listing.id, user.id) : undefined;
  const privateInfo = getPrivateInfo(listing.id);
  const canSeePrivate = isSeller || isApproved;
  const canRequest = isAuthenticated && isKycVerified && !isSeller && !existingRequest;

  // For seller: show request count
  const requestsForThis = isSeller ? getRequestsForListing(listing.id) : [];
  const pendingCount = requestsForThis.filter(r => r.status === 'PENDING').length;

  const handleSubmitInterest = () => {
    if (!user || !message.trim()) return;

    const credentials: BuyerCredentials = {
      kycStatus: user.kycStatus,
      accreditedInvestorAttestation: user.accreditedInvestorAttestation,
      walletAddress: user.walletAddress,
      ...(broadcastPof && user.pofTier ? { pofTier: user.pofTier, pofMethod: user.pofMethod, pofVerifiedAt: user.pofVerifiedAt } : {}),
      ...(broadcastDid && user.didTokenId ? { didTokenId: user.didTokenId } : {}),
    };

    submitInterest({
      listingId: listing.id,
      buyerId: user.id,
      buyerWallet: user.walletAddress,
      buyerCredentials: credentials,
      message: message.trim(),
      intendedQuantityMin: intendedQtyMin ? parseInt(intendedQtyMin) : undefined,
      intendedQuantityMax: intendedQtyMax ? parseInt(intendedQtyMax) : undefined,
    });

    setShowRequestModal(false);
    setMessage('');
    setIntendedQtyMin('');
    setIntendedQtyMax('');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/listings')}
          className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Listings
        </button>

        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-indigo-600" />
            {listing.companyName}
          </h1>
          <Badge variant="info">{listing.shareClass}</Badge>
          <Badge variant={listing.status === 'ACTIVE' ? 'success' : 'default'}>
            {listing.status}
          </Badge>
          {canSeePrivate && (
            <Badge variant="success">
              <Eye className="h-3 w-3 mr-1" />
              Full Access
            </Badge>
          )}
        </div>

        {listing.listingTokenAddress && (
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" />
            Token: {shortenAddress(listing.listingTokenAddress)}
            <ExternalLink className="h-3 w-3 ml-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" />
          </p>
        )}

        {/* Seller banner */}
        {isSeller && pendingCount > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-4 py-2 text-indigo-300">
            <UserCheck className="h-4 w-4" />
            You have {pendingCount} pending interest request{pendingCount > 1 ? 's' : ''}.
            <button
              onClick={() => router.push('/dashboard')}
              className="ml-auto text-indigo-400 hover:text-indigo-300 underline text-xs"
            >
              Review in Dashboard
            </button>
          </div>
        )}
      </div>

      {/* ===== PUBLIC INFO ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Listing Details (Public) */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Coins className="h-5 w-5 text-indigo-600" />
              Listing Details
              <Badge variant="default" className="ml-auto text-[10px]">
                <Eye className="h-2.5 w-2.5 mr-1" />PUBLIC
              </Badge>
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Price Range (per share)</p>
              <p className="text-2xl font-bold">
                {formatCurrency(listing.askPriceMin)} &ndash; {formatCurrency(listing.askPriceMax)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Quantity Range (shares)</p>
              <p className="text-2xl font-bold">
                {formatNumber(listing.quantityMin)} &ndash; {formatNumber(listing.quantityMax)}
              </p>
            </div>
            {listing.impliedValuation && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Implied Valuation</p>
                <p className="text-2xl font-bold">{formatCurrency(listing.impliedValuation)}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Deal Size Range</p>
              <p className="text-2xl font-bold">
                {formatCurrency(dealSizeMin)} &ndash; {formatCurrency(dealSizeMax)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verification & Compliance (Public) */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              Verification &amp; Compliance
              <Badge variant="default" className="ml-auto text-[10px]">
                <Eye className="h-2.5 w-2.5 mr-1" />PUBLIC
              </Badge>
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Proof of Shares - public summary */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                <FileCheck className="h-4 w-4" />
                Proof of Shares
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Method</span>
                  <span className="font-medium">{listing.posMethod ?? 'None'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  {listing.posVerified ? (
                    <Badge variant="success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                </div>
                {listing.posVerifiedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Verified</span>
                    <span className="font-medium">{new Date(listing.posVerifiedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Transfer Restrictions */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                <Lock className="h-4 w-4" />
                Transfer Restrictions
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">ROFR Waiver</span>
                  <Badge variant={listing.rofrWaiver ? 'success' : 'warning'}>
                    {listing.rofrWaiver ? 'Obtained' : 'Required'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Lockup Status</span>
                  <Badge variant={listing.lockupExpired ? 'success' : 'danger'}>
                    {listing.lockupExpired ? 'Expired' : 'Active'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Rule 144</span>
                  <Badge variant={listing.rule144Compliant ? 'success' : 'warning'}>
                    {listing.rule144Compliant ? 'Compliant' : 'Non-Compliant'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Listed
                  </span>
                  <span className="font-medium">
                    {daysAgo(listing.createdAt)} days ago
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Expires
                  </span>
                  <span className="font-medium">
                    {daysUntil(listing.expiresAt)} days
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== PRIVATE INFO (Approved Viewers Only) ===== */}
      {canSeePrivate ? (
        <Card className="mb-8 border-emerald-500/20">
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-emerald-500" />
              Confidential Information
              <Badge variant="success" className="ml-auto text-[10px]">
                <Lock className="h-2.5 w-2.5 mr-1" />APPROVED ONLY
              </Badge>
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Attestation hash (full) */}
            {listing.posAttestationHash && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Attestation Hash (Full)</p>
                <p className="font-mono text-sm bg-white/5 rounded-md px-3 py-2 break-all">{listing.posAttestationHash}</p>
              </div>
            )}

            {listing.certificateHash && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Certificate Hash</p>
                <p className="font-mono text-sm bg-white/5 rounded-md px-3 py-2 break-all">{listing.certificateHash}</p>
              </div>
            )}

            {/* Private documents set by seller */}
            {privateInfo ? (
              <div className="space-y-4 border-t border-white/5 pt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Seller Documents
                </h3>

                {privateInfo.sideLetterHash && (
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">
                      Side Letter {privateInfo.sideLetterName && `(${privateInfo.sideLetterName})`}
                    </p>
                    <p className="font-mono text-sm bg-white/5 rounded-md px-3 py-2 break-all">{privateInfo.sideLetterHash}</p>
                  </div>
                )}

                {privateInfo.certificateDocHash && (
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">
                      Certificate Document {privateInfo.certificateDocName && `(${privateInfo.certificateDocName})`}
                    </p>
                    <p className="font-mono text-sm bg-white/5 rounded-md px-3 py-2 break-all">{privateInfo.certificateDocHash}</p>
                  </div>
                )}

                {privateInfo.transferAgentContact && (
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Transfer Agent Contact</p>
                    <p className="text-sm">{privateInfo.transferAgentContact}</p>
                  </div>
                )}

                {privateInfo.escrowAgentContact && (
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Escrow Agent Contact</p>
                    <p className="text-sm">{privateInfo.escrowAgentContact}</p>
                  </div>
                )}

                {privateInfo.sellerNotes && (
                  <div>
                    <p className="text-sm font-medium text-gray-400 mb-1">Seller Notes</p>
                    <p className="text-sm bg-white/[.03] rounded-md px-3 py-2">{privateInfo.sellerNotes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-white/30">
                <FileText className="mx-auto h-6 w-6 mb-2 text-white/15" />
                {isSeller
                  ? 'No private documents uploaded yet. Add them from your Dashboard.'
                  : 'The seller has not uploaded private documents yet.'
                }
              </div>
            )}

            {/* If approved buyer, offer to proceed to deal room */}
            {isApproved && !isSeller && (
              <div className="border-t border-white/5 pt-4">
                <Button onClick={() => router.push(`/deal-room/new-${listing.id}`)}>
                  <Send className="h-4 w-4 mr-2" />
                  Open Deal Room
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Locked private section for non-approved viewers */
        <Card className="mb-8 border-white/5">
          <CardContent className="py-8 text-center">
            <Lock className="mx-auto h-8 w-8 text-white/15 mb-3" />
            <h3 className="font-semibold mb-1 text-white/60">Confidential Information</h3>
            <p className="text-sm text-white/30 max-w-md mx-auto mb-1">
              Proof of shares documentation, side letters, certificate hashes, and seller contact details are available to approved viewers only.
            </p>
            {existingRequest?.status === 'PENDING' && (
              <Badge variant="warning" className="mt-2">
                <Clock className="h-3 w-3 mr-1" />
                Your request is pending review
              </Badge>
            )}
            {existingRequest?.status === 'DECLINED' && (
              <Badge variant="danger" className="mt-2">
                Your request was declined
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== ACTION SECTION ===== */}
      <Card className="mb-8">
        <CardContent className="py-6 flex flex-col items-center text-center gap-4">
          {!isAuthenticated && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-2 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>You must be signed in and KYC-verified to request access.</span>
            </div>
          )}
          {isAuthenticated && !isKycVerified && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-2 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Complete KYC verification before requesting access.</span>
            </div>
          )}
          {isSeller && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md px-4 py-2 text-sm">
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span>This is your listing. Manage it from your Dashboard.</span>
            </div>
          )}
          {existingRequest?.status === 'PENDING' && (
            <p className="text-sm text-white/40">Your interest request is pending seller review.</p>
          )}
          {existingRequest?.status === 'APPROVED' && (
            <p className="text-sm text-emerald-400">Access granted. You can view the confidential section above.</p>
          )}

          {canRequest && (
            <Button size="lg" onClick={() => setShowRequestModal(true)} className="min-w-[240px]">
              <Shield className="mr-2 h-4 w-4" />
              Express Interest &amp; Request Access
            </Button>
          )}

          {isSeller && (
            <Button size="lg" variant="outline" onClick={() => router.push('/dashboard')} className="min-w-[240px]">
              <UserCheck className="mr-2 h-4 w-4" />
              Manage in Dashboard
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center border-t border-gray-100 dark:border-gray-700 pt-6 pb-4">
        {PLATFORM_DISCLAIMER}
      </p>

      {/* ===== INTEREST REQUEST MODAL with Credential Broadcasting ===== */}
      <Modal open={showRequestModal} onClose={() => setShowRequestModal(false)} title="Express Interest & Request Access">
        <div className="space-y-5">
          <p className="text-sm text-gray-400">
            Submit your interest in{' '}
            <span className="font-semibold text-gray-200">{listing.companyName}</span> shares.
            Your credentials will be shared with the seller for review.
          </p>

          {/* Your Credentials (auto-broadcast) */}
          <div className="rounded-lg bg-white/[.03] border border-white/5 p-4 space-y-3">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" />
              Your Credentials (shared with seller)
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-white/40">KYC Status</span>
                <div className="mt-0.5">
                  {user?.kycStatus === 'VERIFIED' ? (
                    <Badge variant="success"><CheckCircle className="h-2.5 w-2.5 mr-1" />Verified</Badge>
                  ) : (
                    <Badge variant="warning">{user?.kycStatus}</Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-white/40">Accredited Investor</span>
                <div className="mt-0.5">
                  {user?.accreditedInvestorAttestation ? (
                    <Badge variant="success"><CheckCircle className="h-2.5 w-2.5 mr-1" />Attested</Badge>
                  ) : (
                    <Badge variant="warning">Not Attested</Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-white/40">Wallet</span>
                <p className="font-medium font-mono mt-0.5">{user ? shortenAddress(user.walletAddress) : '—'}</p>
              </div>
              <div>
                <span className="text-white/40">AML/KYC DID</span>
                <p className="font-medium font-mono mt-0.5">{user?.didTokenId ? shortenAddress(user.didTokenId, 4) : 'None'}</p>
              </div>
            </div>

            {/* Optional toggles for PoF and DID */}
            <div className="border-t border-white/5 pt-3 space-y-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={broadcastPof}
                  onChange={e => setBroadcastPof(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-white/50">
                  Share Proof of Funds status
                  {user?.pofTier && <span className="text-white/70 ml-1">({getPofTierLabel(user.pofTier)})</span>}
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={broadcastDid}
                  onChange={e => setBroadcastDid(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-white/50">Share DID credential token</span>
              </label>
            </div>
          </div>

          {/* Intended Quantity */}
          <div>
            <label className="text-xs text-white/40 block mb-1">Intended Quantity Range (optional)</label>
            <div className="flex gap-2">
              <input
                type="number"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/20 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Min shares"
                value={intendedQtyMin}
                onChange={e => setIntendedQtyMin(e.target.value)}
              />
              <span className="text-white/20 self-center">–</span>
              <input
                type="number"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/20 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Max shares"
                value={intendedQtyMax}
                onChange={e => setIntendedQtyMax(e.target.value)}
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-xs text-white/40 block mb-1">Message to Seller</label>
            <textarea
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/20 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[100px] resize-y"
              placeholder="Briefly describe your interest, investment thesis, and intent..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
            <p className="font-medium mb-1">Disclaimer</p>
            <p>{PLATFORM_DISCLAIMER}</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>Cancel</Button>
            <Button disabled={!message.trim()} onClick={handleSubmitInterest}>
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Submit Interest
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
