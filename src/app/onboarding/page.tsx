'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Mail,
  Shield,
  CheckCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';

const STEPS = [
  { label: 'Wallet', icon: Wallet },
  { label: 'Email', icon: Mail },
  { label: 'KYC', icon: Shield },
  { label: 'Attestation', icon: CheckCircle },
  { label: 'Credential', icon: ArrowRight },
];

type QualificationMethod = 'income' | 'net_worth' | 'professional' | 'entity';

export default function OnboardingPage() {
  const router = useRouter();
  const {
    connectWallet,
    setEmail,
    setKycStatus,
    attestAccredited,
    setDidToken,
  } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [emailValue, setEmailValue] = useState('');
  const [emailError, setEmailError] = useState('');
  const [kycLoading, setKycLoading] = useState(false);
  const [kycVerified, setKycVerified] = useState(false);
  const [attested, setAttested] = useState(false);
  const [qualificationMethod, setQualificationMethod] =
    useState<QualificationMethod | null>(null);
  const [didTokenValue, setDidTokenValue] = useState<string | null>(null);

  const advance = () => setCurrentStep((s) => s + 1);

  // Step 1 – Wallet Connect
  const handleConnectWallet = () => {
    const randomAddr =
      '0x' +
      Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join('');
    setWalletAddress(randomAddr);
    connectWallet(randomAddr);
    setTimeout(advance, 400);
  };

  // Step 2 – Email Capture
  const handleEmailSubmit = () => {
    const trimmed = emailValue.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    setEmail(trimmed);
    advance();
  };

  // Step 3 – KYC Verification
  const handleStartKyc = () => {
    setKycLoading(true);
    setTimeout(() => {
      setKycLoading(false);
      setKycVerified(true);
      setKycStatus('VERIFIED');
      setTimeout(advance, 500);
    }, 2000);
  };

  // Step 4 – Accredited Investor Attestation
  const handleAttestation = () => {
    if (!attested || !qualificationMethod) return;
    attestAccredited();
    advance();
  };

  // Step 5 – Credential Issuance
  const handleIssueCredential = () => {
    const token =
      'did:ethr:' +
      Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join('');
    setDidTokenValue(token);
    setDidToken(token);
  };

  // ──────────────────── render helpers ────────────────────

  const renderProgressBar = () => (
    <div className="flex items-center justify-center gap-1 mb-10">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  isCompleted
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${
                  isActive
                    ? 'text-indigo-600'
                    : isCompleted
                      ? 'text-indigo-600'
                      : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-1 mt-[-14px] ${
                  i < currentStep ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      // ── Step 1: Wallet Connect ──
      case 0:
        return (
          <>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Connect Your Wallet
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Link a Web3 wallet to get started on the marketplace.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {walletAddress ? (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="info"
                    className="font-mono text-xs py-1 px-3"
                  >
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </Badge>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              ) : (
                <Button
                  onClick={handleConnectWallet}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              )}
            </CardContent>
          </>
        );

      // ── Step 2: Email Capture ──
      case 1:
        return (
          <>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Verify Your Email
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We&apos;ll use this to send transaction confirmations and
                compliance updates.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={emailValue}
                  onChange={(e) => {
                    setEmailValue(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  className={emailError ? 'border-red-400' : ''}
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-500">{emailError}</p>
                )}
              </div>
              <Button
                onClick={handleEmailSubmit}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Continue
              </Button>
            </CardContent>
          </>
        );

      // ── Step 3: KYC Verification ──
      case 2:
        return (
          <>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                KYC Verification
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Complete identity verification powered by Persona.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {kycVerified ? (
                <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">Verified</span>
                </div>
              ) : kycLoading ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Verifying your identity...
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleStartKyc}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Start KYC Verification
                </Button>
              )}
            </CardContent>
          </>
        );

      // ── Step 4: Accredited Investor Attestation ──
      case 3:
        return (
          <>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Accredited Investor Attestation
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Federal securities law requires verification of accredited
                investor status.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attested}
                  onChange={(e) => setAttested(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  I certify that I am an accredited investor as defined under
                  Rule 501 of Regulation D of the Securities Act of 1933, and I
                  understand that this attestation is required to participate in
                  the pre-IPO secondary marketplace.
                </span>
              </label>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Qualification method:
                </p>
                {(
                  [
                    {
                      value: 'income',
                      label:
                        'Income — Individual income exceeding $200,000 (or $300,000 joint) in each of the past two years',
                    },
                    {
                      value: 'net_worth',
                      label:
                        'Net Worth — Individual or joint net worth exceeding $1,000,000 excluding primary residence',
                    },
                    {
                      value: 'professional',
                      label:
                        'Professional Certification — Series 7, 65, or 82 license holder in good standing',
                    },
                    {
                      value: 'entity',
                      label:
                        'Entity — Entity with assets exceeding $5,000,000 not formed for the specific purpose of acquiring the securities',
                    },
                  ] as { value: QualificationMethod; label: string }[]
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-start gap-3 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:border-indigo-300 transition-colors"
                  >
                    <input
                      type="radio"
                      name="qualification"
                      value={opt.value}
                      checked={qualificationMethod === opt.value}
                      onChange={() => setQualificationMethod(opt.value)}
                      className="mt-0.5 h-4 w-4 border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                  </label>
                ))}
              </div>

              <Button
                onClick={handleAttestation}
                disabled={!attested || !qualificationMethod}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Attestation
              </Button>
            </CardContent>
          </>
        );

      // ── Step 5: Credential Issuance ──
      case 4:
        return (
          <>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Credential Issuance
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your verifiable credential is ready to be issued.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {didTokenValue ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-700 font-medium">
                      Onboarding Complete
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">DID Token ID</p>
                    <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                      {didTokenValue}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleIssueCredential}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Issue Credential
                </Button>
              )}
            </CardContent>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
          Marketplace Onboarding
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
          Complete these steps to start trading pre-IPO securities.
        </p>

        {renderProgressBar()}

        <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
          {renderStepContent()}
        </Card>
      </div>
    </div>
  );
}
