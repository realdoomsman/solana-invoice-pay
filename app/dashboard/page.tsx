'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { getCurrentUser, logout } from '@/lib/auth'
import { getPaymentInsights } from '@/lib/ai'

interface PaymentData {
  id: string
  amount: number
  token: string
  description: string
  status: string
  createdAt: string
  merchantWallet?: string
  txSignature?: string
}

export default function Dashboard() {
  const router = useRouter()
  const [payments, setPayments] = useState<PaymentData[]>([])
  const [user, setUser] = useState<{ walletAddress: string } | null>(null)
  const [insights, setInsights] = useState<{ insights: string[], trends: string[] } | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }
    setUser(currentUser)

    // Filter payments for this user
    const stored = JSON.parse(localStorage.getItem('payments') || '[]')
    const userPayments = stored.filter(
      (p: PaymentData) => p.merchantWallet === currentUser.walletAddress
    )
    setPayments(userPayments.reverse())
    
    // Load AI insights
    getPaymentInsights(userPayments).then(result => {
      if (result.success && result.data) {
        setInsights(result.data)
      }
    })
  }, [router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingCount = payments.filter((p) => p.status === 'pending').length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Track all your payment links
            </p>
            {user && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-8)}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Create New Payment
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Total Payments
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {payments.length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {pendingCount}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Total Received
            </p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {totalPaid.toFixed(2)} SOL
            </p>
          </div>
        </div>

        {/* Payments List */}
        {/* AI Insights */}
        {insights && (insights.insights.length > 0 || insights.trends.length > 0) && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg shadow p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                AI Insights
              </h3>
            </div>
            <div className="space-y-3">
              {insights.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400">•</span>
                  <p className="text-sm text-purple-900 dark:text-purple-100">{insight}</p>
                </div>
              ))}
              {insights.trends.length > 0 && (
                <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">TRENDS</p>
                  {insights.trends.map((trend, i) => (
                    <div key={i} className="text-sm text-purple-800 dark:text-purple-200">{trend}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Recent Payments
            </h2>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-4">No payments yet</p>
              <button
                onClick={() => router.push('/')}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Create your first payment link →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {payment.amount} {payment.token}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600 dark:text-slate-400">
                          {payment.description || 'No description'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {formatDistanceToNow(new Date(payment.createdAt), {
                          addSuffix: true,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => router.push(`/pay/${payment.id}`)}
                          className="text-blue-600 dark:text-blue-400 hover:underline mr-4 font-medium"
                        >
                          View
                        </button>
                        {payment.txSignature && (
                          <a
                            href={`https://explorer.solana.com/tx/${payment.txSignature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            TX
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
