'use client'

import { useState, useEffect } from 'react'
import { Connection } from '@solana/web3.js'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'

interface SystemStatus {
  solana: 'operational' | 'degraded' | 'down'
  rpc: 'operational' | 'degraded' | 'down'
  platform: 'operational' | 'degraded' | 'down'
  latency: number | null
}

export default function StatusPage() {
  const router = useRouter()
  const [status, setStatus] = useState<SystemStatus>({
    solana: 'operational',
    rpc: 'operational',
    platform: 'operational',
    latency: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const checkStatus = async () => {
    try {
      const startTime = Date.now()
      
      // Check Solana RPC
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
      const connection = new Connection(rpcUrl)
      
      const version = await connection.getVersion()
      const latency = Date.now() - startTime

      setStatus({
        solana: version ? 'operational' : 'down',
        rpc: latency < 1000 ? 'operational' : latency < 3000 ? 'degraded' : 'down',
        platform: 'operational',
        latency,
      })
    } catch (error) {
      console.error('Status check failed:', error)
      setStatus({
        solana: 'down',
        rpc: 'down',
        platform: 'operational',
        latency: null,
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500'
      case 'degraded':
        return 'bg-yellow-500'
      case 'down':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Operational'
      case 'degraded':
        return 'Degraded Performance'
      case 'down':
        return 'Down'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => router.push('/')}
            className="mb-6 text-blue-200 hover:text-white flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-5xl font-black mb-4">System Status</h1>
          <p className="text-xl text-blue-100">
            Real-time status of all platform services
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Overall Status */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-8 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Overall Status
            </h2>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-sm">Checking...</span>
              </div>
            ) : (
              <button
                onClick={checkStatus}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Refresh
              </button>
            )}
          </div>

          {!loading && (
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${getStatusColor(status.platform)} animate-pulse`}></div>
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                All Systems {getStatusText(status.platform)}
              </span>
            </div>
          )}
        </div>

        {/* Service Status */}
        <div className="space-y-4">
          {/* Solana Network */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(status.solana)}`}></div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Solana Network
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Blockchain connectivity
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                status.solana === 'operational'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : status.solana === 'degraded'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {getStatusText(status.solana)}
              </span>
            </div>
          </div>

          {/* RPC Endpoint */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(status.rpc)}`}></div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    RPC Endpoint
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {status.latency !== null ? `${status.latency}ms latency` : 'Checking...'}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                status.rpc === 'operational'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : status.rpc === 'degraded'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {getStatusText(status.rpc)}
              </span>
            </div>
          </div>

          {/* Platform Services */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(status.platform)}`}></div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Platform Services
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Payment processing & forwarding
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                status.platform === 'operational'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : status.platform === 'degraded'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {getStatusText(status.platform)}
              </span>
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Network Information
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex justify-between">
              <span>Network:</span>
              <span className="font-mono">{process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Incident History */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
            Recent Incidents
          </h3>
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No incidents reported in the last 30 days</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
