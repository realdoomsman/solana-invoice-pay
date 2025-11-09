#!/usr/bin/env node

/**
 * Manual Payment Forwarding Tool
 * Use this to manually forward a payment if auto-forward didn't work
 */

const {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} = require('@solana/web3.js');

async function forwardPayment(privateKeyBase64, merchantWallet) {
  console.log('🔄 Manual Payment Forward\n');

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta';
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  
  console.log(`Network: ${network}`);
  console.log(`RPC: ${rpcUrl}\n`);

  const connection = new Connection(rpcUrl, 'confirmed');

  // Reconstruct keypair from private key
  const paymentKeypair = Keypair.fromSecretKey(
    Uint8Array.from(Buffer.from(privateKeyBase64, 'base64'))
  );

  console.log(`Payment Wallet: ${paymentKeypair.publicKey.toString()}`);
  console.log(`Merchant Wallet: ${merchantWallet}\n`);

  // Get balance
  const balance = await connection.getBalance(paymentKeypair.publicKey);
  console.log(`Current Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance === 0) {
    console.error('❌ No balance to forward');
    process.exit(1);
  }

  // Calculate fees
  const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
  const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '1');
  const platformFeeWallet = process.env.PLATFORM_FEE_WALLET;
  
  let platformFeeAmount = 0;
  if (platformFeePercentage > 0 && platformFeeWallet) {
    platformFeeAmount = Math.floor(balance * (platformFeePercentage / 100));
    console.log(`Platform Fee (${platformFeePercentage}%): ${platformFeeAmount / LAMPORTS_PER_SOL} SOL`);
  }

  const txFee = 5000; // lamports
  const amountToSend = balance - rentExemption - txFee - platformFeeAmount;

  console.log(`Transaction Fee: ${txFee / LAMPORTS_PER_SOL} SOL`);
  console.log(`Amount to Merchant: ${amountToSend / LAMPORTS_PER_SOL} SOL\n`);

  if (amountToSend <= 0) {
    console.error('❌ Insufficient balance after fees');
    process.exit(1);
  }

  // Create transaction
  const transaction = new Transaction();

  // Transfer to merchant
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: paymentKeypair.publicKey,
      toPubkey: new PublicKey(merchantWallet),
      lamports: amountToSend,
    })
  );

  // Transfer platform fee if configured
  if (platformFeeAmount > 0 && platformFeeWallet) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: paymentKeypair.publicKey,
        toPubkey: new PublicKey(platformFeeWallet),
        lamports: platformFeeAmount,
      })
    );
  }

  console.log('📤 Sending transaction...');

  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [paymentKeypair],
      {
        commitment: 'confirmed',
      }
    );

    console.log('\n✅ Payment forwarded successfully!');
    console.log(`\nTransaction Signature: ${signature}`);
    console.log(`\nView on Solscan:`);
    console.log(`https://solscan.io/tx/${signature}`);
    console.log(`\nMerchant received: ${amountToSend / LAMPORTS_PER_SOL} SOL`);
    if (platformFeeAmount > 0) {
      console.log(`Platform fee: ${platformFeeAmount / LAMPORTS_PER_SOL} SOL`);
    }
  } catch (error) {
    console.error('\n❌ Transaction failed:', error.message);
    process.exit(1);
  }
}

// Get arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node scripts/manual-forward.js <private-key-base64> <merchant-wallet>');
  console.log('\nExample:');
  console.log('node scripts/manual-forward.js "ABC123..." "C7YHgbWmMRjkA2GckEq6Gu3Dec5f8pkgFA6UsuseAVy2"');
  process.exit(1);
}

const [privateKey, merchantWallet] = args;

forwardPayment(privateKey, merchantWallet).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
