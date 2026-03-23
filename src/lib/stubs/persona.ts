/**
 * Persona KYC Integration Stub
 * Replace with real Persona API calls when ready.
 * Docs: https://docs.withpersona.com/reference
 */

export interface PersonaInquiry {
  id: string;
  status: 'created' | 'pending' | 'completed' | 'failed' | 'expired';
  referenceId: string;
  fields: {
    firstName?: string;
    lastName?: string;
    birthdate?: string;
    addressStreet?: string;
    addressCity?: string;
    addressState?: string;
    addressPostalCode?: string;
    addressCountryCode?: string;
  };
}

export interface PersonaVerification {
  id: string;
  inquiryId: string;
  status: 'initiated' | 'submitted' | 'passed' | 'failed' | 'requires_retry';
  documentType?: string;
  documentHash?: string;
}

let mockDelay = 1500;

export function setMockDelay(ms: number) {
  mockDelay = ms;
}

export async function createInquiry(referenceId: string): Promise<PersonaInquiry> {
  await new Promise(r => setTimeout(r, mockDelay));
  return {
    id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'created',
    referenceId,
    fields: {},
  };
}

export async function getInquiry(inquiryId: string): Promise<PersonaInquiry> {
  await new Promise(r => setTimeout(r, mockDelay));
  return {
    id: inquiryId,
    status: 'completed',
    referenceId: 'mock-user',
    fields: {
      firstName: 'John',
      lastName: 'Doe',
      birthdate: '1985-06-15',
      addressStreet: '123 Main St',
      addressCity: 'San Francisco',
      addressState: 'CA',
      addressPostalCode: '94102',
      addressCountryCode: 'US',
    },
  };
}

export async function submitVerification(inquiryId: string): Promise<PersonaVerification> {
  await new Promise(r => setTimeout(r, mockDelay));
  return {
    id: `ver_${Date.now()}`,
    inquiryId,
    status: 'passed',
    documentType: 'drivers_license',
    documentHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
  };
}

export function isOFACSanctioned(countryCode: string): boolean {
  const sanctionedCountries = ['CU', 'IR', 'KP', 'SY', 'RU'];
  return sanctionedCountries.includes(countryCode.toUpperCase());
}
