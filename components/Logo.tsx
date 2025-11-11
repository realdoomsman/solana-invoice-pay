export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 115 60"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* N */}
      <path
        d="M8 15 L8 45 L20 25 L20 45"
        stroke="url(#gradient1)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* O */}
      <circle
        cx="35"
        cy="30"
        r="11"
        stroke="url(#gradient1)"
        strokeWidth="4"
        fill="none"
      />
      
      {/* V */}
      <path
        d="M50 15 L57 45 L64 15"
        stroke="url(#gradient1)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* I */}
      <rect
        x="71"
        y="15"
        width="6"
        height="30"
        fill="url(#gradient1)"
        rx="3"
      />
      
      {/* Q */}
      <circle
        cx="89"
        cy="30"
        r="11"
        stroke="url(#gradient1)"
        strokeWidth="4"
        fill="none"
      />
      <line
        x1="95"
        y1="37"
        x2="101"
        y2="43"
        stroke="url(#gradient1)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      
      {/* Gradient Definition */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 60"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Stylized N+Q combined */}
      <circle
        cx="30"
        cy="30"
        r="24"
        stroke="url(#iconGradient)"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M20 20 L20 40 L30 28 L30 40"
        stroke="url(#iconGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="34"
        y1="34"
        x2="40"
        y2="40"
        stroke="url(#iconGradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
