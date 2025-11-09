// Environment variable validation and defaults

export const env = {
  // Required in production
  NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
  
  // Platform configuration
  NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE: process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE || '1',
  NEXT_PUBLIC_FEE_WALLET: process.env.NEXT_PUBLIC_FEE_WALLET || '',
  
  // Optional
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'default-key-change-in-production',
  
  // Email (optional)
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@example.com',
}

// Validation function for production
export function validateEnv() {
  const errors: string[] = []

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_FEE_WALLET) {
      errors.push('NEXT_PUBLIC_FEE_WALLET is required in production')
    }
    
    if (process.env.ENCRYPTION_KEY === 'default-key-change-in-production') {
      errors.push('ENCRYPTION_KEY must be changed in production')
    }
    
    if (process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet') {
      console.warn('⚠️  WARNING: Running on devnet in production mode')
    }
  }

  if (errors.length > 0) {
    console.error('❌ Environment validation failed:')
    errors.forEach(error => console.error(`  - ${error}`))
    throw new Error('Invalid environment configuration')
  }

  return true
}

// Check if we're in production mode
export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'
