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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 6C8 4.89543 8.89543 4 10 4H18C22.4183 4 26 7.58172 26 12C26 16.4183 22.4183 20 18 20H13V26C13 27.1046 12.1046 28 11 28C9.89543 28 9 27.1046 9 26V19V6H8ZM13 16H18C20.2091 16 22 14.2091 22 12C22 9.79086 20.2091 8 18 8H13V16Z"
        fill="url(#logoGrad)"
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
