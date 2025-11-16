'use client'

import { motion } from 'framer-motion'
import { Skeleton } from './Skeleton'

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'pulse' | 'dots'
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export function LoadingState({ 
  variant = 'spinner', 
  size = 'md',
  text,
  fullScreen = false 
}: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {variant === 'spinner' && <LoadingSpinner size={size} />}
      {variant === 'dots' && <LoadingDots size={size} />}
      {variant === 'pulse' && <LoadingPulse size={size} />}
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-slate-400 text-sm"
        >
          {text}
        </motion.p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return content
}

function LoadingSpinner({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  }

  return (
    <motion.div
      className={`${sizes[size]} border-slate-700 border-t-blue-500 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  )
}

function LoadingDots({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizes[size]} bg-blue-500 rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  )
}

function LoadingPulse({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  }

  return (
    <div className="relative">
      <motion.div
        className={`${sizes[size]} bg-blue-500/20 rounded-full absolute inset-0`}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />
      <motion.div
        className={`${sizes[size]} bg-blue-500/40 rounded-full`}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />
    </div>
  )
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>

        {/* Card skeleton */}
        <div className="bg-slate-900 rounded-xl p-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="bg-slate-900 rounded-xl p-6 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-4/6" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ButtonLoadingState({ text = 'Loading...' }: { text?: string }) {
  return (
    <span className="flex items-center gap-2">
      <motion.span
        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text}
    </span>
  )
}
