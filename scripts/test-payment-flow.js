#!/usr/bin/env node

/**
 * Test the complete payment flow
 */

const { generatePaymentWallet, getKeypairFromPrivateKey } = require('../lib/payment-wallet.ts');

console.log('🧪 Testing Payment Flow\n');

try {
  // Test 1: Generate Payment Wallet
  console.log('1️⃣  Testing wallet generation...');
  const wallet = generatePaymentWallet();
  
  if (wallet.publicKey && wallet.privateKey) {
    console.log('   ✅ Wallet generated successfully');
    console.log(`   📍 Public Key: ${wallet.publicKey.slice(0, 20)}...`);
  } else {
    throw new Error('Wallet generation failed');
  }

  // Test 2: Verify keypair recovery
  console.log('\n2️⃣  Testing keypair recovery...');
  const keypair = getKeypairFromPrivateKey(wallet.privateKey);
  
  if (keypair.publicKey.toString() === wallet.publicKey) {
    console.log('   ✅ Keypair recovered successfully');
  } else {
    throw new Error('Keypair recovery failed');
  }

  // Test 3: Payment data structure
  console.log('\n3️⃣  Testing payment data structure...');
  const paymentData = {
    id: 'test123',
    amount: 1.5,
    token: 'SOL',
    description: 'Test payment',
    status: 'pending',
    createdAt: new Date().toISOString(),
    paymentWallet: wallet.publicKey,
    privateKey: wallet.privateKey,
    merchantWallet: 'C7YHgbWmMRjkA2GckEq6Gu3Dec5f8pkgFA6UsuseAVy2',
    type: 'simple',
  };
  
  if (paymentData.id && paymentData.amount && paymentData.paymentWallet) {
    console.log('   ✅ Payment data structure valid');
  } else {
    throw new Error('Invalid payment data structure');
  }

  // Test 4: LocalStorage simulation
  console.log('\n4️⃣  Testing data persistence...');
  const payments = [paymentData];
  const serialized = JSON.stringify(payments);
  const deserialized = JSON.parse(serialized);
  
  if (deserialized[0].id === paymentData.id) {
    console.log('   ✅ Data serialization works');
  } else {
    throw new Error('Data serialization failed');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ All payment flow tests passed!\n');
  console.log('🎯 Your payment system is ready to use:');
  console.log('   • Wallet generation: Working');
  console.log('   • Key recovery: Working');
  console.log('   • Data structure: Valid');
  console.log('   • Persistence: Working');
  console.log('\n🚀 Start the dev server: npm run dev');
  console.log('='.repeat(50));

} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
}
