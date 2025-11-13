import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }
  
  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
