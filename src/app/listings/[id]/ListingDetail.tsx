'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useListings } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatNumber, daysAgo, daysUntil, shortenAddress } from '@/lib/utils';
import { PLATFORM_DISCLAIMER } from '@/lib/constants';
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
} from 'lucide-react';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { listings } = useListings();
  const { user, isAuthenticated } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');

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
  const canRequest = isAuthenticated && isKycVerified;

  const handleConfirmIntroduction = () => {
    setShowModal(false);
    setMessage('');
    router.push(`/deal-room/new-${listingId}`);
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
        </div>

        {listing.listingTokenAddress && (
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" />
            Token: {shortenAddress(listing.listingTokenAddress)}
            <ExternalLink className="h-3 w-3 ml-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" />
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Listing Details */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Coins className="h-5 w-5 text-indigo-600" />
              Listing Details
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

        {/* Verification & Compliance */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              Verification &amp; Compliance
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Proof of Shares */}
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
                {listing.posAttestationHash && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Attestation Hash</span>
                    <span className="font-mono text-xs">{shortenAddress(listing.posAttestationHash, 6)}</span>
                  </div>
                )}
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

      {/* Action Section */}
      <Card className="mb-8">
        <CardContent className="py-6 flex flex-col items-center text-center gap-4">
          {!isAuthenticated && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-2 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>You must be signed in and KYC-verified to request an introduction.</span>
            </div>
          )}
          {isAuthenticated && !isKycVerified && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md px-4 py-2 text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Complete KYC verification before requesting introductions.</span>
            </div>
          )}
          <Button size="lg" disabled={!canRequest} onClick={() => setShowModal(true)} className="min-w-[240px]">
            <Shield className="mr-2 h-4 w-4" />
            Request Introduction
          </Button>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center border-t border-gray-100 dark:border-gray-700 pt-6 pb-4">
        {PLATFORM_DISCLAIMER}
      </p>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Request Introduction">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Submit a brief message to the seller of{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{listing.companyName}</span> shares.
            If accepted, a private deal room will be created.
          </p>
          <textarea
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[100px] resize-y"
            placeholder="Briefly describe your interest and intent..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
            <p className="font-medium mb-1">Disclaimer</p>
            <p>{PLATFORM_DISCLAIMER}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button disabled={!message.trim()} onClick={handleConfirmIntroduction}>
              Confirm &amp; Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
