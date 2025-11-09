import { supabase, supabaseAdmin } from './supabase'
import { encryptPrivateKey } from './encryption'
import { PaymentData } from './types'

export async function createUser(walletAddress: string) {
  const { data, error } = await supabase
    .from('users')
    .insert({ wallet_address: walletAddress })
    .select()
    .single()

  if (error && error.code !== '23505') { // 23505 is unique violation (user exists)
    throw error
  }

  return data
}

export async function getUser(walletAddress: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single()

  if (error && error.code !== 'PGRST116') { // Not found
    throw error
  }

  return data
}

export async function createPayment(payment: PaymentData, userId: string) {
  // Encrypt private key before storing
  const encryptedKey = encryptPrivateKey(payment.privateKey || '')

  const { data, error } = await supabase
    .from('payments')
    .insert({
      id: payment.id,
      user_id: userId,
      amount: payment.amount,
      token: payment.token,
      description: payment.description,
      status: payment.status,
      payment_wallet: payment.paymentWallet,
      merchant_wallet: payment.merchantWallet,
      type: payment.type,
      split_recipients: payment.splitRecipients,
      escrow_enabled: payment.escrowEnabled,
      milestones: payment.milestones,
      is_goal: payment.isGoal,
      goal_amount: payment.goalAmount,
      current_amount: payment.currentAmount,
      contributors: payment.contributors,
      encrypted_private_key: encryptedKey,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getPayment(paymentId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (error) throw error
  return data
}

export async function getUserPayments(userId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function updatePaymentStatus(
  paymentId: string,
  status: string,
  txSignature?: string
) {
  const { data, error } = await supabase
    .from('payments')
    .update({
      status,
      tx_signature: txSignature,
    })
    .eq('id', paymentId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Admin function to get encrypted private key (server-side only)
export async function getPaymentPrivateKey(paymentId: string) {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('encrypted_private_key')
    .eq('id', paymentId)
    .single()

  if (error) throw error
  return data.encrypted_private_key
}
