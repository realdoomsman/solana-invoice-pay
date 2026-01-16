import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from '@/components/WalletProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/ToastProvider'

export const metadata: Metadata = {
  title: 'PAYDOS - Retro Payment Infrastructure for Solana',
  description: 'OTC escrow, group buys, profit splits, and instant SOL payments. Non-custodial, no KYC, built for Solana traders. Windows 95 vibes.',
  keywords: ['paydos', 'solana', 'otc', 'escrow', 'group buy', 'memecoin', 'trading', 'p2p', 'crypto payments', 'defi', 'retro', 'windows 95'],
  authors: [{ name: 'PAYDOS' }],
  openGraph: {
    title: 'PAYDOS - Retro Payment Infrastructure for Solana',
    description: 'OTC escrow, group buys, and instant payments. Non-custodial. No KYC. Built for degens. Windows 95 aesthetic.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PAYDOS - Payment Links for Solana',
    description: 'OTC trades, group buys, profit splits. Non-custodial. Retro Windows 95 vibes.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <WalletProvider>
            {children}
            <ToastProvider />
          </WalletProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
