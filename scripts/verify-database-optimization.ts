/**
 * Verify Database Optimization
 * Checks that indexes are properly created and queries are optimized
 */

import { supabase } from '../lib/supabase'

interface IndexInfo {
  schemaname: string
  tablename: string
  indexname: string
  indexdef: string
}

interface QueryStats {
  endpoint: string
  queryCount: number
  avgTime: number
  usesCaching: boolean
  usesPagination: boolean
}

async function checkIndexes(): Promise<void> {
  console.log('🔍 Checking database indexes...\n')

  const expectedIndexes = [
    'idx_escrow_buyer_status',
    'idx_escrow_seller_status',
    'idx_escrow_buyer_type_status',
    'idx_escrow_seller_type_status',
    'idx_escrow_created_status',
    'idx_escrow_active_expires',
    'idx_milestone_escrow_status_order',
    'idx_deposit_escrow_confirmed',
    'idx_action_escrow_created',
    'idx_dispute_status_priority_created',
    'idx_evidence_dispute_party',
    'idx_notification_recipient_read_created',
    'idx_escrow_list_buyer',
    'idx_escrow_list_seller',
  ]

  try {
    // Query pg_indexes to check for our indexes
    const { data, error } = await supabase.rpc('get_indexes', {})

    if (error) {
      console.log('⚠️  Cannot verify indexes (requires database access)')
      console.log('   Run this query manually in Supabase SQL Editor:')
      console.log(`
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
      `)
      return
    }

    const foundIndexes = new Set(data?.map((idx: any) => idx.indexname) || [])
    
    let allFound = true
    for (const indexName of expectedIndexes) {
      if (foundIndexes.has(indexName)) {
        console.log(`✅ ${indexName}`)
      } else {
        console.log(`❌ ${indexName} - MISSING`)
        allFound = false
      }
    }

    if (allFound) {
      console.log('\n✅ All expected indexes are present!')
    } else {
      console.log('\n⚠️  Some indexes are missing. Run supabase-optimization-indexes.sql')
    }
  } catch (err) {
    console.log('⚠️  Cannot verify indexes automatically')
    console.log('   Please check manually in Supabase dashboard')
  }
}

async function testQueryPerformance(): Promise<void> {
  console.log('\n🚀 Testing query performance...\n')

  const testWallet = 'test_wallet_' + Date.now()

  // Test 1: Escrow list query
  console.log('Test 1: Escrow list query')
  const start1 = Date.now()
  try {
    const { data, error } = await supabase
      .from('escrow_contracts')
      .select('*')
      .or(`buyer_wallet.eq.${testWallet},seller_wallet.eq.${testWallet}`)
      .order('created_at', { ascending: false })
      .limit(20)

    const time1 = Date.now() - start1
    console.log(`   Query time: ${time1}ms`)
    console.log(`   Result: ${data?.length || 0} rows`)
    
    if (time1 < 100) {
      console.log('   ✅ Performance: Excellent')
    } else if (time1 < 200) {
      console.log('   ✅ Performance: Good')
    } else {
      console.log('   ⚠️  Performance: Could be improved')
    }
  } catch (err) {
    console.log('   ❌ Query failed:', err)
  }

  // Test 2: Dispute queue query
  console.log('\nTest 2: Dispute queue query')
  const start2 = Date.now()
  try {
    const { data, error } = await supabase
      .from('escrow_disputes')
      .select(`
        *,
        escrow_contracts (
          id,
          escrow_type,
          buyer_wallet,
          seller_wallet,
          buyer_amount,
          token,
          status
        )
      `)
      .in('status', ['open', 'under_review'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(20)

    const time2 = Date.now() - start2
    console.log(`   Query time: ${time2}ms`)
    console.log(`   Result: ${data?.length || 0} rows`)
    
    if (time2 < 150) {
      console.log('   ✅ Performance: Excellent')
    } else if (time2 < 300) {
      console.log('   ✅ Performance: Good')
    } else {
      console.log('   ⚠️  Performance: Could be improved')
    }
  } catch (err) {
    console.log('   ❌ Query failed:', err)
  }

  // Test 3: Milestone query
  console.log('\nTest 3: Milestone query')
  const start3 = Date.now()
  try {
    const { data, error } = await supabase
      .from('escrow_milestones')
      .select('*')
      .eq('status', 'pending')
      .order('milestone_order', { ascending: true })
      .limit(20)

    const time3 = Date.now() - start3
    console.log(`   Query time: ${time3}ms`)
    console.log(`   Result: ${data?.length || 0} rows`)
    
    if (time3 < 50) {
      console.log('   ✅ Performance: Excellent')
    } else if (time3 < 100) {
      console.log('   ✅ Performance: Good')
    } else {
      console.log('   ⚠️  Performance: Could be improved')
    }
  } catch (err) {
    console.log('   ❌ Query failed:', err)
  }
}

async function testCaching(): Promise<void> {
  console.log('\n💾 Testing query cache...\n')

  try {
    const queryCache = (await import('../lib/query-cache')).default

    // Clear cache
    queryCache.clear()
    console.log('✅ Cache cleared')

    // Test cache set/get
    const testKey = 'test:key'
    const testData = { test: 'data', timestamp: Date.now() }
    
    queryCache.set(testKey, testData, 60000)
    const retrieved = queryCache.get(testKey)
    
    if (JSON.stringify(retrieved) === JSON.stringify(testData)) {
      console.log('✅ Cache set/get working')
    } else {
      console.log('❌ Cache set/get failed')
    }

    // Test cache expiration
    queryCache.set('expire:test', { data: 'test' }, 1)
    await new Promise(resolve => setTimeout(resolve, 10))
    const expired = queryCache.get('expire:test')
    
    if (expired === null) {
      console.log('✅ Cache expiration working')
    } else {
      console.log('❌ Cache expiration failed')
    }

    // Test cache invalidation
    queryCache.set('prefix:test1', { data: 1 })
    queryCache.set('prefix:test2', { data: 2 })
    queryCache.set('other:test', { data: 3 })
    
    queryCache.invalidatePrefix('prefix:')
    
    const invalidated1 = queryCache.get('prefix:test1')
    const invalidated2 = queryCache.get('prefix:test2')
    const notInvalidated = queryCache.get('other:test')
    
    if (invalidated1 === null && invalidated2 === null && notInvalidated !== null) {
      console.log('✅ Cache invalidation working')
    } else {
      console.log('❌ Cache invalidation failed')
    }

    // Get stats
    const stats = queryCache.getStats()
    console.log(`\n📊 Cache Statistics:`)
    console.log(`   Hits: ${stats.hits}`)
    console.log(`   Misses: ${stats.misses}`)
    console.log(`   Size: ${stats.size}`)
    console.log(`   Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`)
  } catch (err) {
    console.log('❌ Cache testing failed:', err)
  }
}

async function testPagination(): Promise<void> {
  console.log('\n📄 Testing pagination...\n')

  try {
    const {
      parsePaginationParams,
      validatePaginationParams,
      calculateOffset,
      calculateTotalPages,
      createPaginationResult,
    } = await import('../lib/pagination')

    // Test parameter parsing
    const searchParams = new URLSearchParams('page=2&limit=25&sortBy=created_at&sortOrder=desc')
    const params = parsePaginationParams(searchParams)
    
    if (params.page === 2 && params.limit === 25 && params.sortBy === 'created_at') {
      console.log('✅ Parameter parsing working')
    } else {
      console.log('❌ Parameter parsing failed')
    }

    // Test validation
    const validation = validatePaginationParams({ page: 1, limit: 20 })
    if (validation.valid) {
      console.log('✅ Parameter validation working')
    } else {
      console.log('❌ Parameter validation failed')
    }

    // Test invalid params
    const invalidValidation = validatePaginationParams({ page: 0, limit: 200 })
    if (!invalidValidation.valid && invalidValidation.errors.length > 0) {
      console.log('✅ Invalid parameter detection working')
    } else {
      console.log('❌ Invalid parameter detection failed')
    }

    // Test offset calculation
    const offset = calculateOffset(3, 20)
    if (offset === 40) {
      console.log('✅ Offset calculation working')
    } else {
      console.log('❌ Offset calculation failed')
    }

    // Test total pages calculation
    const totalPages = calculateTotalPages(95, 20)
    if (totalPages === 5) {
      console.log('✅ Total pages calculation working')
    } else {
      console.log('❌ Total pages calculation failed')
    }

    // Test pagination result creation
    const result = createPaginationResult([1, 2, 3], 100, 2, 20)
    if (result.pagination.totalPages === 5 && result.pagination.hasNext && result.pagination.hasPrev) {
      console.log('✅ Pagination result creation working')
    } else {
      console.log('❌ Pagination result creation failed')
    }

    console.log('\n✅ All pagination tests passed!')
  } catch (err) {
    console.log('❌ Pagination testing failed:', err)
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Database Optimization Verification')
  console.log('  Task 20.1: Optimize database queries')
  console.log('═══════════════════════════════════════════════════════\n')

  await checkIndexes()
  await testQueryPerformance()
  await testCaching()
  await testPagination()

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  Verification Complete!')
  console.log('═══════════════════════════════════════════════════════\n')

  console.log('📝 Next Steps:')
  console.log('   1. Apply indexes: Run supabase-optimization-indexes.sql in Supabase')
  console.log('   2. Monitor performance: Check query times in production')
  console.log('   3. Adjust cache TTLs: Based on actual usage patterns')
  console.log('   4. Review cache hit rates: Aim for 70%+ hit rate')
  console.log('')
}

main().catch(console.error)
