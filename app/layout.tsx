import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/components/WalletProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Header from '@/components/Header'

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NOVIQ - Payment Links for Solana Traders & Degens',
  description: 'OTC escrow, group buys, profit splits, and instant SOL payments. Non-custodial, no KYC, built for Solana traders and memecoin communities.',
  keywords: ['noviq', 'solana', 'otc', 'escrow', 'group buy', 'memecoin', 'trading', 'p2p', 'crypto payments', 'defi', 'degen'],
  authors: [{ name: 'NOVIQ' }],
  openGraph: {
    title: 'NOVIQ - Payment Links for Solana Traders',
    description: 'OTC escrow, group buys, and instant payments. Non-custodial. No KYC. Built for degens.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOVIQ - Payment Links for Solana Degens',
    description: 'OTC trades, group buys, profit splits. Non-custodial. No KYC. ⚡',
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
