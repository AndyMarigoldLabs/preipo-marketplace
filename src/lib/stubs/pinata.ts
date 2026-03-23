/**
 * Pinata IPFS Integration Stub
 * Replace with real Pinata SDK when ready.
 * Docs: https://docs.pinata.cloud/
 */

export interface PinataUploadResult {
  ipfsHash: string;
  pinSize: number;
  timestamp: string;
  gatewayUrl: string;
}

export interface ListingTokenMetadata {
  name: string;
  description: string;
  company: string;
  shareClass: string;
  quantityRange: [number, number];
  askPriceRange: [number, number];
  sellerCredentialHash: string;
  posAttestationHash: string;
  expiry: string;
}

export async function uploadJSON(data: Record<string, unknown>): Promise<PinataUploadResult> {
  await new Promise(r => setTimeout(r, 600));
  const mockHash = `Qm${Array.from({ length: 44 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
  ).join('')}`;
  return {
    ipfsHash: mockHash,
    pinSize: JSON.stringify(data).length,
    timestamp: new Date().toISOString(),
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${mockHash}`,
  };
}

export async function uploadFile(file: File): Promise<PinataUploadResult> {
  await new Promise(r => setTimeout(r, 1000));
  const mockHash = `Qm${Array.from({ length: 44 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
  ).join('')}`;
  return {
    ipfsHash: mockHash,
    pinSize: file.size,
    timestamp: new Date().toISOString(),
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${mockHash}`,
  };
}

export async function uploadListingMetadata(metadata: ListingTokenMetadata): Promise<PinataUploadResult> {
  return uploadJSON(metadata as unknown as Record<string, unknown>);
}

export async function getJSON(ipfsHash: string): Promise<Record<string, unknown>> {
  await new Promise(r => setTimeout(r, 300));
  return {
    mockData: true,
    hash: ipfsHash,
    retrievedAt: new Date().toISOString(),
  };
}
