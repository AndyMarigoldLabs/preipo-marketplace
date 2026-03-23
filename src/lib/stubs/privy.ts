/**
 * Privy Auth Integration Stub
 * Replace with real Privy SDK when ready.
 * Docs: https://docs.privy.io/
 */

import type { User, KycStatus, UserRole } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

let authState: AuthState = {
  isAuthenticated: false,
  user: null,
};

export function getAuthState(): AuthState {
  return { ...authState };
}

export async function connectWallet(walletAddress: string): Promise<User> {
  await new Promise(r => setTimeout(r, 800));
  const user: User = {
    id: `user_${walletAddress.slice(2, 10)}`,
    walletAddress,
    kycStatus: 'PENDING' as KycStatus,
    role: 'UNVERIFIED' as UserRole,
    accreditedInvestorAttestation: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  authState = { isAuthenticated: true, user };
  return user;
}

export async function setEmail(email: string): Promise<User> {
  if (!authState.user) throw new Error('Not authenticated');
  authState.user = { ...authState.user, email, updatedAt: new Date() };
  return authState.user;
}

export async function updateKycStatus(status: KycStatus): Promise<User> {
  if (!authState.user) throw new Error('Not authenticated');
  authState.user = { ...authState.user, kycStatus: status, updatedAt: new Date() };
  return authState.user;
}

export async function updateRole(role: UserRole): Promise<User> {
  if (!authState.user) throw new Error('Not authenticated');
  authState.user = { ...authState.user, role, updatedAt: new Date() };
  return authState.user;
}

export async function attestAccreditedInvestor(): Promise<User> {
  if (!authState.user) throw new Error('Not authenticated');
  authState.user = {
    ...authState.user,
    accreditedInvestorAttestation: true,
    updatedAt: new Date(),
  };
  return authState.user;
}

export async function disconnect(): Promise<void> {
  authState = { isAuthenticated: false, user: null };
}

export function isAuthenticated(): boolean {
  return authState.isAuthenticated;
}
