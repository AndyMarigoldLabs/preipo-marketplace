export type KycStatus = 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'FAILED';
export type ShareClass = 'Common' | 'Preferred' | 'Options' | 'Warrants';
export type PosMethod = 'DOCUMENT_HASH' | 'TRANSFER_AGENT' | 'ESCROW';
export type PofMethod = 'STABLECOIN_WALLET' | 'BANK_VERIFICATION' | 'LETTER_OF_CREDIT';
export type PofTier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';
export type UserRole = 'UNVERIFIED' | 'KYC_PENDING' | 'BUYER' | 'SELLER' | 'BOTH' | 'ADMIN';
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'FLAGGED';
export type DealRoomStatus = 'ACTIVE' | 'EXPIRED' | 'CLOSED';

export interface User {
  id: string;
  walletAddress: string;
  email?: string;
  kycStatus: KycStatus;
  role: UserRole;
  pofTier?: PofTier;
  pofMethod?: PofMethod;
  pofVerifiedAt?: Date;
  accreditedInvestorAttestation: boolean;
  didTokenId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KycCredential {
  id: string;
  userId: string;
  personaInquiryId?: string;
  documentHash: string;
  verificationMethod: string;
  status: KycStatus;
  credentialHash: string;
  issuedAt: Date;
  expiresAt: Date;
}

export interface Listing {
  id: string;
  sellerId: string;
  companyName: string;
  companyLogo?: string;
  shareClass: ShareClass;
  quantityMin: number;
  quantityMax: number;
  askPriceMin: number;
  askPriceMax: number;
  impliedValuation?: number;
  posMethod?: PosMethod;
  posVerified: boolean;
  posAttestationHash?: string;
  posVerifiedAt?: Date;
  certificateHash?: string;
  transferAgentVerified: boolean;
  escrowVerified: boolean;
  rofrWaiver: boolean;
  lockupExpired: boolean;
  rule144Compliant: boolean;
  listingTokenAddress?: string;
  listingTokenId?: string;
  status: ListingStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  seller?: User;
}

export interface SharesAttestation {
  id: string;
  listingId: string;
  method: PosMethod;
  certificateHash?: string;
  transferAgentName?: string;
  escrowAgentName?: string;
  verifiedAt?: Date;
  verifierAddress?: string;
  metadata: Record<string, unknown>;
}

export interface ProofOfFunds {
  id: string;
  userId: string;
  method: PofMethod;
  tier: PofTier;
  attestationHash: string;
  verifiedAt: Date;
  expiresAt: Date;
}

export interface DealRoom {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  status: DealRoomStatus;
  dealMemoHash?: string;
  lastActivityAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface DealRoomMessage {
  id: string;
  dealRoomId: string;
  senderId: string;
  content: string;
  documentHash?: string;
  documentName?: string;
  createdAt: Date;
}

export interface DealMemo {
  id: string;
  dealRoomId: string;
  termsHash: string;
  buyerSignature?: string;
  sellerSignature?: string;
  usdcPrice?: number;
  quantity?: number;
  signedAt?: Date;
  onChainTxHash?: string;
}

export interface ListingFilters {
  companyName?: string;
  shareClass?: ShareClass;
  valuationMin?: number;
  valuationMax?: number;
  posMethod?: PosMethod;
  posVerifiedOnly?: boolean;
  dealSizeMin?: number;
  dealSizeMax?: number;
  maxAge?: number;
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'valuation';
}

export type InterestRequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'WITHDRAWN';

export type AccessTier = 'PUBLIC' | 'VERIFIED_ONLY' | 'APPROVED_ONLY';

export interface BuyerCredentials {
  kycStatus: KycStatus;
  accreditedInvestorAttestation: boolean;
  pofTier?: PofTier;
  pofMethod?: PofMethod;
  pofVerifiedAt?: Date;
  didTokenId?: string;
  walletAddress: string;
}

export interface InterestRequest {
  id: string;
  listingId: string;
  buyerId: string;
  buyerWallet: string;
  buyerCredentials: BuyerCredentials;
  message: string;
  intendedQuantityMin?: number;
  intendedQuantityMax?: number;
  status: InterestRequestStatus;
  sellerNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingPrivateInfo {
  listingId: string;
  sideLetterHash?: string;
  sideLetterName?: string;
  certificateDocHash?: string;
  certificateDocName?: string;
  transferAgentContact?: string;
  escrowAgentContact?: string;
  sellerNotes?: string;
}

export interface OnboardingState {
  step: 'wallet' | 'email' | 'kyc' | 'accreditation' | 'credential' | 'complete';
  walletConnected: boolean;
  emailCaptured: boolean;
  kycSubmitted: boolean;
  accreditationAttested: boolean;
  credentialIssued: boolean;
}
