'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useRouter } from 'next/navigation'
import AdminAuditLog from '@/components/AdminAuditLog'

export default function AdminAuditLogPage() {
  const router = useRouter()
  const { publicKey } = useWallet()
  const [adminWallets] = [
    // Add your admin wallet addresses here
    process.env.NEXT_PUBLIC_ADMIN_WALLET || '',
  ]

  const isAdmin = publicKey && adminWallets.includes(publicKey.toString())

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Admin Audit Log
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Connect your admin wallet to access the audit log
          </p>
          <WalletMultiButton />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Unauthorized
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            This wallet is not authorized to access the admin audit log.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => router.push('/admin/escrow')}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Admin Audit Log
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Complete history of all administrative actions and dispute resolutions
            </p>
          </div>
          <WalletMultiButton />
        </div>

        {/* Audit Log Component */}
        <AdminAuditLog limit={100} />
      </div>
    </div>
  )
}
