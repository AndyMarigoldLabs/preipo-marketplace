'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useListings } from '@/hooks/useListings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getPofTierLabel, formatCurrency } from '@/lib/utils';
// POF_TIERS available in constants if needed
import {
  Shield,
  Wallet,
  Mail,
  CheckCircle,
  AlertTriangle,
  Clock,
  Coins,
  FileCheck,
  CreditCard,
  Building2,
  Link as LinkIcon,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
// types available from @/lib/types if needed

export default function ProfilePage() {
  const { user, isAuthenticated, setPof, updateUser } = useAuth();
  const { listings } = useListings();
  const [pofLoading, setPofLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [locFile, setLocFile] = useState<File | null>(null);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Wallet Not Connected</h2>
        <p className="text-muted-foreground">
          Please connect your wallet to view your profile.
        </p>
        <Link href="/onboarding">
          <Button>Go to Onboarding</Button>
        </Link>
      </div>
    );
  }

  const userListings = listings?.filter(
    (l) => l.sellerId === user.id
  ) ?? [];

  const isPofVerified =
    user.pofTier && user.pofVerifiedAt && !isPofExpired();

  function isPofExpired(): boolean {
    if (!user?.pofVerifiedAt) return true;
    const verified = new Date(user.pofVerifiedAt);
    const expires = new Date(verified.getTime() + 30 * 24 * 60 * 60 * 1000);
    return new Date() > expires;
  }

  function getPofExpiresDate(): string | null {
    if (!user?.pofVerifiedAt) return null;
    const verified = new Date(user.pofVerifiedAt);
    const expires = new Date(verified.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expires.toLocaleDateString();
  }

  function copyAddress() {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleStablecoinCheck() {
    setPofLoading('stablecoin');
    try {
      // Stubbed: generate mock USDC balance and auto-calculate tier
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPof('TIER_3', 'STABLECOIN_WALLET');
    } finally {
      setPofLoading(null);
    }
  }

  async function handlePlaidConnect() {
    setPofLoading('plaid');
    try {
      // Stubbed: simulate Plaid bank connection with 2s delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setPof('TIER_3', 'BANK_VERIFICATION');
    } finally {
      setPofLoading(null);
    }
  }

  async function handleLocSubmit() {
    if (!locFile) return;
    setPofLoading('loc');
    try {
      // Stubbed: simulate letter of credit upload with 1s delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPof('TIER_2', 'LETTER_OF_CREDIT');
    } finally {
      setPofLoading(null);
      setLocFile(null);
    }
  }

  function renderKycBadge() {
    switch (user?.kycStatus) {
      case 'VERIFIED':
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            KYC Verified
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="warning">
            <Clock className="h-3 w-3 mr-1" />
            KYC Pending
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="danger">
            <AlertTriangle className="h-3 w-3 mr-1" />
            KYC Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="default">
            <Shield className="h-3 w-3 mr-1" />
            KYC Not Started
          </Badge>
        );
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold">My Profile</h1>

      {/* Profile Header Card */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Profile Information
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground w-32">
              Wallet Address
            </span>
            <code className="text-sm bg-muted px-2 py-1 rounded flex-1 break-all">
              {user.walletAddress}
            </code>
            <Button variant="ghost" size="sm" onClick={copyAddress}>
              <Copy className="h-4 w-4" />
            </Button>
            {copied && (
              <span className="text-xs text-green-600 dark:text-green-400">Copied!</span>
            )}
          </div>

          {user.email && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground w-32">
                Email
              </span>
              <span className="text-sm flex items-center gap-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {user.email}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground w-32">
              KYC Status
            </span>
            {renderKycBadge()}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground w-32">
              Role
            </span>
            <Badge variant="info">{user.role}</Badge>
          </div>

          {user.didTokenId && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground w-32">
                DID Token ID
              </span>
              <span className="text-sm font-mono">{user.didTokenId}</span>
            </div>
          )}

          {user.createdAt && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground w-32">
                Member Since
              </span>
              <span className="text-sm">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accredited Investor Status Card */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Accredited Investor Status
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.accreditedInvestorAttestation ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                Accredited Investor Attestation Verified
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                Accredited Investor Attestation Not Verified
              </span>
            </div>
          )}
          <Link href="/onboarding">
            <Button variant="outline" size="sm">
              <LinkIcon className="h-4 w-4 mr-2" />
              {user.accreditedInvestorAttestation ? 'Re-verify' : 'Verify Now'}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Proof of Funds Card */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Proof of Funds
          </h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {isPofVerified ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground w-40">
                  Current Tier
                </span>
                <Badge className="bg-green-600 hover:bg-green-700">
                  {getPofTierLabel(user.pofTier!)}
                </Badge>
              </div>

              {user.pofMethod && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-40">
                    Verification Method
                  </span>
                  <span className="text-sm capitalize">
                    {user.pofMethod.replace(/_/g, ' ')}
                  </span>
                </div>
              )}

              {user.pofVerifiedAt && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-40">
                    Verified Date
                  </span>
                  <span className="text-sm">
                    {new Date(user.pofVerifiedAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground w-40">
                  Expires
                </span>
                <span className="text-sm">{getPofExpiresDate()}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Reset PoF to trigger re-verification
                  updateUser({ pofTier: undefined, pofMethod: undefined, pofVerifiedAt: undefined });
                }}
              >
                Re-verify Proof of Funds
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Verify your proof of funds to participate in listings. Choose a
                verification method below.
              </p>

              {/* Option 1: Stablecoin Wallet */}
              <div className="border dark:border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Stablecoin Wallet</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Check your USDC wallet balance to automatically determine your
                  proof of funds tier.
                </p>
                <Button
                  onClick={handleStablecoinCheck}
                  disabled={pofLoading !== null}
                >
                  {pofLoading === 'stablecoin' ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Checking Balance...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Check USDC Balance
                    </>
                  )}
                </Button>
              </div>

              {/* Option 2: Bank Verification (Plaid) */}
              <div className="border dark:border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Bank Verification (Plaid)</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect your bank account via Plaid to verify your available
                  funds.
                </p>
                <Button
                  onClick={handlePlaidConnect}
                  disabled={pofLoading !== null}
                >
                  {pofLoading === 'plaid' ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 mr-2" />
                      Connect Bank Account
                    </>
                  )}
                </Button>
              </div>

              {/* Option 3: Letter of Credit */}
              <div className="border dark:border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold">Letter of Credit</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload a letter of credit from your financial institution.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setLocFile(e.target.files?.[0] ?? null)}
                    disabled={pofLoading !== null}
                  />
                  <Button
                    onClick={handleLocSubmit}
                    disabled={pofLoading !== null || !locFile}
                  >
                    {pofLoading === 'loc' ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FileCheck className="h-4 w-4 mr-2" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Listings Card */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            My Listings
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You have {userListings.length} listing
            {userListings.length !== 1 ? 's' : ''}.
          </p>

          {userListings.length > 0 && (
            <ul className="space-y-2">
              {userListings.map((listing) => (
                <li key={listing.id}>
                  <Link
                    href={`/listings/${listing.id}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {listing.companyName} ({listing.shareClass}) -{' '}
                    {formatCurrency(listing.askPriceMin)}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link href="/listings/create">
            <Button>Create New Listing</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
