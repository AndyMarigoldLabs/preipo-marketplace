'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useListings } from '@/hooks/useListings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SHARE_CLASSES } from '@/lib/constants';
import { hashDocument } from '@/lib/utils';
import {
  ArrowLeft,
  Upload,
  FileCheck,
  Building2,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import type { Listing, ShareClass, PosMethod } from '@/lib/types';

export default function CreateListingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { addListing } = useListings();

  // Company Details
  const [companyName, setCompanyName] = useState('');
  const [shareClass, setShareClass] = useState<ShareClass>('Common');

  // Quantity & Pricing
  const [quantityMin, setQuantityMin] = useState<number | ''>('');
  const [quantityMax, setQuantityMax] = useState<number | ''>('');
  const [askPriceMin, setAskPriceMin] = useState<number | ''>('');
  const [askPriceMax, setAskPriceMax] = useState<number | ''>('');
  const [impliedValuation, setImpliedValuation] = useState<number | ''>('');

  // Proof of Shares Verification
  const [posMethod, setPosMethod] = useState<PosMethod>('DOCUMENT_HASH');
  const [documentHash, setDocumentHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [posVerified, setPosVerified] = useState(false);
  const [escrowAgentName, setEscrowAgentName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Transfer Restriction Compliance
  const [rofrWaiver, setRofrWaiver] = useState(false);
  const [lockupExpired, setLockupExpired] = useState(false);
  const [rule144Compliance, setRule144Compliance] = useState(false);

  // Listing Options
  const [expiryDate, setExpiryDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return date.toISOString().split('T')[0];
  });
  const [mintToken, setMintToken] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isAuthenticated || user?.kycStatus !== 'VERIFIED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Complete Onboarding First</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You must be authenticated and KYC verified before creating a listing.
        </p>
        <Button onClick={() => router.push('/onboarding')}>
          Go to Onboarding
        </Button>
      </div>
    );
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsHashing(true);
    try {
      const hash = await hashDocument(file);
      setDocumentHash(hash);
      setPosVerified(true);
    } catch {
      setErrors((prev) => ({ ...prev, pos: 'Failed to hash document' }));
    } finally {
      setIsHashing(false);
    }
  }

  function handleCartaConnect() {
    setIsConnecting(true);
    setPosVerified(false);
    setTimeout(() => {
      setPosVerified(true);
      setIsConnecting(false);
    }, 2000);
  }

  function handleEscrowSubmit() {
    if (!escrowAgentName.trim()) {
      setErrors((prev) => ({
        ...prev,
        escrow: 'Escrow agent name is required',
      }));
      return;
    }
    setIsConnecting(true);
    setPosVerified(false);
    setTimeout(() => {
      setPosVerified(true);
      setIsConnecting(false);
    }, 2000);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!quantityMin || quantityMin <= 0) {
      newErrors.quantityMin = 'Minimum quantity is required';
    }
    if (!quantityMax || quantityMax <= 0) {
      newErrors.quantityMax = 'Maximum quantity is required';
    }
    if (quantityMin && quantityMax && quantityMin > quantityMax) {
      newErrors.quantityMax = 'Max must be greater than or equal to min';
    }
    if (!askPriceMin || askPriceMin <= 0) {
      newErrors.askPriceMin = 'Minimum ask price is required';
    }
    if (!askPriceMax || askPriceMax <= 0) {
      newErrors.askPriceMax = 'Maximum ask price is required';
    }
    if (askPriceMin && askPriceMax && askPriceMin > askPriceMax) {
      newErrors.askPriceMax = 'Max must be greater than or equal to min';
    }
    if (!posVerified) {
      newErrors.pos = 'Proof of shares verification is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setIsSubmitting(true);

    const newId = crypto.randomUUID();

    const listing: Listing = {
      id: newId,
      sellerId: user!.id,
      companyName: companyName.trim(),
      shareClass,
      quantityMin: Number(quantityMin),
      quantityMax: Number(quantityMax),
      askPriceMin: Number(askPriceMin),
      askPriceMax: Number(askPriceMax),
      impliedValuation: impliedValuation ? Number(impliedValuation) : undefined,
      posMethod,
      posVerified,
      posAttestationHash: posMethod === 'DOCUMENT_HASH' ? documentHash : undefined,
      certificateHash: posMethod === 'DOCUMENT_HASH' ? documentHash : undefined,
      transferAgentVerified: posMethod === 'TRANSFER_AGENT' && posVerified,
      escrowVerified: posMethod === 'ESCROW' && posVerified,
      rofrWaiver,
      lockupExpired,
      rule144Compliant: rule144Compliance,
      status: 'ACTIVE',
      expiresAt: new Date(expiryDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await addListing(listing);
      router.push(`/listings/${newId}`);
    } catch {
      setErrors((prev) => ({
        ...prev,
        submit: 'Failed to create listing. Please try again.',
      }));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Create New Listing</h1>

      <div className="flex flex-col gap-6">
        {/* Section 1: Company Details */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Company Details</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
              {errors.companyName && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.companyName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Share Class
              </label>
              <Select
                value={shareClass}
                onChange={(e) => setShareClass(e.target.value as ShareClass)}
                options={SHARE_CLASSES.map((sc) => ({
                  label: sc,
                  value: sc,
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Quantity & Pricing */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quantity &amp; Pricing</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity Min <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={quantityMin}
                  onChange={(e) =>
                    setQuantityMin(
                      e.target.value ? Number(e.target.value) : ''
                    )
                  }
                  placeholder="Min shares"
                  min={1}
                />
                {errors.quantityMin && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.quantityMin}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity Max <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={quantityMax}
                  onChange={(e) =>
                    setQuantityMax(
                      e.target.value ? Number(e.target.value) : ''
                    )
                  }
                  placeholder="Max shares"
                  min={1}
                />
                {errors.quantityMax && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.quantityMax}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ask Price Min ($) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={askPriceMin}
                  onChange={(e) =>
                    setAskPriceMin(
                      e.target.value ? Number(e.target.value) : ''
                    )
                  }
                  placeholder="Min price"
                  min={0.01}
                  step={0.01}
                />
                {errors.askPriceMin && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.askPriceMin}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ask Price Max ($) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={askPriceMax}
                  onChange={(e) =>
                    setAskPriceMax(
                      e.target.value ? Number(e.target.value) : ''
                    )
                  }
                  placeholder="Max price"
                  min={0.01}
                  step={0.01}
                />
                {errors.askPriceMax && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.askPriceMax}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Implied Valuation ($)
              </label>
              <Input
                type="number"
                value={impliedValuation}
                onChange={(e) =>
                  setImpliedValuation(
                    e.target.value ? Number(e.target.value) : ''
                  )
                }
                placeholder="Optional"
                min={0}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Proof of Shares Verification */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Proof of Shares Verification
              </h2>
              {posVerified && (
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {errors.pos && (
              <p className="text-sm text-red-500">{errors.pos}</p>
            )}

            {/* Option 1: Document Hash Attestation */}
            <label className="flex items-start gap-3 p-3 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-muted/50">
              <input
                type="radio"
                name="posMethod"
                value="document_hash"
                checked={posMethod === 'DOCUMENT_HASH'}
                onChange={() => {
                  setPosMethod('DOCUMENT_HASH');
                  setPosVerified(false);
                  setDocumentHash('');
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Document Hash Attestation
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a share certificate or cap table document. A SHA-256
                  hash will be computed and stored as proof.
                </p>
                {posMethod === 'DOCUMENT_HASH' && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      />
                      {isHashing && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                    {documentHash && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs font-mono break-all">
                        SHA-256: {documentHash}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </label>

            {/* Option 2: Transfer Agent Integration */}
            <label className="flex items-start gap-3 p-3 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-muted/50">
              <input
                type="radio"
                name="posMethod"
                value="transfer_agent"
                checked={posMethod === 'TRANSFER_AGENT'}
                onChange={() => {
                  setPosMethod('TRANSFER_AGENT');
                  setPosVerified(false);
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    Transfer Agent Integration
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect directly to Carta to verify your share ownership.
                </p>
                {posMethod === 'TRANSFER_AGENT' && (
                  <div className="mt-3">
                    <Button
                      onClick={handleCartaConnect}
                      disabled={isConnecting || posVerified}
                      variant="outline"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : posVerified ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Connected to Carta
                        </>
                      ) : (
                        <>
                          <Building2 className="h-4 w-4 mr-2" />
                          Connect to Carta
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </label>

            {/* Option 3: Escrow Pre-verification */}
            <label className="flex items-start gap-3 p-3 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-muted/50">
              <input
                type="radio"
                name="posMethod"
                value="escrow"
                checked={posMethod === 'ESCROW'}
                onChange={() => {
                  setPosMethod('ESCROW');
                  setPosVerified(false);
                  setEscrowAgentName('');
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Escrow Pre-verification</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Submit share details to an escrow agent for independent
                  verification.
                </p>
                {posMethod === 'ESCROW' && (
                  <div className="mt-3 flex flex-col gap-2">
                    <Input
                      value={escrowAgentName}
                      onChange={(e) => setEscrowAgentName(e.target.value)}
                      placeholder="Escrow agent name"
                    />
                    {errors.escrow && (
                      <p className="text-sm text-red-500">{errors.escrow}</p>
                    )}
                    <Button
                      onClick={handleEscrowSubmit}
                      disabled={isConnecting || posVerified}
                      variant="outline"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : posVerified ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verified
                        </>
                      ) : (
                        'Submit for Verification'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Section 4: Transfer Restriction Compliance */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Transfer Restriction Compliance
            </h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={rofrWaiver}
                onChange={(e) => setRofrWaiver(e.target.checked)}
              />
              <span className="text-sm">
                ROFR waiver obtained from company
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={lockupExpired}
                onChange={(e) => setLockupExpired(e.target.checked)}
              />
              <span className="text-sm">Lockup period has expired</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={rule144Compliance}
                onChange={(e) => setRule144Compliance(e.target.checked)}
              />
              <span className="text-sm">
                Rule 144 holding period compliance attested
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Section 5: Listing Options */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Listing Options</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expiry Date
              </label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={mintToken}
                onChange={(e) => setMintToken(e.target.checked)}
              />
              <span className="text-sm">
                Mint Listing Token (on-chain tokenization)
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Submit */}
        {errors.submit && (
          <p className="text-sm text-red-500 text-center">{errors.submit}</p>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          size="lg"
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Listing...
            </>
          ) : (
            'Create Listing'
          )}
        </Button>
      </div>
    </div>
  );
}
