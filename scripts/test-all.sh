#!/bin/bash

echo "🧪 Running All Tests"
echo "===================="
echo ""

# Test 1: Database Connection
echo "1. Testing database connection..."
npx tsx scripts/test-database.ts
if [ $? -eq 0 ]; then
    echo "✅ Database test passed"
else
    echo "❌ Database test failed"
    exit 1
fi

echo ""

# Test 2: Check environment variables
echo "2. Checking environment variables..."
if [ -f .env.local ]; then
    echo "✅ .env.local exists"
    
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "✅ Supabase URL configured"
    else
        echo "❌ Supabase URL missing"
    fi
    
    if grep -q "ENCRYPTION_KEY" .env.local; then
        echo "✅ Encryption key configured"
    else
        echo "❌ Encryption key missing"
    fi
else
    echo "❌ .env.local not found"
    exit 1
fi

echo ""

# Test 3: Build test
echo "3. Testing build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "===================="
echo "✅ All tests passed!"
echo ""
echo "Ready to deploy! 🚀"
echo ""
echo "Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Deploy to Vercel"
echo "3. Switch to mainnet when ready"
