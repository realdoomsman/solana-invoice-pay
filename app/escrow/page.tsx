'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function EscrowPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-white">
            Secure Escrow Service
          </h1>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Trustless peer-to-peer transactions with automated fund release. Both parties protected.
          </p>
          <button
            onClick={() => router.push('/create/escrow')}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            Create Escrow →
          </button>
        </div>

        {/* Value Proposition */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">How Escrow Protects Both Parties</h2>
          <p className="text-slate-300 mb-6 leading-relaxed">
            Traditional peer-to-peer transactions require trust. One party must send funds first, creating risk. 
            PayOS escrow eliminates this risk by holding funds until both parties confirm successful completion.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-semibold mb-2">Without Escrow</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>• Counterparty risk</li>
                <li>• No recourse if scammed</li>
                <li>• Requires trust in strangers</li>
                <li>• Disputes are difficult</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">With PayOS Escrow</h3>
              <ul className="space-y-2 text-green-400 text-sm">
                <li>• Both parties protected</li>
                <li>• Automated fund release</li>
                <li>• No trust required</li>
                <li>• Transparent on-chain</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Create Escrow</h3>
                <p className="text-slate-400">
                  Set the amount and add both wallet addresses (buyer and seller).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Both Deposit</h3>
                <p className="text-slate-400">
                  Both parties deposit their funds. Funds are locked in escrow.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Complete Trade</h3>
                <p className="text-slate-400">
                  Exchange whatever you're trading (tokens, NFTs, services, etc.)
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Both Confirm</h3>
                <p className="text-slate-400">
                  Both parties confirm they received what they expected. Funds automatically release.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Perfect For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2">OTC Trading</h3>
              <p className="text-slate-400 text-sm">
                Buying/selling large amounts of SOL, USDC, or other tokens safely.
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2">NFT Sales</h3>
              <p className="text-slate-400 text-sm">
                Selling NFTs to buyers you don't know. Both protected.
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2">Freelance Work</h3>
              <p className="text-slate-400 text-sm">
                Client pays upfront, funds release when work is delivered.
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2">Any P2P Deal</h3>
              <p className="text-slate-400 text-sm">
                Any trade where both parties need protection.
              </p>
            </div>
          </div>
        </div>

        {/* Why PayOS */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl p-8 border border-blue-500/20 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Why Use PayOS Escrow?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-white font-semibold">Non-Custodial</p>
                <p className="text-slate-400 text-sm">We never hold your funds. Everything is on-chain.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-white font-semibold">Automated</p>
                <p className="text-slate-400 text-sm">No manual intervention. Funds release automatically when both confirm.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-white font-semibold">Fast</p>
                <p className="text-slate-400 text-sm">Solana speed. Transactions settle in seconds, not hours.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-white font-semibold">Cheap</p>
                <p className="text-slate-400 text-sm">1% platform fee + $0.0003 network fee. Way cheaper than alternatives.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => router.push('/create/escrow')}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all text-lg"
          >
            Create Your First Escrow →
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
