import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
}

export function Card({ children, className = '', hover = false, gradient = false }: CardProps) {
  return (
    <div
      className={`
        bg-white dark:bg-slate-800 
        rounded-xl shadow-lg 
        border border-slate-200 dark:border-slate-700
        ${hover ? 'hover:shadow-xl hover:scale-[1.02] transition-all duration-200' : ''}
        ${gradient ? 'bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-6 border-b border-slate-200 dark:border-slate-700 ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-6 border-t border-slate-200 dark:border-slate-700 ${className}`}>
      {children}
    </div>
  )
}
