'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Listing, ListingFilters } from '@/lib/types';
import { mockListings } from '@/lib/mock-data';

const STORAGE_KEY = 'marketplace_listings';

function loadListings(): Listing[] {
  if (typeof window === 'undefined') return mockListings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((l: Record<string, unknown>) => ({
        ...l,
        createdAt: new Date(l.createdAt as string),
        updatedAt: new Date(l.updatedAt as string),
        expiresAt: new Date(l.expiresAt as string),
        posVerifiedAt: l.posVerifiedAt ? new Date(l.posVerifiedAt as string) : undefined,
      }));
    }
  } catch { /* ignore */ }
  return mockListings;
}

function saveListings(listings: Listing[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  }
}

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setListings(loadListings());
    setLoading(false);
  }, []);

  const addListing = useCallback((listing: Listing) => {
    setListings(prev => {
      const updated = [listing, ...prev];
      saveListings(updated);
      return updated;
    });
  }, []);

  const updateListing = useCallback((id: string, updates: Partial<Listing>) => {
    setListings(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l);
      saveListings(updated);
      return updated;
    });
  }, []);

  const filterListings = useCallback((filters: ListingFilters): Listing[] => {
    let result = listings.filter(l => l.status === 'ACTIVE');

    if (filters.companyName) {
      result = result.filter(l =>
        l.companyName.toLowerCase().includes(filters.companyName!.toLowerCase())
      );
    }
    if (filters.shareClass) {
      result = result.filter(l => l.shareClass === filters.shareClass);
    }
    if (filters.valuationMin !== undefined) {
      result = result.filter(l => (l.impliedValuation || 0) >= filters.valuationMin!);
    }
    if (filters.valuationMax !== undefined) {
      result = result.filter(l => (l.impliedValuation || 0) <= filters.valuationMax!);
    }
    if (filters.posMethod) {
      result = result.filter(l => l.posMethod === filters.posMethod);
    }
    if (filters.posVerifiedOnly) {
      result = result.filter(l => l.posVerified);
    }
    if (filters.dealSizeMin !== undefined) {
      result = result.filter(l => l.askPriceMin * l.quantityMin >= filters.dealSizeMin!);
    }
    if (filters.dealSizeMax !== undefined) {
      result = result.filter(l => l.askPriceMin * l.quantityMin <= filters.dealSizeMax!);
    }
    if (filters.maxAge !== undefined) {
      const cutoff = new Date(Date.now() - filters.maxAge! * 24 * 60 * 60 * 1000);
      result = result.filter(l => new Date(l.createdAt) >= cutoff);
    }

    switch (filters.sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price_asc':
        result.sort((a, b) => a.askPriceMin - b.askPriceMin);
        break;
      case 'price_desc':
        result.sort((a, b) => b.askPriceMin - a.askPriceMin);
        break;
      case 'valuation':
        result.sort((a, b) => (b.impliedValuation || 0) - (a.impliedValuation || 0));
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [listings]);

  return { listings, loading, addListing, updateListing, filterListings };
}
