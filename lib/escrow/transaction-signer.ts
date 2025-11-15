/**
 * Escrow Transaction Signer
 * Handles secure transaction signing for escrow fund releases
 */

import { 
  Connection, 
  Transaction, 
  PublicKey, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Keypair
} from '@solana/web3.js'
import { 
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import { recoverKeypairFromEncrypted, logKeyAccess, hashForLogging } from './wallet-manager'

// ============================================
// CONFIGURATION
// ============================================

function getSolanaConnection(): Connection {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL
  
  const endpoint = rpcUrl || (
    network === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : `https://api.${network}.solana.com`
  )
  
  return new Connection(endpoint, 'confirmed')
}

// ============================================
// SOL TRANSFERS
// ============================================

/**
 * Transfer SOL from escrow wallet to recipient
 */
export async function transferSOL(
  encryptedPrivateKey: string,
  toAddress: string,
  amountSOL: number
): Promise<string> {
  try {
    // Log key access
    logKeyAccess({
      operation: 'decrypt',
      success: true
    })
    
    // Recover keypair
    const fromKeypair = recoverKeypairFromEncrypted(encryptedPrivateKey)
    const toPublicKey = new PublicKey(toAddress)
    
    // Get connection
    const connection = getSolanaConnection()
    
    // Convert SOL to lamports
    const lamports = Math.floor(amountSOL * LAMPORTS_PER_SOL)
    
    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports
      })
    )
    
    // Send and confirm
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [fromKeypair],
      {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      }
    )
    
    console.log(`✅ SOL transfer successful: ${signature}`)
    console.log(`   From: ${fromKeypair.publicKey.toBase58()}`)
    console.log(`   To: ${toAddress}`)
    console.log(`   Amount: ${amountSOL} SOL`)
    
    return signature
  } catch (error: any) {
    console.error('SOL transfer error:', error)
    
    logKeyAccess({
      operation: 'decrypt',
      success: false,
      error: error.message
    })
    
    throw new Error(`Failed to transfer SOL: ${error.message}`)
  }
}

// ============================================
// SPL TOKEN TRANSFERS
// ============================================

/**
 * Transfer SPL tokens (USDC, USDT, etc.) from escrow wallet
 */
export async function transferSPLToken(
  encryptedPrivateKey: string,
  toAddress: string,
  amount: number,
  tokenMint: string
): Promise<string> {
  try {
    logKeyAccess({
      operation: 'decrypt',
      success: true
    })
    
    // Recover keypair
    const fromKeypair = recoverKeypairFromEncrypted(encryptedPrivateKey)
    const toPublicKey = new PublicKey(toAddress)
    const mintPublicKey = new PublicKey(tokenMint)
    
    // Get connection
    const connection = getSolanaConnection()
    
    // Get associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      fromKeypair.publicKey
    )
    
    const toTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      toPublicKey
    )
    
    // Convert amount to token decimals (assuming 6 for USDC/USDT)
    const decimals = 6
    const tokenAmount = Math.floor(amount * Math.pow(10, decimals))
    
    // Create transfer instruction
    const transaction = new Transaction().add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromKeypair.publicKey,
        tokenAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    )
    
    // Send and confirm
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [fromKeypair],
      {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      }
    )
    
    console.log(`✅ SPL token transfer successful: ${signature}`)
    console.log(`   From: ${fromKeypair.publicKey.toBase58()}`)
    console.log(`   To: ${toAddress}`)
    console.log(`   Amount: ${amount} tokens`)
    console.log(`   Mint: ${tokenMint}`)
    
    return signature
  } catch (error: any) {
    console.error('SPL token transfer error:', error)
    
    logKeyAccess({
      operation: 'decrypt',
      success: false,
      error: error.message
    })
    
    throw new Error(`Failed to transfer SPL token: ${error.message}`)
  }
}

// ============================================
// MULTI-RECIPIENT TRANSFERS
// ============================================

/**
 * Transfer to multiple recipients in a single transaction
 * Used for dispute resolutions and partial splits
 */
export async function transferToMultiple(
  encryptedPrivateKey: string,
  recipients: Array<{ address: string; amount: number }>,
  token: 'SOL' | string
): Promise<string> {
  try {
    logKeyAccess({
      operation: 'decrypt',
      success: true
    })
    
    const fromKeypair = recoverKeypairFromEncrypted(encryptedPrivateKey)
    const connection = getSolanaConnection()
    
    const transaction = new Transaction()
    
    if (token === 'SOL') {
      // Add SOL transfer instructions for each recipient
      for (const recipient of recipients) {
        const lamports = Math.floor(recipient.amount * LAMPORTS_PER_SOL)
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: new PublicKey(recipient.address),
            lamports
          })
        )
      }
    } else {
      // SPL token transfers
      const mintPublicKey = new PublicKey(token)
      const decimals = 6 // Assuming USDC/USDT
      
      for (const recipient of recipients) {
        const fromTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          fromKeypair.publicKey
        )
        
        const toTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          new PublicKey(recipient.address)
        )
        
        const tokenAmount = Math.floor(recipient.amount * Math.pow(10, decimals))
        
        transaction.add(
          createTransferInstruction(
            fromTokenAccount,
            toTokenAccount,
            fromKeypair.publicKey,
            tokenAmount,
            [],
            TOKEN_PROGRAM_ID
          )
        )
      }
    }
    
    // Send and confirm
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [fromKeypair],
      {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      }
    )
    
    console.log(`✅ Multi-recipient transfer successful: ${signature}`)
    console.log(`   Recipients: ${recipients.length}`)
    console.log(`   Total: ${recipients.reduce((sum, r) => sum + r.amount, 0)} ${token}`)
    
    return signature
  } catch (error: any) {
    console.error('Multi-recipient transfer error:', error)
    
    logKeyAccess({
      operation: 'decrypt',
      success: false,
      error: error.message
    })
    
    throw new Error(`Failed to transfer to multiple recipients: ${error.message}`)
  }
}

// ============================================
// BALANCE CHECKING
// ============================================

/**
 * Check SOL balance of escrow wallet
 */
export async function checkSOLBalance(walletAddress: string): Promise<number> {
  try {
    const connection = getSolanaConnection()
    const publicKey = new PublicKey(walletAddress)
    const balance = await connection.getBalance(publicKey)
    return balance / LAMPORTS_PER_SOL
  } catch (error: any) {
    console.error('Balance check error:', error)
    throw new Error(`Failed to check balance: ${error.message}`)
  }
}

/**
 * Check SPL token balance
 */
export async function checkTokenBalance(
  walletAddress: string,
  tokenMint: string
): Promise<number> {
  try {
    const connection = getSolanaConnection()
    const publicKey = new PublicKey(walletAddress)
    const mintPublicKey = new PublicKey(tokenMint)
    
    const tokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      publicKey
    )
    
    const balance = await connection.getTokenAccountBalance(tokenAccount)
    return parseFloat(balance.value.uiAmount?.toString() || '0')
  } catch (error: any) {
    console.error('Token balance check error:', error)
    return 0 // Return 0 if account doesn't exist
  }
}

// ============================================
// TRANSACTION VERIFICATION
// ============================================

/**
 * Verify a transaction was confirmed on-chain
 */
export async function verifyTransaction(signature: string): Promise<boolean> {
  try {
    const connection = getSolanaConnection()
    const status = await connection.getSignatureStatus(signature)
    
    return status.value?.confirmationStatus === 'confirmed' || 
           status.value?.confirmationStatus === 'finalized'
  } catch (error) {
    console.error('Transaction verification error:', error)
    return false
  }
}

/**
 * Get transaction details
 */
export async function getTransactionDetails(signature: string) {
  try {
    const connection = getSolanaConnection()
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed'
    })
    
    return transaction
  } catch (error) {
    console.error('Get transaction error:', error)
    return null
  }
}

// ============================================
// ERROR HANDLING
// ============================================

export class TransactionError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = false
  ) {
    super(message)
    this.name = 'TransactionError'
  }
}

/**
 * Handle transaction errors with proper categorization
 */
export function handleTransactionError(error: any): TransactionError {
  const message = error.message || 'Unknown transaction error'
  
  // Insufficient funds
  if (message.includes('insufficient funds') || message.includes('0x1')) {
    return new TransactionError(
      'Insufficient funds in escrow wallet',
      'INSUFFICIENT_FUNDS',
      false
    )
  }
  
  // Network errors
  if (message.includes('timeout') || message.includes('network')) {
    return new TransactionError(
      'Network error, please retry',
      'NETWORK_ERROR',
      true
    )
  }
  
  // Invalid address
  if (message.includes('invalid') && message.includes('address')) {
    return new TransactionError(
      'Invalid recipient address',
      'INVALID_ADDRESS',
      false
    )
  }
  
  // Generic error
  return new TransactionError(
    message,
    'TRANSACTION_FAILED',
    true
  )
}

// ============================================
// EXPORTS
// ============================================

export default {
  transferSOL,
  transferSPLToken,
  transferToMultiple,
  checkSOLBalance,
  checkTokenBalance,
  verifyTransaction,
  getTransactionDetails,
  handleTransactionError
}
