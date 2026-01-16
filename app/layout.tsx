import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from '@/components/WalletProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastProvider } from '@/components/ToastProvider'

export const metadata: Metadata = {
  title: 'PayOS - Payment Infrastructure for Solana',
  description: 'Escrow, splits, crowdfunding, and instant payments. Non-custodial, no KYC, built for Solana.',
  keywords: ['payos', 'solana', 'escrow', 'splits', 'crowdfunding', 'payments', 'p2p', 'crypto payments', 'defi'],
  authors: [{ name: 'PayOS' }],
  openGraph: {
    title: 'PayOS - Payment Infrastructure for Solana',
    description: 'Escrow, splits, crowdfunding, and instant payments. Non-custodial. No KYC.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PayOS - Payment Infrastructure for Solana',
    description: 'Escrow, splits, crowdfunding, and instant payments. Non-custodial.',
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
