# Design Document: Complete Escrow System

## Overview

The Complete Escrow System provides three distinct escrow mechanisms on Solana: Traditional Escrow (mutual deposits), Simple Buyer Escrow (milestone-based), and Atomic Swap Escrow (trustless exchanges). The system uses unique escrow wallets, encrypted key management, Supabase for state tracking, and on-chain transactions for all fund movements.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Escrow Type  │  │   Escrow     │  │    Admin     │      │
│  │  Selection   │  │  Management  │  │   Dashboard  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Create     │  │   Action     │  │    Admin     │      │
│  │   Escrow     │  │  Handlers    │  │   Actions    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Supabase Database      │  │   Solana Blockchain      │
│  - Escrow contracts      │  │  - Fund deposits         │
│  - Milestones            │  │  - Fund releases         │
│  - Activity logs         │  │  - Atomic swaps          │
│  - Disputes              │  │  - Transaction proofs    │
└──────────────────────────┘  └──────────────────────────┘
```

### Component Architecture

```
lib/
├── escrow/
│   ├── types.ts              # TypeScript interfaces
│   ├── traditional.ts        # Traditional escrow logic
│   ├── simple-buyer.ts       # Milestone-based escrow
│   ├── atomic-swap.ts        # Atomic swap logic
│   ├── common.ts             # Shared escrow functions
│   └── wallet-manager.ts     # Escrow wallet generation & encryption
│
app/
├── escrow/
│   ├── create/
│   │   ├── page.tsx          # Escrow type selection
│   │   ├── traditional/page.tsx
│   │   ├── simple/page.tsx
│   │   └── atomic/page.tsx
│   ├── [id]/
│   │   └── page.tsx          # Universal escrow management
│   └── dashboard/page.tsx    # User's escrow list
│
├── api/escrow/
│   ├── create/route.ts       # Create escrow endpoint
│   ├── deposit/route.ts      # Track deposits
│   ├── confirm/route.ts      # Confirmation actions
│   ├── release/route.ts      # Fund release
│   ├── dispute/route.ts      # Raise dispute
│   └── swap/route.ts         # Execute atomic swap
│
components/
├── escrow/
│   ├── EscrowTypeSelector.tsx
│   ├── TraditionalEscrowCard.tsx
│   ├── MilestoneList.tsx
│   ├── AtomicSwapInterface.tsx
│   ├── DisputeModal.tsx
│   └── ActivityTimeline.tsx
```

## Data Models

### Database Schema

#### escrow_contracts
```sql
CREATE TABLE escrow_contracts (
  id TEXT PRIMARY KEY,
  escrow_type TEXT NOT NULL, -- 'traditional' | 'simple_buyer' | 'atomic_swap'
  payment_id TEXT UNIQUE NOT NULL,
  
  -- Parties
  buyer_wallet TEXT NOT NULL,
  seller_wallet TEXT NOT NULL,
  
  -- Amounts
  buyer_amount DECIMAL NOT NULL,
  seller_amount DECIMAL, -- NULL for simple_buyer, required for traditional
  token TEXT NOT NULL,
  
  -- Escrow wallet
  escrow_wallet TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL, -- 'created' | 'buyer_deposited' | 'fully_funded' | 'active' | 'completed' | 'disputed' | 'cancelled'
  buyer_deposited BOOLEAN DEFAULT FALSE,
  seller_deposited BOOLEAN DEFAULT FALSE,
  buyer_confirmed BOOLEAN DEFAULT FALSE,
  seller_confirmed BOOLEAN DEFAULT FALSE,
  
  -- Atomic swap specific
  swap_asset_buyer TEXT, -- Token mint for buyer's asset
  swap_asset_seller TEXT, -- Token mint for seller's asset
  swap_executed BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  description TEXT,
  timeout_hours INTEGER DEFAULT 72,
  expires_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  funded_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Indexes
  INDEX idx_buyer (buyer_wallet),
  INDEX idx_seller (seller_wallet),
  INDEX idx_status (status),
  INDEX idx_type (escrow_type)
);
```

#### escrow_milestones (for simple_buyer type)
```sql
CREATE TABLE escrow_milestones (
  id TEXT PRIMARY KEY,
  escrow_id TEXT REFERENCES escrow_contracts(id),
  
  description TEXT NOT NULL,
  percentage DECIMAL NOT NULL,
  amount DECIMAL NOT NULL,
  milestone_order INTEGER NOT NULL,
  
  status TEXT NOT NULL, -- 'pending' | 'work_submitted' | 'approved' | 'released' | 'disputed'
  
  -- Seller actions
  seller_submitted_at TIMESTAMP,
  seller_notes TEXT,
  seller_evidence_urls TEXT[], -- Array of URLs
  
  -- Buyer actions
  buyer_approved_at TIMESTAMP,
  buyer_notes TEXT,
  
  -- Release
  released_at TIMESTAMP,
  tx_signature TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_escrow (escrow_id),
  INDEX idx_status (status)
);
```

#### escrow_deposits
```sql
CREATE TABLE escrow_deposits (
  id TEXT PRIMARY KEY,
  escrow_id TEXT REFERENCES escrow_contracts(id),
  
  depositor_wallet TEXT NOT NULL,
  party_role TEXT NOT NULL, -- 'buyer' | 'seller'
  amount DECIMAL NOT NULL,
  token TEXT NOT NULL,
  
  tx_signature TEXT NOT NULL,
  confirmed BOOLEAN DEFAULT FALSE,
  
  deposited_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_escrow (escrow_id),
  INDEX idx_depositor (depositor_wallet)
);
```

#### escrow_actions
```sql
CREATE TABLE escrow_actions (
  id TEXT PRIMARY KEY,
  escrow_id TEXT REFERENCES escrow_contracts(id),
  milestone_id TEXT REFERENCES escrow_milestones(id),
  
  actor_wallet TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'created' | 'deposited' | 'confirmed' | 'submitted' | 'approved' | 'disputed' | 'released' | 'refunded'
  
  notes TEXT,
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_escrow (escrow_id),
  INDEX idx_actor (actor_wallet),
  INDEX idx_type (action_type)
);
```

#### escrow_disputes
```sql
CREATE TABLE escrow_disputes (
  id TEXT PRIMARY KEY,
  escrow_id TEXT REFERENCES escrow_contracts(id),
  milestone_id TEXT REFERENCES escrow_milestones(id),
  
  raised_by TEXT NOT NULL,
  party_role TEXT NOT NULL, -- 'buyer' | 'seller'
  
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  
  status TEXT NOT NULL, -- 'open' | 'under_review' | 'resolved' | 'closed'
  
  -- Resolution
  resolved_by TEXT, -- Admin wallet
  resolution TEXT,
  resolved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_escrow (escrow_id),
  INDEX idx_status (status)
);
```

#### escrow_evidence
```sql
CREATE TABLE escrow_evidence (
  id TEXT PRIMARY KEY,
  escrow_id TEXT REFERENCES escrow_contracts(id),
  dispute_id TEXT REFERENCES escrow_disputes(id),
  
  submitted_by TEXT NOT NULL,
  party_role TEXT NOT NULL,
  
  evidence_type TEXT NOT NULL, -- 'text' | 'image' | 'document' | 'link'
  content TEXT,
  file_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_dispute (dispute_id)
);
```

## Components and Interfaces

### 1. Escrow Type Selector

**Component:** `EscrowTypeSelector.tsx`

**Purpose:** Allow users to choose escrow type

**Interface:**
```typescript
interface EscrowTypeOption {
  type: 'traditional' | 'simple_buyer' | 'atomic_swap'
  title: string
  description: string
  useCases: string[]
  icon: ReactNode
  recommended: boolean
}

interface EscrowTypeSelectorProps {
  onSelect: (type: string) => void
}
```

### 2. Traditional Escrow Creator

**Component:** `TraditionalEscrowForm.tsx`

**Purpose:** Create traditional escrow with dual deposits

**Interface:**
```typescript
interface TraditionalEscrowFormData {
  buyerWallet: string
  sellerWallet: string
  buyerAmount: number
  sellerSecurityDeposit: number
  token: 'SOL' | 'USDC' | 'USDT'
  description: string
  timeoutHours: number
}
```

### 3. Simple Buyer Escrow Creator

**Component:** `SimpleBuyerEscrowForm.tsx`

**Purpose:** Create milestone-based escrow

**Interface:**
```typescript
interface Milestone {
  id: string
  description: string
  percentage: number
  amount: number
}

interface SimpleBuyerEscrowFormData {
  buyerWallet: string
  sellerWallet: string
  totalAmount: number
  token: string
  description: string
  milestones: Milestone[]
}
```

### 4. Atomic Swap Creator

**Component:** `AtomicSwapForm.tsx`

**Purpose:** Create trustless token swap

**Interface:**
```typescript
interface AtomicSwapFormData {
  partyAWallet: string
  partyBWallet: string
  partyAAsset: {
    token: string
    amount: number
    mint?: string // For SPL tokens
  }
  partyBAsset: {
    token: string
    amount: number
    mint?: string
  }
  timeoutHours: number
}
```

### 5. Universal Escrow Management

**Component:** `EscrowManagement.tsx`

**Purpose:** Single interface for all escrow types

**Features:**
- Detects escrow type and renders appropriate UI
- Shows deposit status for both parties
- Displays milestones (if applicable)
- Confirmation buttons
- Dispute raising
- Activity timeline
- Transaction links

### 6. Dispute Interface

**Component:** `DisputeModal.tsx`

**Purpose:** Raise and manage disputes

**Interface:**
```typescript
interface DisputeFormData {
  reason: string
  description: string
  evidence: {
    type: 'text' | 'image' | 'link'
    content: string
  }[]
}
```

## Error Handling

### Validation Errors
- Invalid wallet addresses
- Insufficient milestone percentages
- Mismatched token types
- Timeout values out of range

### Transaction Errors
- Insufficient balance for deposit
- Network congestion
- Transaction timeout
- Signature verification failure

### State Errors
- Escrow not found
- Unauthorized action
- Invalid state transition
- Duplicate action attempt

### Error Response Format
```typescript
interface EscrowError {
  code: string
  message: string
  details?: any
  recoverable: boolean
  suggestedAction?: string
}
```

## Testing Strategy

### Unit Tests
- Escrow creation logic
- Milestone calculation
- Deposit tracking
- Confirmation logic
- Dispute validation
- Fee calculation

### Integration Tests
- End-to-end traditional escrow flow
- Milestone-based payment flow
- Atomic swap execution
- Dispute resolution flow
- Timeout handling
- Refund mechanisms

### E2E Tests
- Create and fund traditional escrow
- Complete milestone-based project
- Execute atomic swap
- Raise and resolve dispute
- Handle timeout scenarios

### Security Tests
- Private key encryption/decryption
- Unauthorized access attempts
- SQL injection prevention
- XSS prevention
- CSRF protection

## Security Considerations

### Key Management
- Generate escrow wallets using `@solana/web3.js` Keypair
- Encrypt private keys with AES-256-GCM
- Store encryption keys in environment variables
- Never expose private keys in API responses
- Rotate encryption keys periodically

### Access Control
- Verify wallet signatures for all actions
- Check party role before allowing actions
- Validate admin privileges for dispute resolution
- Rate limit API endpoints
- Log all sensitive operations

### Transaction Security
- Verify on-chain transaction confirmations
- Check balance before attempting transfers
- Use recent blockhash for transactions
- Implement transaction retry logic
- Monitor for failed transactions

## Performance Optimization

### Database
- Index frequently queried fields
- Use connection pooling
- Implement query caching
- Paginate large result sets
- Archive completed escrows

### Blockchain
- Batch transaction submissions
- Use priority fees for urgent transactions
- Cache RPC responses
- Implement fallback RPC endpoints
- Monitor transaction confirmation times

### Frontend
- Lazy load escrow details
- Implement optimistic UI updates
- Cache escrow data locally
- Use WebSocket for real-time updates
- Compress images and assets

## Deployment Considerations

### Environment Variables
```
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ESCROW_ENCRYPTION_KEY=...
PLATFORM_TREASURY_WALLET=...
ADMIN_WALLETS=wallet1,wallet2,wallet3
```

### Monitoring
- Track escrow creation rate
- Monitor dispute rate
- Alert on failed transactions
- Track average completion time
- Monitor RPC endpoint health

### Backup and Recovery
- Daily database backups
- Encrypted backup of escrow wallets
- Disaster recovery plan
- Key recovery procedures
- Transaction replay capability

## Migration Plan

### Phase 1: Traditional Escrow
- Implement dual deposit mechanism
- Add confirmation tracking
- Build admin dispute resolution

### Phase 2: Enhanced Simple Buyer
- Improve existing milestone system
- Add evidence submission
- Implement timeout handling

### Phase 3: Atomic Swap
- Build swap execution logic
- Add multi-token support
- Implement automatic swap

### Phase 4: Polish
- Add notifications
- Improve UI/UX
- Performance optimization
- Security audit
