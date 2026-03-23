'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useListings } from '@/hooks/useListings';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatCurrency, daysAgo } from '@/lib/utils';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Flag,
  Eye,
  Users,
  FileText,
  Clock,
} from 'lucide-react';

type Tab = 'flagged' | 'kyc' | 'compliance';

interface KycEscalation {
  id: string;
  walletAddress: string;
  issue: string;
  submittedAt: Date;
  status: 'pending' | 'resolved' | 'rejected';
}

interface ComplianceEntry {
  id: string;
  timestamp: Date;
  action: string;
  actor: string;
  details: string;
}

const mockKycEscalations: KycEscalation[] = [
  {
    id: 'kyc_1',
    walletAddress: '0x1a2B3c4D5e6F7890abCDEF1234567890ABcDeF12',
    issue: 'Document mismatch: ID name does not match wallet registration name',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'pending',
  },
  {
    id: 'kyc_2',
    walletAddress: '0xABcD1234EFgh5678IJkl9012MNop3456QRst7890',
    issue: 'Accredited investor attestation flagged: income documentation expired',
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'pending',
  },
  {
    id: 'kyc_3',
    walletAddress: '0x9876FeDcBa0123456789AbCdEf0123456789ABCD',
    issue: 'Proof of funds verification failed: bank letter older than 90 days',
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'pending',
  },
];

const mockComplianceLog: ComplianceEntry[] = [
  {
    id: 'log_1',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    action: 'Listing Approved',
    actor: 'admin',
    details: 'Listing LST-001 for SpaceX Common shares approved after manual review',
  },
  {
    id: 'log_2',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    action: 'KYC Verified',
    actor: 'system',
    details: 'User 0x1a2B...eF12 passed automated KYC via Persona',
  },
  {
    id: 'log_3',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    action: 'Listing Flagged',
    actor: 'system',
    details: 'Listing LST-005 auto-flagged: implied valuation exceeds 2x last known round',
  },
  {
    id: 'log_4',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    action: 'Deal Room Created',
    actor: 'system',
    details: 'Deal room DR-012 created between buyer 0xABcD... and seller 0x9876...',
  },
  {
    id: 'log_5',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    action: 'KYC Rejected',
    actor: 'admin',
    details: 'User 0xFEDC...5678 KYC rejected: suspected fraudulent documentation',
  },
  {
    id: 'log_6',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    action: 'Listing Expired',
    actor: 'system',
    details: 'Listing LST-003 for Stripe Preferred shares expired after 30-day window',
  },
];

export default function AdminPage() {
  const { isAuthenticated, user, setRole, connectWallet } = useAuth();
  const { listings, loading } = useListings();
  const [activeTab, setActiveTab] = useState<Tab>('flagged');
  const [listingStatuses, setListingStatuses] = useState<Record<string, 'approved' | 'flagged'>>({});
  const [kycEscalations, setKycEscalations] = useState<KycEscalation[]>(mockKycEscalations);

  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  const handleEnableAdmin = async () => {
    if (!isAuthenticated) {
      await connectWallet('0xADMIN0000000000000000000000000000000001');
    }
    setRole('ADMIN');
  };

  const handleApproveListing = (listingId: string) => {
    setListingStatuses(prev => ({ ...prev, [listingId]: 'approved' }));
  };

  const handleFlagListing = (listingId: string) => {
    setListingStatuses(prev => ({ ...prev, [listingId]: 'flagged' }));
  };

  const handleResolveKyc = (id: string) => {
    setKycEscalations(prev =>
      prev.map(e => (e.id === id ? { ...e, status: 'resolved' as const } : e))
    );
  };

  const handleRejectKyc = (id: string) => {
    setKycEscalations(prev =>
      prev.map(e => (e.id === id ? { ...e, status: 'rejected' as const } : e))
    );
  };

  const activeListings = listings.filter(l => l.status === 'ACTIVE');
  const pendingKycCount = kycEscalations.filter(e => e.status === 'pending').length;
  const flaggedCount = Object.values(listingStatuses).filter(s => s === 'flagged').length || 1;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You must be an authenticated admin to view this page.
            </p>
            <Button onClick={handleEnableAdmin} className="w-full">
              Enable Admin Mode
            </Button>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              MVP only: This button grants admin access for testing purposes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function formatTimestamp(date: Date): string {
    const hours = daysAgo(date) * 24;
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    return `${daysAgo(date)}d ago`;
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'flagged', label: 'Flagged Listings', icon: <Flag className="w-4 h-4" /> },
    { key: 'kyc', label: 'KYC Escalations', icon: <Users className="w-4 h-4" /> },
    { key: 'compliance', label: 'Compliance Log', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Review flagged listings, KYC escalations, and compliance logs</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Marketplace</Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Listings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{listings.length}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Listings</p>
                  <p className="text-2xl font-bold text-emerald-600">{activeListings.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending KYC Reviews</p>
                  <p className="text-2xl font-bold text-amber-600">{pendingKycCount}</p>
                </div>
                <Users className="w-8 h-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Flagged Items</p>
                  <p className="text-2xl font-bold text-red-600">{flaggedCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex gap-6">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'flagged' && (
          <div className="space-y-3">
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Loading listings...</p>
            ) : listings.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No listings to review.</p>
            ) : (
              listings.map(listing => {
                const reviewStatus = listingStatuses[listing.id];
                return (
                  <Card key={listing.id} className={
                    reviewStatus === 'approved'
                      ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/20'
                      : reviewStatus === 'flagged'
                      ? 'border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-900/20'
                      : ''
                  }>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {listing.companyName}
                              </h3>
                              <Badge variant={
                                listing.status === 'ACTIVE' ? 'success' :
                                listing.status === 'FLAGGED' ? 'danger' :
                                listing.status === 'EXPIRED' ? 'warning' : 'default'
                              }>
                                {listing.status}
                              </Badge>
                              {reviewStatus === 'approved' && (
                                <Badge variant="success">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approved
                                </Badge>
                              )}
                              {reviewStatus === 'flagged' && (
                                <Badge variant="danger">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Flagged
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>{listing.shareClass}</span>
                              <span>{formatCurrency(listing.askPriceMin)} - {formatCurrency(listing.askPriceMax)}/share</span>
                              <span>{listing.quantityMin.toLocaleString()} - {listing.quantityMax.toLocaleString()} shares</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {daysAgo(listing.createdAt)}d ago
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <Link href={`/listings/${listing.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            onClick={() => handleApproveListing(listing.id)}
                            disabled={reviewStatus === 'approved'}
                            className={reviewStatus === 'approved' ? 'bg-emerald-600' : ''}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFlagListing(listing.id)}
                            disabled={reviewStatus === 'flagged'}
                            className={reviewStatus === 'flagged' ? 'border-red-400 text-red-600 dark:text-red-400 dark:border-red-600' : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'}
                          >
                            <Flag className="w-4 h-4 mr-1" />
                            Flag
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="space-y-3">
            {kycEscalations.map(escalation => (
              <Card key={escalation.id} className={
                escalation.status === 'resolved'
                  ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/20'
                  : escalation.status === 'rejected'
                  ? 'border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-900/20'
                  : ''
              }>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {escalation.walletAddress.slice(0, 10)}...{escalation.walletAddress.slice(-8)}
                        </h3>
                        {escalation.status === 'pending' && (
                          <Badge variant="warning">Pending</Badge>
                        )}
                        {escalation.status === 'resolved' && (
                          <Badge variant="success">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                        {escalation.status === 'rejected' && (
                          <Badge variant="danger">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{escalation.issue}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Submitted {daysAgo(escalation.submittedAt)}d ago
                      </p>
                    </div>
                    {escalation.status === 'pending' && (
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleResolveKyc(escalation.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectKyc(escalation.id)}
                          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-3">
            {mockComplianceLog.map(entry => {
              const actionIcon = entry.action.includes('Approved') || entry.action.includes('Verified')
                ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                : entry.action.includes('Flagged') || entry.action.includes('Rejected')
                ? <AlertTriangle className="w-5 h-5 text-red-500" />
                : <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />;

              const actionBadgeVariant = entry.action.includes('Approved') || entry.action.includes('Verified')
                ? 'success' as const
                : entry.action.includes('Flagged') || entry.action.includes('Rejected')
                ? 'danger' as const
                : 'default' as const;

              return (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{actionIcon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={actionBadgeVariant}>{entry.action}</Badge>
                          <span className="text-xs text-gray-400 dark:text-gray-500">by {entry.actor}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{entry.details}</p>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
