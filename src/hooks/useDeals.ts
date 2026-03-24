'use client';

import { useState, useCallback, useEffect } from 'react';
import type { InterestRequest, InterestRequestStatus, ListingPrivateInfo, BuyerCredentials } from '@/lib/types';

const REQUESTS_KEY = 'marketplace_interest_requests';
const PRIVATE_INFO_KEY = 'marketplace_listing_private_info';

function loadRequests(): InterestRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(REQUESTS_KEY);
    if (stored) {
      return JSON.parse(stored).map((r: Record<string, unknown>) => ({
        ...r,
        createdAt: new Date(r.createdAt as string),
        updatedAt: new Date(r.updatedAt as string),
        buyerCredentials: {
          ...(r.buyerCredentials as Record<string, unknown>),
          pofVerifiedAt: (r.buyerCredentials as Record<string, unknown>)?.pofVerifiedAt
            ? new Date((r.buyerCredentials as Record<string, unknown>).pofVerifiedAt as string)
            : undefined,
        },
      }));
    }
  } catch { /* ignore */ }
  return [];
}

function saveRequests(requests: InterestRequest[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  }
}

function loadPrivateInfo(): ListingPrivateInfo[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PRIVATE_INFO_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function savePrivateInfo(info: ListingPrivateInfo[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRIVATE_INFO_KEY, JSON.stringify(info));
  }
}

export function useDeals() {
  const [requests, setRequests] = useState<InterestRequest[]>([]);
  const [privateInfos, setPrivateInfos] = useState<ListingPrivateInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRequests(loadRequests());
    setPrivateInfos(loadPrivateInfo());
    setLoading(false);
  }, []);

  // Buyer submits interest request with their credentials
  const submitInterest = useCallback((params: {
    listingId: string;
    buyerId: string;
    buyerWallet: string;
    buyerCredentials: BuyerCredentials;
    message: string;
    intendedQuantityMin?: number;
    intendedQuantityMax?: number;
  }) => {
    const request: InterestRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...params,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setRequests(prev => {
      const updated = [request, ...prev];
      saveRequests(updated);
      return updated;
    });
    return request;
  }, []);

  // Seller approves/declines a request
  const updateRequestStatus = useCallback((requestId: string, status: InterestRequestStatus, sellerNote?: string) => {
    setRequests(prev => {
      const updated = prev.map(r =>
        r.id === requestId ? { ...r, status, sellerNote, updatedAt: new Date() } : r
      );
      saveRequests(updated);
      return updated;
    });
  }, []);

  // Buyer withdraws their request
  const withdrawRequest = useCallback((requestId: string) => {
    setRequests(prev => {
      const updated = prev.map(r =>
        r.id === requestId ? { ...r, status: 'WITHDRAWN' as InterestRequestStatus, updatedAt: new Date() } : r
      );
      saveRequests(updated);
      return updated;
    });
  }, []);

  // Get requests for a specific listing (seller view)
  const getRequestsForListing = useCallback((listingId: string) => {
    return requests.filter(r => r.listingId === listingId);
  }, [requests]);

  // Get requests by a specific buyer (buyer view)
  const getRequestsByBuyer = useCallback((buyerId: string) => {
    return requests.filter(r => r.buyerId === buyerId);
  }, [requests]);

  // Check if buyer has access to a listing's private info
  const hasApprovedAccess = useCallback((listingId: string, buyerId: string) => {
    return requests.some(r =>
      r.listingId === listingId && r.buyerId === buyerId && r.status === 'APPROVED'
    );
  }, [requests]);

  // Check if buyer already has a pending/approved request for a listing
  const getExistingRequest = useCallback((listingId: string, buyerId: string) => {
    return requests.find(r =>
      r.listingId === listingId && r.buyerId === buyerId && (r.status === 'PENDING' || r.status === 'APPROVED')
    );
  }, [requests]);

  // Seller sets private info for a listing
  const setPrivateInfo = useCallback((info: ListingPrivateInfo) => {
    setPrivateInfos(prev => {
      const existing = prev.findIndex(p => p.listingId === info.listingId);
      const updated = existing >= 0
        ? prev.map((p, i) => i === existing ? info : p)
        : [...prev, info];
      savePrivateInfo(updated);
      return updated;
    });
  }, []);

  // Get private info for a listing
  const getPrivateInfo = useCallback((listingId: string) => {
    return privateInfos.find(p => p.listingId === listingId);
  }, [privateInfos]);

  return {
    requests,
    privateInfos,
    loading,
    submitInterest,
    updateRequestStatus,
    withdrawRequest,
    getRequestsForListing,
    getRequestsByBuyer,
    hasApprovedAccess,
    getExistingRequest,
    setPrivateInfo,
    getPrivateInfo,
  };
}
