'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function SplitsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-white">
            Automated Payment Splits
          </h1>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            One payment, multiple recipients. Define percentages once, distribute instantly.
          </p>
          <button
            onClick={() => router.push('/create/split')}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all"
          >
            Create Split →
          </button>
        </div>

        {/* The Problem */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">❌ The Problem</h2>
          <div className="space-y-3 text-slate-300">
            <p>• Made profits with your team? Now you have to manually split it.</p>
            <p>• Calculate percentages, send multiple transactions, hope you didn't mess up.</p>
            <p>• Someone always feels like they got shortchanged.</p>
            <p>• Takes forever and costs multiple transaction fees.</p>
          </div>
        </div>

        {/* The Solution */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">✅ The Solution: Auto-Splits</h2>
          <p className="text-slate-300 mb-4">
            Set up percentages once. One payment automatically distributes to all wallets. Fair, instant, transparent.
          </p>
          <p className="text-slate-400 text-sm">
            No manual calculations. No multiple transactions. Just works.
          </p>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Add Wallets</h3>
                <p className="text-slate-400">
                  Add all team member wallet addresses and set their percentages (must total 100%).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Share Link</h3>
                <p className="text-slate-400">
                  Get a payment link. Share it or use it yourself to send funds.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Auto-Distribute</h3>
                <p className="text-slate-400">
                  When payment is received, funds automatically split to all wallets. Everyone gets their share instantly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Example */}
        <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Example</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Alice (Team Lead)</span>
              <span className="text-white font-bold">50%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Bob (Developer)</span>
              <span className="text-white font-bold">30%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Carol (Designer)</span>
              <span className="text-white font-bold">20%</span>
            </div>
            <div className="border-t border-slate-700 pt-4 mt-4">
              <p className="text-slate-300 mb-2">Payment received: <span className="text-white font-bold">100 SOL</span></p>
              <p className="text-green-400 text-sm">✓ Alice gets 50 SOL</p>
              <p className="text-green-400 text-sm">✓ Bob gets 30 SOL</p>
              <p className="text-green-400 text-sm">✓ Carol gets 20 SOL</p>
              <p className="text-slate-500 text-xs mt-2">All in one transaction. Instant.</p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Perfect For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2">📈 Trading Teams</h3>
              <p className="text-slate-400 text-sm">
                Split profits from successful trades automatically.
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2">💼 Freelance Teams</h3>
              <p className="text-slate-400 text-sm">
                Split project payments among team members fairly.
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2">🎮 Gaming Guilds</h3>
              <p className="text-slate-400 text-sm">
                Distribute tournament winnings or guild earnings.
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2">🤝 Revenue Sharing</h3>
              <p className="text-slate-400 text-sm">
                Automatically split revenue with partners or investors.
              </p>
            </div>
          </div>
        </div>

        {/* Why NOVIQ */}
        <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-8 border border-purple-500/20 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Why Use NOVIQ Splits?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-white font-semibold">Automatic</p>
                <p className="text-slate-400 text-sm">Set it once, use it forever. No manual splitting.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-white font-semibold">Fair</p>
                <p className="text-slate-400 text-sm">Everyone sees the percentages. Transparent and trustworthy.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-white font-semibold">Instant</p>
                <p className="text-slate-400 text-sm">Everyone gets paid at the same time. No waiting.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-white font-semibold">Cheap</p>
                <p className="text-slate-400 text-sm">One transaction fee instead of multiple. Save on gas.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => router.push('/create/split')}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all text-lg"
          >
            Create Your First Split →
          </button>
          <p className="text-slate-500 text-sm mt-4">
            Takes 30 seconds. No signup required.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
