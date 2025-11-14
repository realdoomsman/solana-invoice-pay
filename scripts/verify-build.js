#!/usr/bin/env node

/**
 * Verify Build Script
 * Checks that all critical files and dependencies are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build requirements...\n');

let hasErrors = false;

// Check critical files
const criticalFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  'tailwind.config.js',
  'postcss.config.js',
  '.env.local',
  'lib/supabase.ts',
  'components/ToastProvider.tsx',
  'components/WalletProvider.tsx',
  'app/layout.tsx',
];

console.log('📁 Checking critical files...');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    hasErrors = true;
  }
});

// Check package.json dependencies
console.log('\n📦 Checking critical dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const criticalDeps = [
  'next',
  'react',
  'react-dom',
  '@supabase/supabase-js',
  '@solana/web3.js',
  'react-hot-toast',
  'framer-motion',
  'react-confetti',
];

const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
criticalDeps.forEach(dep => {
  if (allDeps[dep]) {
    console.log(`  ✅ ${dep} (${allDeps[dep]})`);
  } else {
    console.log(`  ❌ ${dep} - MISSING`);
    hasErrors = true;
  }
});

// Check for common typos in imports
console.log('\n🔍 Checking for import typos...');
const supabaseFile = fs.readFileSync('lib/supabase.ts', 'utf8');
if (supabaseFile.includes('@supabase/supabase-js')) {
  console.log('  ✅ Supabase import is correct');
} else if (supabaseFile.includes('@sutml:supabase-js')) {
  console.log('  ❌ Supabase import has typo: @sutml:supabase-js');
  hasErrors = true;
} else {
  console.log('  ⚠️  Could not verify Supabase import');
}

// Check environment variables
console.log('\n🔐 Checking environment variables...');
const envFile = '.env.local';
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`  ✅ ${envVar}`);
    } else {
      console.log(`  ⚠️  ${envVar} - Not found in .env.local`);
    }
  });
} else {
  console.log('  ⚠️  .env.local not found');
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Build verification FAILED');
  console.log('Please fix the errors above before deploying.');
  process.exit(1);
} else {
  console.log('✅ Build verification PASSED');
  console.log('All critical files and dependencies are in place.');
  process.exit(0);
}
