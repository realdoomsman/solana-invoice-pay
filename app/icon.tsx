import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#9945ff" />
            </linearGradient>
          </defs>
          <path 
            d="M 8 8 L 8 24 L 11 24 L 11 14 L 21 24 L 24 24 L 24 8 L 21 8 L 21 18 L 11 8 Z" 
            fill="url(#g)"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
