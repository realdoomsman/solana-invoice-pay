#!/usr/bin/env node

/**
 * NOVIQ Mainnet Launch Preparation Script
 * Run: node scripts/prepare-mainnet.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🚀 NOVIQ Mainnet Launch Preparation\n');
console.log('='.repeat(50));

const checks = [];
let passed = 0;
let failed = 0;
let warnings = 0;

function check(name, condition, critical = true) {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
    checks.push({ name, status: 'pass' });
  } else if (critical) {
    console.log(`❌ ${name}`);
    failed++;
    checks.push({ name, status: 'fail' });
  } else {
    console.log(`⚠️  ${name}`);
    warnings++;
    checks.push({ name, status: 'warn' });
  }
}

// 1. Check environment files
console.log('\n📁 Environment Configuration\n');

const envProd = fs.existsSync('.env.production');
check('Production env file exists', envProd);

if (envProd) {
  const envContent = fs.readFileSync('.env.production', 'utf8');
  
  check('Network set to mainnet-beta', envContent.includes('mainnet-beta'));
  check('RPC URL configured', envContent.includes('NEXT_PUBLIC_SOLANA_RPC_URL='));
  check('Supabase URL configured', envContent.includes('NEXT_PUBLIC_SUPABASE_URL='));
  check('Supabase anon key configured', envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY='));
  check('Service role key configured', envContent.includes('SUPABASE_SERVICE_ROLE_KEY='));
  check('Encryption key configured', envContent.includes('ENCRYPTION_KEY='));
  check('Fee wallet configured', envContent.includes('PLATFORM_FEE_WALLET='));
  check('Base URL configured', envContent.includes('NEXT_PUBLIC_BASE_URL='));
  
  // Check for devnet references (should not exist in mainnet config)
  const hasDevnet = envContent.includes('devnet') && !envContent.includes('# devnet');
  check('No devnet references in production', !hasDevnet);
}

// 2. Check critical files exist
console.log('\n📄 Critical Files\n');

const criticalFiles = [
  'app/page.tsx',
  'app/layout.tsx',
  'app/escrow/page.tsx',
  'app/create/escrow/page.tsx',
  'app/create/split/page.tsx',
  'app/create/goal/page.tsx',
  'app/dashboard/page.tsx',
  'lib/escrow.ts',
  'lib/escrow/types.ts',
  'components/Header.tsx',
  'components/Footer.tsx',
];

criticalFiles.forEach(file => {
  check(`${file} exists`, fs.existsSync(file));
});

// 3. Check package.json
console.log('\n📦 Package Configuration\n');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
check('Build script exists', pkg.scripts?.build);
check('Start script exists', pkg.scripts?.start);
check('@solana/web3.js installed', pkg.dependencies?.['@solana/web3.js']);
check('@supabase/supabase-js installed', pkg.dependencies?.['@supabase/supabase-js']);

// 4. Check for sensitive data exposure
console.log('\n🔒 Security Checks\n');

const filesToScan = [
  'app/page.tsx',
  'lib/supabase.ts',
  'lib/escrow.ts',
];

let sensitiveDataFound = false;
filesToScan.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('sk-') || content.includes('secret_')) {
      sensitiveDataFound = true;
    }
  }
});
check('No hardcoded secrets in source', !sensitiveDataFound);

// Check .gitignore
const gitignore = fs.existsSync('.gitignore') ? fs.readFileSync('.gitignore', 'utf8') : '';
check('.env.local in gitignore', gitignore.includes('.env.local') || gitignore.includes('.env*.local'));
check('.env.production in gitignore', gitignore.includes('.env.production'), false);

// 5. Database schemas
console.log('\n🗄️  Database Schemas\n');

const schemas = [
  'supabase-complete-schema.sql',
  'supabase-escrow-complete-schema.sql',
  'supabase-referrals-schema.sql',
  'supabase-notification-preferences-schema.sql',
  'supabase-optimization-indexes.sql',
];

schemas.forEach(schema => {
  check(`${schema} exists`, fs.existsSync(schema), false);
});

// 6. Branding check
console.log('\n🎨 Branding\n');

const layoutContent = fs.readFileSync('app/layout.tsx', 'utf8');
check('NOVIQ in page title', layoutContent.includes('NOVIQ'));

const pageContent = fs.readFileSync('app/page.tsx', 'utf8');
check('NOVIQ branding on homepage', pageContent.includes('NOVIQ'));

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Summary\n');
console.log(`   ✅ Passed:   ${passed}`);
console.log(`   ❌ Failed:   ${failed}`);
console.log(`   ⚠️  Warnings: ${warnings}`);

if (failed === 0) {
  console.log('\n🎉 All critical checks passed! Ready for mainnet deployment.\n');
  console.log('Next steps:');
  console.log('  1. Run: npm run build');
  console.log('  2. Deploy: vercel --prod');
  console.log('  3. Verify: https://noviq.fun');
  console.log('');
} else {
  console.log('\n⚠️  Some checks failed. Please fix before deploying.\n');
  process.exit(1);
}

// Generate deployment checklist
const checklist = `
# 🚀 NOVIQ Mainnet Deployment Checklist

Generated: ${new Date().toISOString()}

## Pre-Deployment
- [${passed > 0 ? 'x' : ' '}] Environment configured for mainnet
- [${!sensitiveDataFound ? 'x' : ' '}] No secrets in source code
- [ ] Database schemas deployed to Supabase
- [ ] RPC endpoint tested and working

## Deployment
- [ ] Run \`npm run build\` successfully
- [ ] Deploy with \`vercel --prod\`
- [ ] Verify deployment at https://noviq.fun

## Post-Deployment
- [ ] Test simple payment creation
- [ ] Test escrow creation
- [ ] Test split payment creation
- [ ] Test goal creation
- [ ] Verify wallet connection works
- [ ] Check /status page
- [ ] Monitor for errors

## Mainnet Testing (Use small amounts!)
- [ ] Create 0.01 SOL payment
- [ ] Complete payment flow
- [ ] Verify auto-forwarding
- [ ] Check fee collection
`;

fs.writeFileSync('MAINNET_CHECKLIST.md', checklist);
console.log('📝 Generated MAINNET_CHECKLIST.md\n');
