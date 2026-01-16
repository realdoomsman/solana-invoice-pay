'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Icons
const Icons = {
    escrow: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
    ),
    splits: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
    ),
    goals: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6"></circle>
            <circle cx="12" cy="12" r="2"></circle>
        </svg>
    ),
    payments: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
    ),
}

function Window({
    title,
    children,
    className = '',
}: {
    title: string
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`pd-window ${className}`}>
            <div className="pd-titlebar">
                <div className="pd-controls">
                    <span className="pd-control pd-control-close"></span>
                    <span className="pd-control pd-control-min"></span>
                    <span className="pd-control pd-control-max"></span>
                </div>
                <span className="pd-titlebar-title">{title}</span>
                <div style={{ width: '54px' }}></div>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    )
}

export default function WhitepaperPage() {
    return (
        <div className="min-h-screen" style={{ background: 'var(--pd-bg)' }}>
            <Header />

            <main className="pt-14 px-4 pb-16">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="py-12 md:py-16 text-center">
                        <span className="pd-badge pd-badge-success mb-4 inline-block">Documentation</span>
                        <h1 className="text-3xl md:text-5xl font-bold mb-4">PAYDOS Whitepaper</h1>
                        <p className="text-lg" style={{ color: 'var(--pd-text-muted)' }}>
                            Technical documentation and protocol overview
                        </p>
                    </div>

                    {/* Table of Contents */}
                    <Window title="Table of Contents" className="mb-6">
                        <nav className="space-y-2">
                            <a href="#overview" className="block pd-button-ghost text-left">1. Overview</a>
                            <a href="#architecture" className="block pd-button-ghost text-left">2. Architecture</a>
                            <a href="#products" className="block pd-button-ghost text-left">3. Products</a>
                            <a href="#security" className="block pd-button-ghost text-left">4. Security</a>
                            <a href="#fees" className="block pd-button-ghost text-left">5. Fee Structure</a>
                            <a href="#roadmap" className="block pd-button-ghost text-left">6. Roadmap</a>
                        </nav>
                    </Window>

                    {/* Overview */}
                    <Window title="1. Overview" className="mb-6" id="overview">
                        <div className="prose prose-invert max-w-none">
                            <h3 className="text-xl font-semibold mb-4">What is PAYDOS?</h3>
                            <p className="mb-4" style={{ color: 'var(--pd-text-muted)' }}>
                                PAYDOS is a payment infrastructure protocol built on Solana. It provides a suite of
                                tools for creating payment links, escrow transactions, revenue splits, and crowdfunding
                                campaigns - all without requiring users to give up custody of their funds.
                            </p>

                            <h4 className="text-lg font-semibold mb-3 mt-6">Core Principles</h4>
                            <ul className="space-y-2" style={{ color: 'var(--pd-text-muted)' }}>
                                <li className="flex items-start gap-3">
                                    <span style={{ color: 'var(--pd-accent)' }}>→</span>
                                    <span><strong className="text-[var(--pd-text)]">Non-Custodial:</strong> Users maintain control of their funds at all times. PAYDOS never holds or has access to user funds.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span style={{ color: 'var(--pd-accent)' }}>→</span>
                                    <span><strong className="text-[var(--pd-text)]">Trustless:</strong> Smart contract logic ensures fair execution without requiring trust between parties.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span style={{ color: 'var(--pd-accent)' }}>→</span>
                                    <span><strong className="text-[var(--pd-text)]">Instant:</strong> Leveraging Solana's sub-second finality for immediate transaction confirmation.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span style={{ color: 'var(--pd-accent)' }}>→</span>
                                    <span><strong className="text-[var(--pd-text)]">Low Cost:</strong> Transaction fees averaging $0.0003 make micropayments viable.</span>
                                </li>
                            </ul>
                        </div>
                    </Window>

                    {/* Architecture */}
                    <Window title="2. Architecture" className="mb-6" id="architecture">
                        <div className="prose prose-invert max-w-none">
                            <h3 className="text-xl font-semibold mb-4">Technical Stack</h3>

                            <div className="pd-code mb-6">
                                <pre className="text-sm">
                                    {`┌─────────────────────────────────────────────────┐
│                   PAYDOS                         │
├─────────────────────────────────────────────────┤
│  Frontend     │  Next.js + React                │
│  Blockchain   │  Solana Mainnet                 │
│  Wallet       │  Wallet Adapter (Phantom, etc)  │
│  Database     │  Supabase (PostgreSQL)          │
│  Hosting      │  Vercel Edge Network            │
└─────────────────────────────────────────────────┘`}
                                </pre>
                            </div>

                            <h4 className="text-lg font-semibold mb-3">Transaction Flow</h4>
                            <ol className="space-y-3" style={{ color: 'var(--pd-text-muted)' }}>
                                <li className="flex items-start gap-3">
                                    <span className="mono text-sm" style={{ color: 'var(--pd-accent)' }}>01</span>
                                    <span>User creates a payment request through the PAYDOS interface</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mono text-sm" style={{ color: 'var(--pd-accent)' }}>02</span>
                                    <span>A unique payment wallet is generated for the transaction</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mono text-sm" style={{ color: 'var(--pd-accent)' }}>03</span>
                                    <span>Payer sends funds to the payment wallet via standard Solana transfer</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mono text-sm" style={{ color: 'var(--pd-accent)' }}>04</span>
                                    <span>PAYDOS monitors for incoming transactions and triggers forwarding</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mono text-sm" style={{ color: 'var(--pd-accent)' }}>05</span>
                                    <span>Funds are automatically forwarded to the recipient wallet</span>
                                </li>
                            </ol>
                        </div>
                    </Window>

                    {/* Products */}
                    <Window title="3. Products" className="mb-6" id="products">
                        <div className="space-y-6">
                            {/* Escrow */}
                            <div className="pd-card">
                                <div className="flex items-start gap-4">
                                    <div className="pd-app-icon" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                                        <div style={{ color: 'var(--pd-blue)' }}><Icons.escrow /></div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Escrow</h4>
                                        <p className="text-sm mb-3" style={{ color: 'var(--pd-text-muted)' }}>
                                            Trustless P2P transactions where both parties deposit funds into a smart contract.
                                            Funds are released only when both parties confirm the transaction is complete.
                                            Includes timeout protection and dispute resolution mechanisms.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="pd-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--pd-blue)' }}>Mutual Confirmation</span>
                                            <span className="pd-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--pd-blue)' }}>Timeout Protection</span>
                                            <span className="pd-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--pd-blue)' }}>Dispute Resolution</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Splits */}
                            <div className="pd-card">
                                <div className="flex items-start gap-4">
                                    <div className="pd-app-icon" style={{ background: 'rgba(168, 85, 247, 0.2)' }}>
                                        <div style={{ color: 'var(--pd-purple)' }}><Icons.splits /></div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Splits</h4>
                                        <p className="text-sm mb-3" style={{ color: 'var(--pd-text-muted)' }}>
                                            Automatic revenue distribution to multiple recipients. Define percentage allocations
                                            for each recipient. Incoming payments are instantly split and forwarded to all
                                            parties according to their share.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="pd-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--pd-purple)' }}>Auto Distribution</span>
                                            <span className="pd-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--pd-purple)' }}>Custom Percentages</span>
                                            <span className="pd-badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--pd-purple)' }}>Multi-Recipient</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Goals */}
                            <div className="pd-card">
                                <div className="flex items-start gap-4">
                                    <div className="pd-app-icon" style={{ background: 'rgba(34, 197, 94, 0.2)' }}>
                                        <div style={{ color: 'var(--pd-green)' }}><Icons.goals /></div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Goals (Crowdfunding)</h4>
                                        <p className="text-sm mb-3" style={{ color: 'var(--pd-text-muted)' }}>
                                            Collective fundraising with full transparency. Set a target amount and deadline.
                                            Real-time progress tracking for contributors. Automatic refunds if the goal is
                                            not reached by the deadline.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="pd-badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--pd-green)' }}>Target Goals</span>
                                            <span className="pd-badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--pd-green)' }}>Auto Refunds</span>
                                            <span className="pd-badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--pd-green)' }}>Progress Tracking</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payments */}
                            <div className="pd-card">
                                <div className="flex items-start gap-4">
                                    <div className="pd-app-icon" style={{ background: 'rgba(249, 115, 22, 0.2)' }}>
                                        <div style={{ color: 'var(--pd-orange)' }}><Icons.payments /></div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Payment Links</h4>
                                        <p className="text-sm mb-3" style={{ color: 'var(--pd-text-muted)' }}>
                                            Simple, shareable payment links. Generate a unique URL and QR code for any amount.
                                            Share via email, message, or social media. Funds are auto-forwarded to your wallet
                                            upon receipt.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="pd-badge" style={{ background: 'rgba(249, 115, 22, 0.15)', color: 'var(--pd-orange)' }}>QR Codes</span>
                                            <span className="pd-badge" style={{ background: 'rgba(249, 115, 22, 0.15)', color: 'var(--pd-orange)' }}>Auto Forward</span>
                                            <span className="pd-badge" style={{ background: 'rgba(249, 115, 22, 0.15)', color: 'var(--pd-orange)' }}>Multi-Token</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Window>

                    {/* Security */}
                    <Window title="4. Security" className="mb-6" id="security">
                        <div className="prose prose-invert max-w-none">
                            <h3 className="text-xl font-semibold mb-4">Security Model</h3>

                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                <div className="pd-card">
                                    <h4 className="font-semibold mb-2">Non-Custodial Design</h4>
                                    <p className="text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                                        PAYDOS never has access to user private keys. All transactions are signed
                                        locally in the user's wallet.
                                    </p>
                                </div>
                                <div className="pd-card">
                                    <h4 className="font-semibold mb-2">Encrypted Storage</h4>
                                    <p className="text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                                        Sensitive data is encrypted at rest and in transit using industry-standard
                                        encryption protocols.
                                    </p>
                                </div>
                                <div className="pd-card">
                                    <h4 className="font-semibold mb-2">Open Source</h4>
                                    <p className="text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                                        Core protocol code is open source and available for audit by the community.
                                    </p>
                                </div>
                                <div className="pd-card">
                                    <h4 className="font-semibold mb-2">Timeout Protection</h4>
                                    <p className="text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                                        Escrow transactions include automatic timeout refunds to prevent funds
                                        from being locked indefinitely.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Window>

                    {/* Fees */}
                    <Window title="5. Fee Structure" className="mb-6" id="fees">
                        <div className="prose prose-invert max-w-none">
                            <h3 className="text-xl font-semibold mb-4">Transparent Pricing</h3>

                            <div className="pd-code mb-6">
                                <pre className="text-sm">
                                    {`Fee Structure
─────────────────────────────────────
Payment Links      │  1.0% of amount
Escrow             │  1.0% of amount
Splits             │  1.0% of amount  
Goals              │  2.0% of amount
─────────────────────────────────────
Solana Network Fee │  ~$0.0003 per tx
─────────────────────────────────────`}
                                </pre>
                            </div>

                            <p style={{ color: 'var(--pd-text-muted)' }}>
                                Fees are deducted automatically from the transaction amount. No hidden charges
                                or monthly subscriptions. You only pay when you use the service.
                            </p>
                        </div>
                    </Window>

                    {/* Roadmap */}
                    <Window title="6. Roadmap" className="mb-6" id="roadmap">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-3 h-3 rounded-full mt-1.5" style={{ background: 'var(--pd-success)' }}></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold">Q1 2025</span>
                                        <span className="pd-badge pd-badge-success">Complete</span>
                                    </div>
                                    <p className="text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                                        Payment links, escrow, splits, and crowdfunding MVP launch
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-3 h-3 rounded-full mt-1.5" style={{ background: 'var(--pd-warning)' }}></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold">Q2 2025</span>
                                        <span className="pd-badge pd-badge-warning">In Progress</span>
                                    </div>
                                    <p className="text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                                        API access, webhooks, merchant integrations, mobile app
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-3 h-3 rounded-full mt-1.5" style={{ background: 'var(--pd-text-dim)' }}></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold">Q3 2025</span>
                                    </div>
                                    <p className="text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                                        Multi-chain expansion, fiat on/off ramps, enterprise features
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-3 h-3 rounded-full mt-1.5" style={{ background: 'var(--pd-text-dim)' }}></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold">Q4 2025</span>
                                    </div>
                                    <p className="text-sm" style={{ color: 'var(--pd-text-muted)' }}>
                                        DAO governance, protocol token, advanced analytics
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Window>

                </div>
            </main>

            <Footer />
        </div>
    )
}
