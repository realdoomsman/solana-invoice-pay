'use client'

interface LogoProps {
  className?: string
  showText?: boolean
}

export function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#6366F1' }} />
          <stop offset="50%" style={{ stopColor: '#8B5CF6' }} />
          <stop offset="100%" style={{ stopColor: '#EC4899' }} />
        </linearGradient>
      </defs>
      <path
        d="M6 18C6 11.3726 11.3726 6 18 6H28"
        stroke="url(#logoGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M6 18C6 24.6274 11.3726 30 18 30H28"
        stroke="url(#logoGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="18" cy="18" r="3.5" fill="url(#logoGrad)" />
    </svg>
  )
}

export default function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoIcon className="h-7 w-7" />
      {showText && (
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          PayOS
        </span>
      )}
    </div>
  )
}
