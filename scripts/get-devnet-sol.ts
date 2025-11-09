import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

async function requestAirdrop(walletAddress: string) {
  try {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    const publicKey = new PublicKey(walletAddress)
    
    console.log('Requesting airdrop...')
    const signature = await connection.requestAirdrop(
      publicKey,
      2 * LAMPORTS_PER_SOL
    )
    
    console.log('Confirming transaction...')
    await connection.confirmTransaction(signature)
    
    const balance = await connection.getBalance(publicKey)
    console.log(`✅ Success! New balance: ${balance / LAMPORTS_PER_SOL} SOL`)
    console.log(`Transaction: https://explorer.solana.com/tx/${signature}?cluster=devnet`)
  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\nTry again in a few minutes or use a different method.')
  }
}

// Get wallet address from command line
const walletAddress = process.argv[2]

if (!walletAddress) {
  console.log('Usage: npx tsx scripts/get-devnet-sol.ts YOUR_WALLET_ADDRESS')
  process.exit(1)
}

requestAirdrop(walletAddress)
