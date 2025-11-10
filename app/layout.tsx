import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/components/WalletProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NOVIQ - Next-Gen Crypto Payment Infrastructure',
  description: 'Enterprise-grade payment infrastructure on Solana. Lightning-fast settlements, AI-powered insights, and institutional-grade security. Built for the future of finance.',
  keywords: ['noviq', 'solana', 'crypto payments', 'payment infrastructure', 'defi', 'blockchain', 'web3', 'fintech', 'payment gateway'],
  authors: [{ name: 'NOVIQ' }],
  openGraph: {
    title: 'NOVIQ - Next-Gen Crypto Payment Infrastructure',
    description: 'Enterprise-grade payment infrastructure on Solana. Lightning-fast settlements with institutional-grade security.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOVIQ - Next-Gen Crypto Payment Infrastructure',
    description: 'Enterprise-grade payment infrastructure on Solana. Built for the future of finance.',
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
      <body className={inter.className}>
        <ErrorBoundary>
          <WalletProvider>
            {children}
          </WalletProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
