import { NextRequest, NextResponse } from 'next/server'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 requests per minute per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = rateLimit(ip, 10, 60000)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { paymentId, privateKey, merchantWallet } = body

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 })
    }

    if (!privateKey) {
      return NextResponse.json({ error: 'Missing private key' }, { status: 400 })
    }

    if (!merchantWallet) {
      return NextResponse.json({ error: 'Missing merchant wallet' }, { status: 400 })
    }

    // Validate merchant wallet address
    try {
      new PublicKey(merchantWallet)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid merchant wallet address' }, { status: 400 })
    }

    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    const endpoint = rpcUrl || (
      network === 'mainnet-beta' 
        ? 'https://api.mainnet-beta.solana.com'
        : `https://api.${network}.solana.com`
    )
    
    const connection = new Connection(endpoint, 'confirmed')
    
    // Reconstruct keypair from private key
    const paymentKeypair = Keypair.fromSecretKey(
      Uint8Array.from(Buffer.from(privateKey, 'base64'))
    )
    
    // Use merchant wallet from payment data
    const merchantWalletPubkey = new PublicKey(merchantWallet)

    // Get balance
    const balance = await connection.getBalance(paymentKeypair.publicKey)
    
    if (balance === 0) {
      return NextResponse.json({ error: 'No balance to forward' }, { status: 400 })
    }

    // Calculate platform fee
    const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '0')
    const platformFeeWallet = process.env.PLATFORM_FEE_WALLET
    
    let platformFeeAmount = 0
    if (platformFeePercentage > 0 && platformFeeWallet) {
      platformFeeAmount = Math.floor(balance * (platformFeePercentage / 100))
    }
    
    // Calculate transaction fee (5000 lamports per signature)
    // We have 2 transfers if platform fee is enabled, otherwise 1
    const numTransfers = platformFeeAmount > 0 ? 2 : 1
    const txFee = 5000 * numTransfers
    
    // Forward all funds minus transaction fees and platform fee
    // No rent exemption needed since we're emptying the temporary wallet
    const amountToSend = balance - txFee - platformFeeAmount
    
    if (amountToSend <= 0) {
      return NextResponse.json({ error: 'Insufficient balance after fees' }, { status: 400 })
    }

    // Create transfer transaction
    const transaction = new Transaction()
    
    // Transfer to merchant
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: paymentKeypair.publicKey,
        toPubkey: merchantWalletPubkey,
        lamports: amountToSend,
      })
    )
    
    // Transfer platform fee if configured
    if (platformFeeAmount > 0 && platformFeeWallet) {
      try {
        const platformWalletPubkey = new PublicKey(platformFeeWallet)
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: paymentKeypair.publicKey,
            toPubkey: platformWalletPubkey,
            lamports: platformFeeAmount,
          })
        )
      } catch (err) {
        console.error('Invalid platform wallet, skipping fee')
      }
    }

    // Send transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [paymentKeypair]
    )

    return NextResponse.json({
      success: true,
      signature,
      amount: amountToSend / LAMPORTS_PER_SOL,
      platformFee: platformFeeAmount / LAMPORTS_PER_SOL,
      platformFeePercentage,
    })
  } catch (error: any) {
    console.error('Forward payment error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to forward payment'
    
    if (error.message?.includes('insufficient')) {
      errorMessage = 'Insufficient balance to forward payment'
    } else if (error.message?.includes('blockhash')) {
      errorMessage = 'Network error. Please try again.'
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Transaction timeout. Please check Solana Explorer.'
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message 
      },
      { status: 500 }
    )
  }
}
