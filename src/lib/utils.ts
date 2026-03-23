import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { POF_TIERS } from './constants';
import type { PofTier } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function getPofTierFromBalance(balance: number): PofTier {
  if (balance >= POF_TIERS.TIER_4.min) return 'TIER_4';
  if (balance >= POF_TIERS.TIER_3.min) return 'TIER_3';
  if (balance >= POF_TIERS.TIER_2.min) return 'TIER_2';
  return 'TIER_1';
}

export function getPofTierLabel(tier: PofTier): string {
  return POF_TIERS[tier].label;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function daysAgo(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

export function daysUntil(date: Date): number {
  return Math.floor((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function formatValuationShort(val: number): string {
  if (val >= 1_000_000_000_000) return `$${(val / 1_000_000_000_000).toFixed(0)}T`;
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(0)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
  return `$${val.toLocaleString()}`;
}

export function formatPosMethod(method: string): string {
  const map: Record<string, string> = {
    DOCUMENT_HASH: 'Document hash',
    TRANSFER_AGENT: 'Transfer agent',
    ESCROW: 'Escrow',
  };
  return map[method] || method;
}

export async function hashDocument(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
