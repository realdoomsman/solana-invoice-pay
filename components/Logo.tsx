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
          <stop offset="0%" style={{stopColor:'#00d4ff', stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:'#9945ff', stopOpacity:1}} />
        </linearGradient>
      </defs>
      <path 
        d="M 8 8 L 8 24 L 11 24 L 11 14 L 21 24 L 24 24 L 24 8 L 21 8 L 21 18 L 11 8 Z" 
        fill="url(#logoGrad)"
      />
      <circle cx="16" cy="5" r="1.5" fill="#00d4ff" opacity="0.6"/>
      <circle cx="16" cy="27" r="1.5" fill="#9945ff" opacity="0.6"/>
    </svg>
  )
}

export default function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoIcon className="h-7 w-7" />
      {showText && (
        <span className="text-xl font-semibold tracking-tight bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          PayOS
        </span>
      )}
    </div>
  )
}
