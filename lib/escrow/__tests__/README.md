# Escrow Tests

This directory contains tests for the escrow system.

## Test Files

- `wallet-manager.test.ts` - Tests for wallet generation, encryption, and key management
- `deposit-monitor.test.ts` - Tests for deposit tracking and verification
- `traditional.test.ts` - Tests for traditional escrow flow (Task 3.5)
- `simple-buyer.test.ts` - Tests for milestone-based escrow flow (Task 4.4)

## Running Tests

To run these tests, you need to install Jest and related dependencies:

```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/jest-dom
```

Then add a test script to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

Create a `jest.config.js` file:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
}
```

Then run:

```bash
npm test
```

## Test Coverage

### Traditional Escrow Tests (traditional.test.ts)

Tests the complete traditional escrow flow including:

1. **Happy Path Flow**
   - Creating traditional escrow with dual deposits
   - Buyer confirmation
   - Seller confirmation
   - Automatic fund release when both parties confirm
   - Funds released to seller (payment + security deposit return)

2. **Single Confirmation Timeout**
   - Prevents release with only buyer confirmation
   - Prevents release with only seller confirmation
   - Notifies counterparty when one party confirms

3. **Dispute Scenarios**
   - Rejects confirmation if not fully funded
   - Rejects confirmation from unauthorized wallets
   - Rejects fund release if not fully funded

4. **Validation**
   - Validates required wallet addresses
   - Validates positive amounts
   - Prevents same wallet for buyer and seller
   - Handles non-existent escrows

## Requirements Covered

### Traditional Escrow Tests (traditional.test.ts)

The traditional escrow tests cover requirements:
- 2.1: Traditional escrow creation with buyer and seller wallets
- 2.2: Buyer payment amount specification
- 2.3: Seller security deposit specification
- 2.4: Unique escrow wallet generation
- 2.5: Deposit tracking for both parties
- 2.6: Fully funded status tracking
- 3.1: Buyer confirmation
- 3.2: Seller confirmation
- 3.3: On-chain transaction execution
- 3.4: Admin escalation on single confirmation timeout
- 3.5: Activity log recording

### Simple Buyer Escrow Tests (simple-buyer.test.ts)

The milestone-based escrow tests cover requirements:
- 4.1: Allow definition of multiple milestones
- 4.2: Require description and percentage for each milestone
- 4.3: Validate milestone percentages sum to exactly 100%
- 4.4: Notify buyer when seller submits work
- 4.5: Automatically release funds when buyer approves milestone
- 4.6: Prevent milestone approval out of sequence order

**Test Coverage:**

1. **Milestone Creation and Validation**
   - Validates milestones sum to 100%
   - Rejects invalid percentage totals
   - Rejects zero or negative percentages
   - Rejects percentages over 100
   - Rejects empty milestone lists
   - Rejects empty descriptions
   - Enforces maximum milestone limit (20)
   - Warns about single milestone escrows
   - Calculates milestone amounts correctly
   - Creates milestones with proper ordering

2. **Work Submission System**
   - Submits work for pending milestones
   - Rejects submissions from non-sellers
   - Rejects submissions for non-pending milestones
   - Enforces sequential order for submissions
   - Includes evidence URLs in submissions
   - Updates milestone status to work_submitted
   - Creates notifications for buyers

3. **Milestone Approval and Release**
   - Approves submitted milestones
   - Rejects approvals from non-buyers
   - Rejects approvals for non-submitted milestones
   - Prevents out-of-order approvals
   - Records milestone fund releases
   - Completes escrow when all milestones released
   - Tracks transaction signatures

4. **Milestone Statistics and Completion**
   - Calculates milestone statistics correctly
   - Tracks completion percentage
   - Tracks released and remaining amounts
   - Checks if all milestones are released
   - Provides partial completion status
