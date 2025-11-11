'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function CrowdfundingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-white">
            Collective Funding Goals
          </h1>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Pool funds together with built-in accountability. Transparent progress tracking.
          </p>
          <button
            onClick={() => router.push('/create/goal')}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transition-all"
          >
            Create Goal →
          </button>
        </div>

        {/* The Problem */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">❌ The Problem</h2>
          <div className="space-y-3 text-slate-300">
            <p>• Want to do a group buy for a presale? Hard to coordinate.</p>
            <p>• Need to track who contributed and how much? Messy spreadsheets.</p>
            <p>• What if you don't reach the goal? Manual refunds suck.</p>
            <p>• No transparency = people don't trust the organizer.</p>
          </div>
        </div>

        {/* The Solution */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">✅ The Solution: Funding Goals</h2>
          <p className="text-slate-300 mb-4">
            Set a goal, share the link, track progress in real-time. If goal is reached, funds release. If not, automatic refunds.
          </p>
          <p className="text-slate-400 text-sm">
            Transparent. Fair. Automated.
          </p>
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Set Goal</h3>
                <p className="text-slate-400">
                  Set your funding goal (e.g., 50 SOL) and optional deadline.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Share Link</h3>
                <p className="text-slate-400">
                  Share the funding link with your community. They can see progress in real-time.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Track Progress</h3>
                <p className="text-slate-400">
                  Everyone can see how much has been raised. Transparent progress bar.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Goal Reached or Refund</h3>
                <p className="text-slate-400">
                  If goal is reached, funds release to organizer. If not, everyone gets automatic refunds.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Example */}
        <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Example: Presale Group Buy</h2>
          <div className="space-y-4">
            <div>
              <p className="text-slate-400 mb-2">Goal: <span className="text-white font-bold">50 SOL</span></p>
              <p className="text-slate-400 mb-4">Deadline: <span className="text-white">48 hours</span></p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-slate-400 text-sm">Progress</span>
                <span className="text-white font-bold">35 / 50 SOL (70%)</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full" style={{width: '70%'}}></div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-slate-400">• 12 contributors so far</p>
              <p className="text-slate-400">• Average contribution: 2.9 SOL</p>
              <p className="text-green-400">• 15 SOL more needed to reach goal</p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Perfect For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2">🚀 Presale Group Buys</h3>
              <p className="text-slate-400 text-sm">
                Pool funds to participate in token presales together.
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2">🎨 Community Projects</h3>
              <p className="text-slate-400 text-sm">
                Raise funds for community initiatives or art projects.
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2">🎮 Gaming Tournaments</h3>
              <p className="text-slate-400 text-sm">
                Pool prize money for tournaments or competitions.
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-2">💡 Startup Funding</h3>
              <p className="text-slate-400 text-sm">
                Raise initial capital from your community.
              </p>
            </div>
          </div>
        </div>

        {/* Why NOVIQ */}
        <div className="bg-gradient-to-r from-green-900/20 to-cyan-900/20 rounded-2xl p-8 border border-green-500/20 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Why Use NOVIQ Crowdfunding?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-white font-semibold">Transparent</p>
                <p className="text-slate-400 text-sm">Everyone can see progress in real-time. No hidden numbers.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-white font-semibold">Safe</p>
                <p className="text-slate-400 text-sm">Auto-refund if goal not met. No one loses money.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-white font-semibold">Automated</p>
                <p className="text-slate-400 text-sm">No manual tracking or refunds. Everything happens automatically.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-white font-semibold">On-Chain</p>
                <p className="text-slate-400 text-sm">All transactions visible on Solana. Fully verifiable.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => router.push('/create/goal')}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transition-all text-lg"
          >
            Create Your First Goal →
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
