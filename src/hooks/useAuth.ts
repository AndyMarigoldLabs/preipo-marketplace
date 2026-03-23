'use client';

import { useState, useCallback, useEffect } from 'react';
import type { User, KycStatus, UserRole, PofTier, PofMethod } from '@/lib/types';

const STORAGE_KEY = 'marketplace_auth';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

function loadState(): AuthState {
  if (typeof window === 'undefined') return { isAuthenticated: false, user: null };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.user) {
        parsed.user.createdAt = new Date(parsed.user.createdAt);
        parsed.user.updatedAt = new Date(parsed.user.updatedAt);
        if (parsed.user.pofVerifiedAt) parsed.user.pofVerifiedAt = new Date(parsed.user.pofVerifiedAt);
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return { isAuthenticated: false, user: null };
}

function saveState(state: AuthState) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setState(loadState());
    setLoading(false);
  }, []);

  const connectWallet = useCallback(async (walletAddress: string) => {
    const user: User = {
      id: `user_${walletAddress.slice(2, 10)}`,
      walletAddress,
      kycStatus: 'PENDING',
      role: 'UNVERIFIED',
      accreditedInvestorAttestation: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const newState = { isAuthenticated: true, user };
    setState(newState);
    saveState(newState);
    return user;
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState(prev => {
      if (!prev.user) return prev;
      const newUser = { ...prev.user, ...updates, updatedAt: new Date() };
      const newState = { ...prev, user: newUser };
      saveState(newState);
      return newState;
    });
  }, []);

  const setEmail = useCallback((email: string) => updateUser({ email }), [updateUser]);

  const setKycStatus = useCallback((kycStatus: KycStatus) => {
    const roleUpdate: Partial<User> = { kycStatus };
    if (kycStatus === 'VERIFIED') {
      roleUpdate.role = 'BUYER';
    }
    updateUser(roleUpdate);
  }, [updateUser]);

  const setRole = useCallback((role: UserRole) => updateUser({ role }), [updateUser]);

  const attestAccredited = useCallback(() => {
    updateUser({ accreditedInvestorAttestation: true });
  }, [updateUser]);

  const setDidToken = useCallback((didTokenId: string) => updateUser({ didTokenId }), [updateUser]);

  const setPof = useCallback((tier: PofTier, method: PofMethod) => {
    updateUser({ pofTier: tier, pofMethod: method, pofVerifiedAt: new Date() });
  }, [updateUser]);

  const disconnect = useCallback(() => {
    const newState = { isAuthenticated: false, user: null };
    setState(newState);
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    ...state,
    loading,
    connectWallet,
    setEmail,
    setKycStatus,
    setRole,
    attestAccredited,
    setDidToken,
    setPof,
    disconnect,
    updateUser,
  };
}
