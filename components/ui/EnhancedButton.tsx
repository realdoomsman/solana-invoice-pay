'use client'

import { motion } from 'framer-motion'
import { ButtonHTMLAttributes, ReactNode } from 'react'
import { ButtonLoadingState } from './LoadingState'

interface EnhancedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  loadingText?: string
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children: ReactNode
}

export function EnhancedButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: EnhancedButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-500/20',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-700',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3.5 text-lg',
  }

  const isDisabled = disabled || loading

  return (
    <motion.div
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      style={{ display: fullWidth ? 'block' : 'inline-block' }}
    >
      <button
        className={`
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          font-semibold rounded-lg
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
          ${className}
        `}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <ButtonLoadingState text={loadingText || 'Loading...'} />
        ) : (
          <>
            {icon && iconPosition === 'left' && <span>{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span>{icon}</span>}
          </>
        )}
      </button>
    </motion.div>
  )
}

export function IconButton({
  icon,
  tooltip,
  variant = 'ghost',
  size = 'md',
  ...props
}: {
  icon: ReactNode
  tooltip?: string
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300',
  }

  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ display: 'inline-block' }}
    >
      <button
        className={`
          ${variants[variant]}
          ${sizes[size]}
          rounded-lg
          flex items-center justify-center
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={tooltip}
        {...props}
      >
        {icon}
      </button>
    </motion.div>
  )
}

export function ButtonGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 flex-wrap">
      {children}
    </div>
  )
}
