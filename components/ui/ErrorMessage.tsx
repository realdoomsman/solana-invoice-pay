'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface ErrorMessageProps {
  title?: string
  message: string
  type?: 'error' | 'warning' | 'info'
  dismissible?: boolean
  onDismiss?: () => void
  action?: {
    label: string
    onClick: () => void
  }
  details?: string
  showDetails?: boolean
}

export function ErrorMessage({
  title,
  message,
  type = 'error',
  dismissible = true,
  onDismiss,
  action,
  details,
  showDetails = false
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [detailsExpanded, setDetailsExpanded] = useState(showDetails)

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss?.(), 300)
  }

  const config = {
    error: {
      bg: 'bg-red-900/20',
      border: 'border-red-800',
      icon: '!',
      iconBg: 'bg-red-500',
      text: 'text-red-400',
      title: title || 'Error'
    },
    warning: {
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-800',
      icon: '!',
      iconBg: 'bg-yellow-500',
      text: 'text-yellow-400',
      title: title || 'Warning'
    },
    info: {
      bg: 'bg-blue-900/20',
      border: 'border-blue-800',
      icon: 'i',
      iconBg: 'bg-blue-500',
      text: 'text-blue-400',
      title: title || 'Information'
    }
  }

  const style = config[type]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`${style.bg} ${style.border} border rounded-xl p-4 relative`}
        >
          <div className="flex items-start gap-3">
            <div className={`${style.iconBg} w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-sm">{style.icon}</span>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className={`${style.text} font-semibold mb-1`}>
                {style.title}
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {message}
              </p>

              {details && (
                <div className="mt-3">
                  <button
                    onClick={() => setDetailsExpanded(!detailsExpanded)}
                    className="text-xs text-slate-400 hover:text-slate-300 transition-colors flex items-center gap-1"
                  >
                    {detailsExpanded ? '▼' : '▶'} Technical Details
                  </button>
                  <AnimatePresence>
                    {detailsExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <pre className="mt-2 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-400 overflow-x-auto">
                          {details}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {action && (
                <button
                  onClick={action.onClick}
                  className={`mt-3 px-4 py-2 ${style.iconBg} hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-opacity`}
                >
                  {action.label}
                </button>
              )}
            </div>

            {dismissible && (
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-300 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ErrorBoundaryFallback({
  error,
  resetError
}: {
  error: Error
  resetError: () => void
}) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <ErrorMessage
          type="error"
          title="Something went wrong"
          message="An unexpected error occurred. Please try again."
          details={error.message}
          action={{
            label: 'Try Again',
            onClick: resetError
          }}
          dismissible={false}
        />
      </div>
    </div>
  )
}

export function InlineError({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 text-red-400 text-sm mt-1"
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span>{message}</span>
    </motion.div>
  )
}
