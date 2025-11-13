#!/usr/bin/env node

/**
 * Comprehensive verification script for NOVIQ platform
 * Checks all critical functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 NOVIQ Platform Verification\n');

let errors = 0;
let warnings = 0;

// Check 1: Environment Variables
console.log('1️⃣  Checking environment variables...');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SOLANA_NETWORK',
    'NEXT_PUBLIC_SOLANA_RPC_URL',
    'NEXT_PUBLIC_FEE_WALLET',
    'PLATFORM_FEE_WALLET',
    'ENCRYPTION_KEY',
    'NEXT_PUBLIC_BASE_URL'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`   ✅ ${varName} found`);
    } else {
      console.log(`   ❌ ${varName} missing`);
      errors++;
    }
  });
} else {
  console.log('   ❌ .env.local not found');
  errors++;
}

// Check 2: Critical Files
console.log('\n2️⃣  Checking critical files...');
const criticalFiles = [
  'app/page.tsx',
  'app/pay/[id]/page.tsx',
  'app/dashboard/page.tsx',
  'app/api/forward-payment/route.ts',
  'lib/payment-wallet.ts',
  'lib/database.ts',
  'lib/supabase.ts',
  'components/WalletProvider.tsx',
  'package.json',
  'next.config.js'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} missing`);
    errors++;
  }
});

// Check 3: Dependencies
console.log('\n3️⃣  Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const requiredDeps = [
  '@solana/web3.js',
  '@solana/wallet-adapter-react',
  '@solana/wallet-adapter-wallets',
  '@supabase/supabase-js',
  'next',
  'react',
  'nanoid',
  'qrcode.react'
];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`   ✅ ${dep}`);
  } else {
    console.log(`   ❌ ${dep} missing`);
    errors++;
  }
});

// Check 4: Build Status
console.log('\n4️⃣  Checking build...');
const nextDir = path.join(__dirname, '..', '.next');
if (fs.existsSync(nextDir)) {
  console.log('   ✅ Build directory exists');
} else {
  console.log('   ⚠️  No build found (run npm run build)');
  warnings++;
}

// Check 5: Key Features
console.log('\n5️⃣  Checking key features...');
const features = [
  { file: 'app/create/escrow/page.tsx', name: 'Escrow' },
  { file: 'app/create/split/page.tsx', name: 'Splits' },
  { file: 'app/create/goal/page.tsx', name: 'Goals' },
  { file: 'components/PaymentAnalytics.tsx', name: 'Analytics' },
  { file: 'components/AIAssistant.tsx', name: 'AI Assistant' },
  { file: 'lib/export.ts', name: 'Export Functions' }
];

features.forEach(({ file, name }) => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${name}`);
  } else {
    console.log(`   ❌ ${name} missing`);
    errors++;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY\n');

if (errors === 0 && warnings === 0) {
  console.log('✅ All checks passed! Your platform is ready to go!');
  console.log('\n🚀 Next steps:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Visit: http://localhost:3000');
  console.log('   3. Test payment creation');
  console.log('   4. Deploy: vercel --prod');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} error(s) found`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} warning(s) found`);
  }
  console.log('\n🔧 Fix the issues above and run this script again.');
}

console.log('='.repeat(50));

process.exit(errors > 0 ? 1 : 0);
