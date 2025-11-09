'use client'

import { useState } from 'react'
import { 
  generatePaymentDescription, 
  suggestPaymentAmount, 
  validateWalletAddress,
  recommendPaymentType 
} from '@/lib/ai'

interface AIAssistantProps {
  onSuggestion?: (data: any) => void
}

export default function AIAssistant({ onSuggestion }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')

  const handleAsk = async () => {
    if (!input.trim()) return

    setLoading(true)
    setResponse('')

    try {
      // Detect what the user is asking for
      const inputLower = input.toLowerCase()

      if (inputLower.includes('description') || inputLower.includes('what should i write')) {
        const result = await generatePaymentDescription(0.1, 'SOL', input)
        if (result.success) {
          setResponse(`💡 Suggested description: "${result.data}"`)
          onSuggestion?.({ type: 'description', value: result.data })
        }
      } else if (inputLower.includes('amount') || inputLower.includes('how much')) {
        const result = await suggestPaymentAmount(input)
        if (result.success) {
          setResponse(`💰 ${result.data.reasoning}`)
          onSuggestion?.({ type: 'amount', value: result.data.amount })
        }
      } else if (inputLower.includes('wallet') || inputLower.includes('address')) {
        // Extract potential wallet address from input
        const words = input.split(' ')
        const potentialAddress = words.find(w => w.length > 30)
        if (potentialAddress) {
          const result = await validateWalletAddress(potentialAddress)
          if (result.success && result.data) {
            if (result.data.valid) {
              setResponse('✅ Wallet address looks valid!')
            } else {
              setResponse(`⚠️ Issues found: ${result.data.issues.join(', ')}`)
            }
          }
        } else {
          setResponse('Please provide a wallet address to validate')
        }
      } else if (inputLower.includes('type') || inputLower.includes('which payment')) {
        const result = await recommendPaymentType(0.1, input)
        if (result.success && result.data) {
          const top = result.data[0]
          setResponse(`🎯 Recommended: ${top.type.toUpperCase()} payment - ${top.reason}`)
          onSuggestion?.({ type: 'paymentType', value: top.type })
        }
      } else {
        // General help
        setResponse(`I can help you with:
• Generate payment descriptions
• Suggest payment amounts
• Validate wallet addresses
• Recommend payment types

Try asking: "What amount for a consultation?" or "Generate description for freelance work"`)
      }
    } catch (error) {
      setResponse('Sorry, I encountered an error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* AI Assistant Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50 flex items-center justify-center"
        title="AI Assistant"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>

      {/* AI Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="font-semibold">AI Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded p-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Quick Actions */}
            <div className="mb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setInput('Generate description for consulting service')}
                  className="text-xs px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                >
                  Generate description
                </button>
                <button
                  onClick={() => setInput('What amount for freelance work?')}
                  className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Suggest amount
                </button>
                <button
                  onClick={() => setInput('Which payment type should I use?')}
                  className="text-xs px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  Recommend type
                </button>
              </div>
            </div>

            {/* Response */}
            {response && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {response}
                </p>
              </div>
            )}

            {/* Input */}
            <div className="space-y-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your payment..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAsk()
                  }
                }}
              />
              <button
                onClick={handleAsk}
                disabled={loading || !input.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Thinking...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Ask AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              AI-powered assistance for smarter payments
            </p>
          </div>
        </div>
      )}
    </>
  )
}
