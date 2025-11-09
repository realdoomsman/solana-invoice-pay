import * as dotenv from 'dotenv'
import { sendPaymentReceivedEmail } from '../lib/email'

dotenv.config({ path: '.env.local' })

const testEmail = process.argv[2]

if (!testEmail) {
  console.log('Usage: npx tsx scripts/test-email.ts your_email@example.com')
  process.exit(1)
}

async function test() {
  console.log('Testing email setup...\n')
  
  if (!process.env.SENDGRID_API_KEY) {
    console.log('❌ SENDGRID_API_KEY not found in .env.local')
    console.log('\nPlease add your SendGrid API key to .env.local:')
    console.log('SENDGRID_API_KEY=your_key_here')
    console.log('\nSee EMAIL_SETUP.md for instructions')
    return
  }
  
  if (!process.env.NOTIFICATION_EMAIL) {
    console.log('❌ NOTIFICATION_EMAIL not found in .env.local')
    console.log('\nPlease add your verified email to .env.local:')
    console.log('NOTIFICATION_EMAIL=your_email@example.com')
    return
  }
  
  console.log('Sending test email to:', testEmail)
  console.log('From:', process.env.NOTIFICATION_EMAIL)
  console.log('')
  
  try {
    await sendPaymentReceivedEmail(testEmail, {
      amount: 1.5,
      token: 'SOL',
      description: 'Test payment from Solana Pay',
      txSignature: 'test123456789',
    })
    
    console.log('✅ Email sent successfully!')
    console.log('\nCheck your inbox at:', testEmail)
    console.log('(Check spam folder if you don\'t see it)')
  } catch (error: any) {
    console.log('❌ Error sending email:', error.message)
    console.log('\nCommon issues:')
    console.log('1. API key is incorrect')
    console.log('2. Sender email not verified in SendGrid')
    console.log('3. SendGrid account not activated')
    console.log('\nSee EMAIL_SETUP.md for help')
  }
}

test()
