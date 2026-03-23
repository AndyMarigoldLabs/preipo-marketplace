export const PLATFORM_DISCLAIMER = `This platform is a bulletin board service only. It does not execute, clear, or settle securities transactions, and does not constitute a broker-dealer, investment adviser, or alternative trading system. All transactions are conducted directly between parties. Securities offered may not be registered under the Securities Act of 1933. This platform is available only to accredited investors as defined under Rule 501 of Regulation D. Past performance is not indicative of future results. Consult qualified legal and financial counsel before transacting.`;

export const NO_GENERAL_SOLICITATION_NOTICE = `This is not a general solicitation or advertisement. Access is restricted to pre-qualified accredited investors only.`;

export const KYC_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  SUSPENDED: 'SUSPENDED',
  FAILED: 'FAILED',
} as const;

export const POF_TIERS = {
  TIER_1: { label: '< $25K', min: 0, max: 25_000 },
  TIER_2: { label: '$25K – $250K', min: 25_000, max: 250_000 },
  TIER_3: { label: '$250K – $1M', min: 250_000, max: 1_000_000 },
  TIER_4: { label: '$1M+', min: 1_000_000, max: Infinity },
} as const;

export const SHARE_CLASSES = [
  'Common',
  'Preferred',
  'Options',
  'Warrants',
] as const;

export const POS_VERIFICATION_METHODS = [
  'DOCUMENT_HASH',
  'TRANSFER_AGENT',
  'ESCROW',
] as const;

export const POF_VERIFICATION_METHODS = [
  'STABLECOIN_WALLET',
  'BANK_VERIFICATION',
  'LETTER_OF_CREDIT',
] as const;

export const DEAL_ROOM_EXPIRY_DAYS = 60;

export const POF_EXPIRY_DAYS = 30;

export const INK_CHAIN = {
  id: 57073,
  name: 'Ink',
  network: 'ink',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-gel.inkonchain.com'] },
    public: { http: ['https://rpc-gel.inkonchain.com'] },
  },
  blockExplorers: {
    default: { name: 'Ink Explorer', url: 'https://explorer.inkonchain.com' },
  },
} as const;

export const SUPPORTED_STABLECOINS = [
  { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { symbol: 'USDT', name: 'Tether', decimals: 6 },
  { symbol: 'PYUSD', name: 'PayPal USD', decimals: 6 },
] as const;

export const USER_ROLES = {
  UNVERIFIED: 'UNVERIFIED',
  KYC_PENDING: 'KYC_PENDING',
  BUYER: 'BUYER',
  SELLER: 'SELLER',
  BOTH: 'BOTH',
  ADMIN: 'ADMIN',
} as const;
