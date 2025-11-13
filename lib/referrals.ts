import { supabase } from './supabase'
import { nanoid } from 'nanoid'

export interface ReferralData {
  id: string
  referrer_wallet: string
  referral_code: string
  total_referrals: number
  total_earned: number
  created_at: string
}

export interface ReferralEarning {
  id: string
  referrer_wallet: string
  referred_wallet: string
  payment_id: string
  amount: number
  commission: number
  created_at: string
}

// Generate unique referral code
export function generateReferralCode(walletAddress: string): string {
  const shortWallet = walletAddress.slice(0, 4) + walletAddress.slice(-4)
  const random = nanoid(6).toUpperCase()
  return `${shortWallet}-${random}`
}

// Create or get referral code for user
export async function getOrCreateReferralCode(walletAddress: string): Promise<string> {
  // Check if user already has a referral code
  const { data: existing } = await supabase
    .from('referrals')
    .select('referral_code')
    .eq('referrer_wallet', walletAddress)
    .single()

  if (existing) {
    return existing.referral_code
  }

  // Create new referral code
  const code = generateReferralCode(walletAddress)
  
  await supabase
    .from('referrals')
    .insert({
      referrer_wallet: walletAddress,
      referral_code: code,
      total_referrals: 0,
      total_earned: 0
    })

  return code
}

// Track referral signup
export async function trackReferralSignup(referralCode: string, newUserWallet: string) {
  // Find referrer
  const { data: referrer } = await supabase
    .from('referrals')
    .select('referrer_wallet')
    .eq('referral_code', referralCode)
    .single()

  if (!referrer) return

  // Increment referral count
  await supabase
    .from('referrals')
    .update({ 
      total_referrals: supabase.rpc('increment', { row_id: referrer.referrer_wallet })
    })
    .eq('referrer_wallet', referrer.referrer_wallet)

  // Store referral relationship
  await supabase
    .from('referral_relationships')
    .insert({
      referrer_wallet: referrer.referrer_wallet,
      referred_wallet: newUserWallet,
      referral_code: referralCode
    })
}

// Track referral commission (5% of platform fee)
export async function trackReferralCommission(
  paymentId: string,
  payerWallet: string,
  amount: number,
  platformFee: number
) {
  // Check if payer was referred
  const { data: relationship } = await supabase
    .from('referral_relationships')
    .select('referrer_wallet')
    .eq('referred_wallet', payerWallet)
    .single()

  if (!relationship) return

  // Calculate commission (5% of platform fee = 0.15% of payment)
  const commission = platformFee * 0.05

  // Record earning
  await supabase
    .from('referral_earnings')
    .insert({
      referrer_wallet: relationship.referrer_wallet,
      referred_wallet: payerWallet,
      payment_id: paymentId,
      amount: amount,
      commission: commission
    })

  // Update total earned
  await supabase
    .from('referrals')
    .update({
      total_earned: supabase.rpc('increment_by', { 
        row_id: relationship.referrer_wallet,
        amount: commission
      })
    })
    .eq('referrer_wallet', relationship.referrer_wallet)
}

// Get referral stats
export async function getReferralStats(walletAddress: string) {
  const { data: stats } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_wallet', walletAddress)
    .single()

  const { data: earnings } = await supabase
    .from('referral_earnings')
    .select('*')
    .eq('referrer_wallet', walletAddress)
    .order('created_at', { ascending: false })

  return {
    stats: stats || { total_referrals: 0, total_earned: 0, referral_code: '' },
    earnings: earnings || []
  }
}

// Get referral leaderboard
export async function getReferralLeaderboard(limit = 10) {
  const { data } = await supabase
    .from('referrals')
    .select('referrer_wallet, total_referrals, total_earned')
    .order('total_earned', { ascending: false })
    .limit(limit)

  return data || []
}
