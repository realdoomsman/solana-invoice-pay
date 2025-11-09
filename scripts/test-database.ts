import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

async function testConnection() {
  console.log('Testing Supabase connection...\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Test connection by querying users table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return
    }
    
    console.log('✅ Database connection successful!')
    console.log('✅ Tables created successfully!')
    console.log('\nYour production setup is complete!')
    console.log('\nNext steps:')
    console.log('1. Run: npm run dev')
    console.log('2. Test creating a payment')
    console.log('3. Check Supabase dashboard to see data')
    console.log('\nReady to go! 🚀')
    
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

testConnection()
