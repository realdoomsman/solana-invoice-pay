#!/usr/bin/env node

/**
 * Production Readiness Verification Script
 * Run this before deploying to production
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Production Readiness...\n');

let errors = [];
let warnings = [];
let passed = 0;

// Check 1: Environment Variables
console.log('📋 Checking Environment Variables...');
const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  errors.push('❌ .env.local file not found');
} else {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check network
  if (envContent.includes('NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta')) {
    console.log('  ✅ Network set to mainnet-beta');
    passed++;
  } else {
    warnings.push('  ⚠️  Network not set to mainnet-beta');
  }
  
  // Check fee wallet
  if (envContent.includes('NEXT_PUBLIC_FEE_WALLET=') && 
      !envContent.includes('YOUR_MAINNET_WALLET_ADDRESS_HERE')) {
    console.log('  ✅ Fee wallet configured');
    passed++;
  } else {
    errors.push('  ❌ Fee wallet not configured or using placeholder');
  }
  
  // Check encryption key
  if (envContent.includes('ENCRYPTION_KEY=') && 
      !envContent.includes('default-key-change-in-production') &&
      !envContent.includes('YOUR_SECURE_RANDOM_KEY_HERE')) {
    console.log('  ✅ Encryption key configured');
    passed++;
  } else {
    errors.push('  ❌ Encryption key not configured or using default');
  }
  
  // Check RPC URL
  if (envContent.includes('NEXT_PUBLIC_SOLANA_RPC_URL=')) {
    console.log('  ✅ RPC URL configured');
    passed++;
  } else {
    warnings.push('  ⚠️  RPC URL not explicitly set (will use default)');
  }
  
  // Check base URL
  if (envContent.includes('NEXT_PUBLIC_BASE_URL=') && 
      !envContent.includes('localhost')) {
    console.log('  ✅ Base URL configured for production');
    passed++;
  } else {
    warnings.push('  ⚠️  Base URL not set or using localhost');
  }
}

// Check 2: Required Files
console.log('\n📁 Checking Required Files...');
const requiredFiles = [
  'app/terms/page.tsx',
  'app/privacy/page.tsx',
  'lib/rate-limit.ts',
  'app/api/health/route.ts',
  'app/sitemap.ts',
  'app/robots.ts',
];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log(`  ✅ ${file}`);
    passed++;
  } else {
    errors.push(`  ❌ Missing: ${file}`);
  }
});

// Check 3: Package.json
console.log('\n📦 Checking Package Configuration...');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
);

if (packageJson.scripts.build) {
  console.log('  ✅ Build script configured');
  passed++;
} else {
  errors.push('  ❌ Build script missing');
}

if (packageJson.scripts.start) {
  console.log('  ✅ Start script configured');
  passed++;
} else {
  errors.push('  ❌ Start script missing');
}

// Check 4: Git Status
console.log('\n🔄 Checking Git Status...');
try {
  const { execSync } = require('child_process');
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  
  if (gitStatus.trim() === '') {
    console.log('  ✅ No uncommitted changes');
    passed++;
  } else {
    warnings.push('  ⚠️  Uncommitted changes detected');
  }
} catch (e) {
  warnings.push('  ⚠️  Could not check git status');
}

// Check 5: Security
console.log('\n🔒 Security Checklist...');
const gitignore = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8');

if (gitignore.includes('.env.local') || gitignore.includes('.env*.local')) {
  console.log('  ✅ .env.local in .gitignore');
  passed++;
} else {
  errors.push('  ❌ .env.local not in .gitignore');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`❌ Errors: ${errors.length}`);

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(w => console.log(w));
}

if (errors.length > 0) {
  console.log('\n❌ ERRORS (Must Fix):');
  errors.forEach(e => console.log(e));
  console.log('\n🚫 NOT READY FOR PRODUCTION');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  READY WITH WARNINGS');
  console.log('Review warnings before deploying to production.');
  process.exit(0);
} else {
  console.log('\n✅ READY FOR PRODUCTION!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run build');
  console.log('2. Test locally: npm start');
  console.log('3. Deploy: vercel --prod');
  process.exit(0);
}
