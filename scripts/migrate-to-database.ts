// Migration script to move localStorage data to Supabase
// Run with: npx tsx scripts/migrate-to-database.ts

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function migrate() {
  console.log('🔄 Migrating localStorage to Supabase Database')
  console.log('===============================================\n')

  const supabaseUrl = await question('Enter your Supabase URL: ')
  const supabaseKey = await question('Enter your Supabase Service Role Key: ')

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('\n✓ Connected to Supabase')
  console.log('\nThis script will help you migrate your localStorage data.')
  console.log('You need to copy your localStorage data from the browser.\n')

  console.log('Instructions:')
  console.log('1. Open your app in browser')
  console.log('2. Open DevTools (F12)')
  console.log('3. Go to Console tab')
  console.log('4. Run: JSON.stringify(localStorage)')
  console.log('5. Copy the output\n')

  const localStorageData = await question('Paste localStorage data here: ')

  try {
    const data = JSON.parse(localStorageData)
    const payments = JSON.parse(data.payments || '[]')
    const currentUser = JSON.parse(data.currentUser || 'null')

    console.log(`\nFound ${payments.length} payments`)

    if (currentUser) {
      console.log(`Found user: ${currentUser.walletAddress}`)

      // Create user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({ wallet_address: currentUser.walletAddress })
        .select()
        .single()

      if (userError && userError.code !== '23505') {
        throw userError
      }

      console.log('✓ User migrated')

      // Migrate payments
      for (const payment of payments) {
        const { error } = await supabase
          .from('payments')
          .insert({
            id: payment.id,
            user_id: user?.id,
            amount: payment.amount,
            token: payment.token,
            description: payment.description,
            status: payment.status,
            payment_wallet: payment.paymentWallet,
            merchant_wallet: payment.merchantWallet,
            type: payment.type || 'simple',
            encrypted_private_key: payment.privateKey || '',
            tx_signature: payment.txSignature,
          })

        if (error) {
          console.log(`✗ Failed to migrate payment ${payment.id}:`, error.message)
        } else {
          console.log(`✓ Migrated payment ${payment.id}`)
        }
      }

      console.log('\n✅ Migration complete!')
    } else {
      console.log('No user found in localStorage')
    }
  } catch (error) {
    console.error('Error:', error)
  }

  rl.close()
}

migrate()
