'use client'

import { useRouter } from 'next/navigation'

interface EscrowTypeOption {
  type: 'traditional' | 'simple_buyer' | 'atomic_swap'
  title: string
  description: string
  useCases: string[]
  icon: React.ReactNode
  recommended: boolean
  color: string
  route: string
}

const escrowTypes: EscrowTypeOption[] = [
  {
    type: 'traditional',
    title: 'Traditional Escrow',
    description: 'Both parties deposit funds. Released when both confirm completion or admin resolves dispute.',
    useCases: [
      'OTC trading with strangers',
      'High-value NFT sales',
      'P2P token exchanges',
      'Any deal requiring mutual trust'
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    recommended: true,
    color: 'blue',
    route: '/create/escrow/traditional?type=traditional'
  },
  {
    type: 'simple_buyer',
    title: 'Milestone Escrow',
    description: 'Buyer deposits full amount. Funds released in milestones as seller completes work.',
    useCases: [
      'Freelance projects',
      'Development contracts',
      'Design work',
      'Any phased deliverables'
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    recommended: false,
    color: 'purple',
    route: '/create/escrow/simple?type=simple_buyer'
  },
  {
    type: 'atomic_swap',
    title: 'Atomic Swap',
    description: 'Trustless token exchange. Both deposit, swap executes automatically. No admin needed.',
    useCases: [
      'Token-to-token swaps',
      'SOL to USDC trades',
      'SPL token exchanges',
      'Instant trustless swaps'
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    recommended: false,
    color: 'green',
    route: '/create/escrow/atomic?type=atomic_swap'
  }
]

export default function EscrowTypeSelector() {
  const router = useRouter()

  const getColorClasses = (color: string, isRecommended: boolean) => {
    const colors = {
      blue: {
        border: 'border-blue-500',
        bg: 'bg-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        hover: 'hover:border-blue-500 hover:shadow-blue-500/20',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      },
      purple: {
        border: 'border-purple-500',
        bg: 'bg-purple-500',
        text: 'text-purple-600 dark:text-purple-400',
        hover: 'hover:border-purple-500 hover:shadow-purple-500/20',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      },
      green: {
        border: 'border-green-500',
        bg: 'bg-green-500',
        text: 'text-green-600 dark:text-green-400',
        hover: 'hover:border-green-500 hover:shadow-green-500/20',
        badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      }
    }
    return colors[color as keyof typeof colors]
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-6 inline-block"
          >
            ← Back to Home
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Choose Escrow Type
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Select the escrow mechanism that best fits your transaction needs
          </p>
        </div>

        {/* Escrow Type Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {escrowTypes.map((escrowType) => {
            const colorClasses = getColorClasses(escrowType.color, escrowType.recommended)
            
            return (
              <div
                key={escrowType.type}
                className={`
                  relative bg-white dark:bg-slate-800 rounded-2xl p-6 
                  border-2 border-slate-200 dark:border-slate-700
                  ${colorClasses.hover}
                  hover:shadow-xl transition-all duration-200 cursor-pointer
                  transform hover:scale-[1.02]
                  ${escrowType.recommended ? colorClasses.border + ' shadow-lg' : ''}
                `}
                onClick={() => router.push(escrowType.route)}
              >
                {/* Recommended Badge */}
                {escrowType.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorClasses.badge}`}>
                      RECOMMENDED
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 ${colorClasses.bg} rounded-xl flex items-center justify-center text-white mb-4`}>
                  {escrowType.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {escrowType.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  {escrowType.description}
                </p>

                {/* Use Cases */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Perfect for:
                  </p>
                  <ul className="space-y-1">
                    {escrowType.useCases.map((useCase, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colorClasses.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {useCase}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full ${colorClasses.bg} hover:opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition-all`}
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(escrowType.route)
                  }}
                >
                  Select {escrowType.title}
                </button>
              </div>
            )
          })}
        </div>

        {/* Comparison Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Feature
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Traditional
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-purple-600 dark:text-purple-400">
                    Milestone
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-green-600 dark:text-green-400">
                    Atomic Swap
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Both parties deposit</td>
                  <td className="text-center py-3 px-4"> Yes </td>
                  <td className="text-center py-3 px-4"> No </td>
                  <td className="text-center py-3 px-4"> Yes </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Milestone-based release</td>
                  <td className="text-center py-3 px-4"> No </td>
                  <td className="text-center py-3 px-4"> Yes </td>
                  <td className="text-center py-3 px-4"> No </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Automatic swap</td>
                  <td className="text-center py-3 px-4"> No </td>
                  <td className="text-center py-3 px-4"> No </td>
                  <td className="text-center py-3 px-4"> Yes </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Dispute resolution</td>
                  <td className="text-center py-3 px-4"> Yes </td>
                  <td className="text-center py-3 px-4"> Yes </td>
                  <td className="text-center py-3 px-4"> No </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Requires confirmation</td>
                  <td className="text-center py-3 px-4"> Yes </td>
                  <td className="text-center py-3 px-4"> Yes </td>
                  <td className="text-center py-3 px-4"> No </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Best for</td>
                  <td className="text-center py-3 px-4 text-xs text-slate-500 dark:text-slate-400">P2P trades</td>
                  <td className="text-center py-3 px-4 text-xs text-slate-500 dark:text-slate-400">Freelance work</td>
                  <td className="text-center py-3 px-4 text-xs text-slate-500 dark:text-slate-400">Token swaps</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            Not sure which to choose?
          </p>
          <button
            onClick={() => router.push('/faq')}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            View FAQ →
          </button>
        </div>
      </div>
    </div>
  )
}
