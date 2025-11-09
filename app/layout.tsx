import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/components/WalletProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Solana Payment Links - Accept Crypto Payments Instantly',
  description: 'Create payment links, invoices, escrow deals, and crowdfunding campaigns on Solana. Lightning-fast settlements, minimal fees, and instant crypto payments.',
  keywords: ['solana', 'crypto payments', 'payment links', 'invoice', 'escrow', 'blockchain', 'cryptocurrency', 'accept crypto', 'solana pay'],
  authors: [{ name: 'Solana Invoice Pay' }],
  openGraph: {
    title: 'Solana Payment Links - Accept Crypto Payments Instantly',
    description: 'Create payment links, invoices, escrow deals, and crowdfunding campaigns on Solana. Lightning-fast settlements with minimal fees.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solana Payment Links - Accept Crypto Payments Instantly',
    description: 'Create payment links, invoices, escrow deals, and crowdfunding campaigns on Solana.',
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
