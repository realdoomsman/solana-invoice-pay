'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
} from '@solana/web3.js'
import { QRCodeSVG } from 'qrcode.react'

interface PaymentData {
  id: string
  amount: number
  token: string
  description: string
  status: string
  createdAt: string
  paymentWallet: string
  merchantWallet: string
  txSignature?: string
  type?: 'simple' | 'split' | 'escrow' | 'goal'
  splitRecipients?: any[]
  mintNFT?: boolean
  isGoal?: boolean
  goalAmount?: number
  currentAmount?: number
  escrowEnabled?: boolean
  milestones?: any[]
}

export default function PaymentPage() {
  const params = useParams()
  const { publicKey, sendTransaction } = useWallet()
  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [checking, setChecking] = useState(false)
  const [balance, setBalance] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'address' | 'wallet'>('address')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const payments = JSON.parse(localStorage.getItem('payments') || '[]')
    const found = payments.find((p: PaymentData) => p.id === params.id)
    if (found) {
      setPayment(found)
      if (found.status === 'pending') {
        startBalanceCheck(found)
      }
    }
  }, [params.id])

  const startBalanceCheck = async (paymentData: PaymentData) => {
    setChecking(true)
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
    const endpoint =
      network === 'mainnet-beta'
        ? 'https://api.mainnet-beta.solana.com'
        : `https://api.${network}.solana.com`

    const connection = new Connection(endpoint, 'confirmed')
    const paymentPubkey = new PublicKey(paymentData.paymentWallet)

    const interval = setInterval(async () => {
      try {
        const balance = await connection.getBalance(paymentPubkey)
        const solBalance = balance / LAMPORTS_PER_SOL
        setBalance(solBalance)

        if (solBalance >= paymentData.amount) {
          clearInterval(interval)

          const payments = JSON.parse(localStorage.getItem('payments') || '[]')
          const paymentWithKey = payments.find((p: any) => p.id === paymentData.id)

          if (paymentWithKey && paymentWithKey.privateKey) {
            try {
              const response = await fetch('/api/forward-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentId: paymentData.id,
                  privateKey: paymentWithKey.privateKey,
                  merchantWallet: paymentData.merchantWallet,
                }),
              })

              const result = await response.json()

              if (result.success) {
                const updated = payments.map((p: any) =>
                  p.id === paymentData.id
                    ? { ...p, status: 'paid', txSignature: result.signature }
                    : p
                )
                localStorage.setItem('payments', JSON.stringify(updated))
                setPayment({
                  ...paymentData,
                  status: 'paid',
                  txSignature: result.signature,
                })
              }
            } catch (error) {
              console.error('Error forwarding payment:', error)
              const updated = payments.map((p: any) =>
                p.id === paymentData.id ? { ...p, status: 'paid' } : p
              )
              localStorage.setItem('payments', JSON.stringify(updated))
              setPayment({ ...paymentData, status: 'paid' })
            }
          }
        }
      } catch (error) {
        console.error('Error checking balance:', error)
      }
    }, 3000)

    return () => clearInterval(interval)
  }

  const handleWalletPayment = async () => {
    if (!publicKey || !payment) return

    setProcessing(true)
    try {
      const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
      const endpoint =
        network === 'mainnet-beta'
          ? 'https://api.mainnet-beta.solana.com'
          : `https://api.${network}.solana.com`

      const connection = new Connection(endpoint, 'confirmed')
      const paymentPubkey = new PublicKey(payment.paymentWallet)

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: paymentPubkey,
          lamports: payment.amount * LAMPORTS_PER_SOL,
        })
      )

      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      alert('Payment sent! Waiting for confirmation...')
    } catch (error) {
      console.error('Payment failed:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-xl text-slate-600 dark:text-slate-400">Payment not found</p>
      </div>
    )
  }

  const paymentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const solanaPayUrl = `solana:${payment.paymentWallet}?amount=${payment.amount}&label=${encodeURIComponent(payment.description || 'Payment')}`

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {payment.status === 'paid' ? (
          // Success State
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
              Payment Received!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {balance > 0 ? `${balance.toFixed(4)} SOL` : `${payment.amount} SOL`}{' '}
              received and forwarded
            </p>
            <div className="space-y-2">
              <a
                href={`https://explorer.solana.com/address/${payment.paymentWallet}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                View Payment Wallet →
              </a>
              {payment.txSignature && (
                <>
                  <br />
                  <a
                    href={`https://explorer.solana.com/tx/${payment.txSignature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    View Transaction →
                  </a>
                </>
              )}
            </div>
          </div>
        ) : (
          // Payment Form
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              {/* Payment Type Badge */}
              {payment.type && payment.type !== 'simple' && (
                <div className="inline-block mb-3">
                  {payment.type === 'split' && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold">
                      🔀 Split Payment
                    </span>
                  )}
                  {payment.type === 'escrow' && (
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-semibold">
                      🔒 Escrow Payment
                    </span>
                  )}
                  {payment.type === 'goal' && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold">
                      🎯 Funding Goal
                    </span>
                  )}
                </div>
              )}
              
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {payment.amount} {payment.token}
              </h2>
              
              {payment.isGoal && payment.goalAmount && (
                <div className="mt-3 mb-3">
                  <div className="max-w-md mx-auto">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Progress</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {payment.currentAmount || 0} / {payment.goalAmount} {payment.token}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${Math.min(((payment.currentAmount || 0) / payment.goalAmount) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              
              {payment.description && (
                <p className="text-slate-600 dark:text-slate-400">{payment.description}</p>
              )}
              
              {payment.mintNFT && (
                <div className="mt-3 inline-block px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                    🎨 Includes NFT Receipt
                  </span>
                </div>
              )}
              
              {checking && balance > 0 && (
                <div className="mt-3 inline-block px-4 py-2 bg-green-100 dark:bg-green-900 rounded-full">
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Received: {balance.toFixed(4)} SOL
                  </span>
                </div>
              )}
            </div>

            {/* Payment Method Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setPaymentMethod('address')}
                className={`px-4 py-2 font-medium transition-colors ${
                  paymentMethod === 'address'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Send to Address
              </button>
              <button
                onClick={() => setPaymentMethod('wallet')}
                className={`px-4 py-2 font-medium transition-colors ${
                  paymentMethod === 'wallet'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Connect Wallet
              </button>
            </div>

            {paymentMethod === 'address' ? (
              // Send to Address Method
              <>
                <div className="flex justify-center mb-6">
                  <div className="bg-white p-4 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                    <QRCodeSVG value={solanaPayUrl} size={200} />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Payment Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={payment.paymentWallet}
                      readOnly
                      className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(payment.paymentWallet)
                        alert('Address copied!')
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    How to pay:
                  </h3>
                  <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>1. Scan QR code with your Solana wallet</li>
                    <li>2. Or copy the address and send manually</li>
                    <li>
                      3. Send exactly {payment.amount} {payment.token}
                    </li>
                    <li>4. Payment confirms automatically</li>
                  </ol>
                </div>
              </>
            ) : (
              // Connect Wallet Method
              <div className="space-y-6">
                <div className="text-center">
                  <WalletMultiButton />
                </div>

                {publicKey && (
                  <button
                    onClick={handleWalletPayment}
                    disabled={processing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing
                      ? 'Processing...'
                      : `Pay ${payment.amount} ${payment.token}`}
                  </button>
                )}

                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Connect your Solana wallet and pay directly from this page. Supports
                    Phantom, Solflare, and other popular wallets.
                  </p>
                </div>
              </div>
            )}

            {checking && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Watching for payment...
                </div>
              </div>
            )}

            {/* Share Link */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Share this payment link:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={paymentUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(paymentUrl)
                    alert('Link copied!')
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
