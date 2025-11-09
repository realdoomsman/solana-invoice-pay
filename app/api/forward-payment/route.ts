import { NextRequest, NextResponse } from 'next/server'
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js'

export async function POST(request: NextRequest) {
  try {
    const { paymentId, privateKey } = await request.json()

    if (!privateKey) {
      return NextResponse.json({ error: 'Missing private key' }, { status: 400 })
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
    
    // Get merchant wallet from env
    const merchantWallet = new PublicKey(
      process.env.NEXT_PUBLIC_MERCHANT_WALLET || ''
    )

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
        toPubkey: merchantWallet,
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
  } catch (error) {
    console.error('Forward payment error:', error)
    return NextResponse.json(
      { error: 'Failed to forward payment' },
      { status: 500 }
    )
  }
}
