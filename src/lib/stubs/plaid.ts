/**
 * Plaid Bank Verification Stub
 * Replace with real Plaid Link + API when ready.
 * Docs: https://plaid.com/docs/
 */

export interface PlaidLinkToken {
  linkToken: string;
  expiration: string;
}

export interface PlaidAccountBalance {
  accountId: string;
  name: string;
  officialName: string;
  type: string;
  balances: {
    available: number;
    current: number;
    isoCurrencyCode: string;
  };
}

export async function createLinkToken(userId: string): Promise<PlaidLinkToken> {
  await new Promise(r => setTimeout(r, 500));
  return {
    linkToken: `link-sandbox-${userId}-${Date.now()}`,
    expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
}

export async function exchangePublicToken(publicToken: string): Promise<string> {
  await new Promise(r => setTimeout(r, 500));
  return `access-sandbox-${publicToken.slice(0, 8)}-${Date.now()}`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getAccountBalance(accessToken: string): Promise<PlaidAccountBalance> {
  await new Promise(r => setTimeout(r, 800));
  // Return a mock balance that gives a TIER_3 PoF
  return {
    accountId: `acc_${Date.now()}`,
    name: 'Checking Account',
    officialName: 'Premium Checking',
    type: 'depository',
    balances: {
      available: 350_000,
      current: 352_450,
      isoCurrencyCode: 'USD',
    },
  };
}

export function generateAttestationHash(balance: PlaidAccountBalance): string {
  const data = JSON.stringify({
    accountId: balance.accountId,
    available: balance.balances.available,
    timestamp: Date.now(),
  });
  // In production, this would be a proper cryptographic attestation
  return `0x${Buffer.from(data).toString('hex').slice(0, 64)}`;
}
