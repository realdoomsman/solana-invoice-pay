import { NextRequest, NextResponse } from 'next/server'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js'

export async function POST(request: NextRequest) {
  try {
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
    const endpoint = network === 'mainnet-beta' 
      ? 'https://api.mainnet-beta.solana.com'
      : `https://api.${network}.solana.com`
    
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

    // Calculate rent exemption (minimum balance to keep account open)
    const rentExemption = await connection.getMinimumBalanceForRentExemption(0)
    
    // Forward all funds minus transaction fee and rent
    const amountToSend = balance - rentExemption - 5000 // 5000 lamports for tx fee
    
    if (amountToSend <= 0) {
      return NextResponse.json({ error: 'Insufficient balance after fees' }, { status: 400 })
    }

    // Create transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: paymentKeypair.publicKey,
        toPubkey: merchantWalletPubkey,
        lamports: amountToSend,
      })
    )

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
