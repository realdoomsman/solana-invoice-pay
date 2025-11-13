'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function ReferralsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [referralCode, setReferralCode] = useState('')
  const [stats, setStats] = useState({ total_referrals: 0, total_earned: 0 })
  const [earnings, setEarnings] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }
    setUser(currentUser)
    loadReferralData(currentUser.walletAddress)
  }, [router])

  const loadReferralData = async (wallet: string) => {
    try {
      // Generate a simple referral code from wallet
      const code = wallet.slice(0, 4) + wallet.slice(-4) + '-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      setReferralCode(code)

      // Mock data for now - will be replaced when Supabase is set up
      setStats({ total_referrals: 0, total_earned: 0 })
      setEarnings([])
      setLeaderboard([])
    } catch (error) {
      console.error('Error loading referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${referralCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareReferralLink = () => {
    const link = `${window.location.origin}?ref=${referralCode}`
    const text = `Join NOVIQ and get fast Solana payments! Use my referral code: ${referralCode}`
    
    if (navigator.share) {
      navigator.share({ title: 'NOVIQ Referral', text, url: link })
    } else {
      copyReferralLink()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            💰 Referral Program
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Earn 5% commission on every payment your referrals make. Forever.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-8 border border-blue-500/30">
            <div className="text-blue-400 text-sm font-medium mb-2">Total Referrals</div>
            <div className="text-4xl font-bold text-white">{stats.total_referrals}</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-2xl p-8 border border-green-500/30">
            <div className="text-green-400 text-sm font-medium mb-2">Total Earned</div>
            <div className="text-4xl font-bold text-white">{stats.total_earned.toFixed(4)} SOL</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-2xl p-8 border border-purple-500/30">
            <div className="text-purple-400 text-sm font-medium mb-2">Commission Rate</div>
            <div className="text-4xl font-bold text-white">5%</div>
          </div>
        </div>

        {/* Referral Link Section */}
        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Your Referral Link</h2>
          <p className="text-slate-400 mb-6">
            Share this link with friends. When they sign up and make payments, you earn 5% of our platform fee!
          </p>
          
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${referralCode}`}
              readOnly
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm"
            />
            <button
              onClick={copyReferralLink}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
            <button
              onClick={shareReferralLink}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              Share
            </button>
          </div>

          <div className="text-sm text-slate-400">
            Your referral code: <span className="text-white font-mono">{referralCode}</span>
          </div>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6">How It Works</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                <div>
                  <div className="text-white font-medium">Share Your Link</div>
                  <div className="text-sm text-slate-400">Send your referral link to friends</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                <div>
                  <div className="text-white font-medium">They Sign Up</div>
                  <div className="text-sm text-slate-400">Friends create account using your link</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                <div>
                  <div className="text-white font-medium">You Earn</div>
                  <div className="text-sm text-slate-400">Get 5% of platform fees from their payments</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6">Commission Example</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-800">
                <span className="text-slate-400">Referral makes 100 SOL payment</span>
                <span className="text-white font-mono">100 SOL</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-800">
                <span className="text-slate-400">Platform fee (3%)</span>
                <span className="text-white font-mono">3 SOL</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-800">
                <span className="text-slate-400">Your commission (5% of fee)</span>
                <span className="text-green-400 font-mono font-bold">0.15 SOL</span>
              </div>
              <div className="text-sm text-slate-400 mt-4">
                💡 The more your referrals use NOVIQ, the more you earn!
              </div>
            </div>
          </div>
        </div>

        {/* Recent Earnings */}
        {earnings.length > 0 && (
          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 mb-12">
            <h3 className="text-xl font-bold text-white mb-6">Recent Earnings</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-800">
                  <tr>
                    <th className="text-left py-3 text-sm text-slate-400">Date</th>
                    <th className="text-left py-3 text-sm text-slate-400">Payment Amount</th>
                    <th className="text-left py-3 text-sm text-slate-400">Your Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.slice(0, 10).map((earning) => (
                    <tr key={earning.id} className="border-b border-slate-800">
                      <td className="py-3 text-sm text-slate-300">
                        {new Date(earning.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-sm text-white font-mono">
                        {earning.amount.toFixed(4)} SOL
                      </td>
                      <td className="py-3 text-sm text-green-400 font-mono font-bold">
                        +{earning.commission.toFixed(4)} SOL
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
          <h3 className="text-xl font-bold text-white mb-6">🏆 Top Referrers</h3>
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.referrer_wallet}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-slate-400 text-black' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-mono text-sm">
                      {entry.referrer_wallet.slice(0, 8)}...{entry.referrer_wallet.slice(-8)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {entry.total_referrals} referrals
                    </div>
                  </div>
                </div>
                <div className="text-green-400 font-mono font-bold">
                  {entry.total_earned.toFixed(4)} SOL
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
