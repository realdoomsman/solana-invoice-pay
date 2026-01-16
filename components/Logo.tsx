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
      {/* Option 3: Nodes Design */}
      <circle cx="16" cy="16" r="5" fill="url(#logoGrad)" />
      <circle cx="26" cy="10" r="2.5" fill="url(#logoGrad)" opacity="0.6" />
      <circle cx="6" cy="22" r="2.5" fill="url(#logoGrad)" opacity="0.6" />
      <path
        d="M16 16L26 10M16 16L6 22"
        stroke="url(#logoGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
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
