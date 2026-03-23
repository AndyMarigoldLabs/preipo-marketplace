# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PreIPO is a blockchain-verified bulletin board for accredited investors to discover pre-IPO secondary equity positions. It is NOT a broker-dealer—it's a discovery/connection platform only. Transactions happen off-platform between parties directly. Built on Ink Chain (Kraken L2).

## Commands

### Next.js App
```bash
npm run dev        # Dev server (localhost:3000)
npm run build      # Production build
npm start          # Production server
npm run lint       # ESLint
```

### Smart Contracts (run from contracts/ directory)
```bash
npm run compile              # Hardhat compile
npm run test                 # Hardhat tests
npm run deploy:local         # Deploy to local Hardhat node
npm run deploy:ink-sepolia   # Deploy to Ink Sepolia testnet
```

## Tech Stack

- **Framework**: Next.js 14 (App Router), React 18, TypeScript 5
- **Styling**: Tailwind CSS 3.4 with class-based dark mode
- **Database**: PostgreSQL via Prisma ORM
- **Blockchain**: Ink Chain (chainId 57073), Solidity 0.8.20, Hardhat, wagmi/viem/ethers.js
- **External Services**: Privy (auth), Persona (KYC), Plaid (bank verification), Pinata (IPFS)
- **Icons**: Lucide React

## Architecture

### Path Alias
`@/*` maps to `src/*` (configured in tsconfig.json).

### App Structure (src/app/)
- `/` — Landing page (hero + features)
- `/onboarding` — 5-step KYC flow: wallet → email → KYC → accreditation attestation → credential issuance
- `/listings` — Browse listings with filtering; `/listings/[id]` for detail
- `/profile` — User profile, KYC/PoF status, proof-of-funds verification
- `/deal-room/[id]` — Private negotiation between buyer and seller (stub)
- `/admin` — Admin dashboard (stub)

### State Management (src/hooks/)
Client-side hooks with localStorage persistence:
- `useAuth` — Auth state (wallet, KYC, PoF, DID), persisted as `marketplace_auth`
- `useListings` — Listings CRUD + filtering, persisted as `marketplace_listings`
- `useTheme` — Dark/light mode toggle

### Integration Stubs (src/lib/stubs/)
Privy, Persona, Plaid, and Pinata integrations are stubbed with mock implementations. Real API keys go in `.env` (see `.env.example`).

### Smart Contracts (contracts/contracts/)
All use UUPS upgradeable pattern with OpenZeppelin:
- **IdentityRegistry** — KYC credential hashes & DID mapping (no assets/custody)
- **ListingRegistry** — Central listing metadata registry, validates seller identity
- **SharesAttestation** — Proof of shares (document hash, transfer agent, or escrow)
- **ListingToken** — Optional ERC721 NFT per listing
- **DealMemo** — Deal terms with dual buyer/seller signatures

Target networks: Hardhat (local), Ink Sepolia (testnet, chainId 763373), Ink Chain (mainnet, chainId 57073).

### Database (prisma/schema.prisma)
Core tables: User, KycCredential, Listing, SharesAttestation, ProofOfFunds, DealRoom, DealRoomMessage, DealMemo. ProofOfFunds has 4 tiers and 30-day expiry.

### UI Components (src/components/ui/)
Custom component library: Button (5 variants: primary/secondary/outline/ghost/danger, 3 sizes), Card, Badge, Input, Modal, Select. Layout components in `src/components/layout/`.

## Regulatory Context

This platform is compliance-aware. Listings track Rule 144 compliance, ROFR waiver status, and lockup expiry. A "No General Solicitation" notice and legal disclaimers are displayed throughout. All on-chain contracts are attestation-only—no custody, no order matching, no execution.
