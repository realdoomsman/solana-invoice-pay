'use client'

import { motion } from 'framer-motion'

interface ProgressIndicatorProps {
  current: number
  total: number
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'bar' | 'circle' | 'steps'
}

export function ProgressIndicator({
  current,
  total,
  label,
  showPercentage = true,
  size = 'md',
  variant = 'bar'
}: ProgressIndicatorProps) {
  const percentage = Math.min(100, Math.round((current / total) * 100))

  if (variant === 'circle') {
    return <CircularProgress percentage={percentage} size={size} label={label} />
  }

  if (variant === 'steps') {
    return <StepsProgress current={current} total={total} />
  }

  return <BarProgress percentage={percentage} size={size} label={label} showPercentage={showPercentage} />
}

function BarProgress({ 
  percentage, 
  size, 
  label, 
  showPercentage 
}: { 
  percentage: number
  size: 'sm' | 'md' | 'lg'
  label?: string
  showPercentage: boolean
}) {
  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm text-slate-400">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-semibold text-slate-300">{percentage}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-700 rounded-full overflow-hidden ${heights[size]}`}>
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function CircularProgress({ 
  percentage, 
  size, 
  label 
}: { 
  percentage: number
  size: 'sm' | 'md' | 'lg'
  label?: string
}) {
  const sizes = {
    sm: { width: 60, stroke: 4 },
    md: { width: 80, stroke: 6 },
    lg: { width: 120, stroke: 8 },
  }

  const { width, stroke } = sizes[size]
  const radius = (width - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width, height: width }}>
        <svg width={width} height={width} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            className="text-slate-700"
          />
          {/* Progress circle */}
          <motion.circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            stroke="url(#gradient)"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
            }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold" style={{ fontSize: width / 4 }}>
            {percentage}%
          </span>
        </div>
      </div>
      {label && <span className="text-sm text-slate-400">{label}</span>}
    </div>
  )
}

function StepsProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ 
              scale: step <= current ? 1 : 0.8,
              backgroundColor: step <= current ? '#3b82f6' : '#334155'
            }}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              font-semibold text-sm
              ${step <= current ? 'text-white' : 'text-slate-500'}
            `}
          >
            {step < current ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              step
            )}
          </motion.div>
          {step < total && (
            <motion.div
              className="w-12 h-1 mx-1"
              initial={{ backgroundColor: '#334155' }}
              animate={{ 
                backgroundColor: step < current ? '#3b82f6' : '#334155'
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export function MiniProgress({ percentage }: { percentage: number }) {
  return (
    <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-blue-500"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
}
