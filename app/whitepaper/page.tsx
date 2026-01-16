'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Icons
const Icons = {
    lock: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
    ),
    chart: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
    ),
    target: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6"></circle>
            <circle cx="12" cy="12" r="2"></circle>
        </svg>
    ),
    card: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
    ),
    arrow: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
    ),
}

function Window({
    title,
    children,
    className = '',
    id,
}: {
    title: string
    children: React.ReactNode
    className?: string
    id?: string
}) {
    return (
        <div className={`sys-window ${className}`} id={id}>
            <div className="sys-titlebar">
                <div className="sys-controls">
                    <span className="sys-control sys-control-close"></span>
                    <span className="sys-control sys-control-minimize"></span>
                    <span className="sys-control sys-control-maximize"></span>
                </div>
                <span className="sys-titlebar-text">{title}</span>
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
        <div className="min-h-screen" style={{ background: 'var(--sys-bg)' }}>
            <Header />

            <main className="pt-7 px-4 pb-16">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="py-12 md:py-16 text-center">
                        <span className="sys-badge sys-badge-success mb-4 inline-block">Documentation</span>
                        <h1 className="text-2xl md:text-4xl font-bold mb-3">PAYDOS Whitepaper</h1>
                        <p className="text-sm" style={{ color: 'var(--sys-text-secondary)' }}>
                            Technical documentation and protocol overview
                        </p>
                    </div>

                    {/* Table of Contents */}
                    <Window title="Contents" className="mb-4">
                        <nav className="space-y-1">
                            <a href="#overview" className="sys-button-ghost text-left w-full flex items-center gap-2">
                                <span style={{ color: 'var(--sys-text-tertiary)' }}>01</span>
                                <span>Overview</span>
                            </a>
                            <a href="#architecture" className="sys-button-ghost text-left w-full flex items-center gap-2">
                                <span style={{ color: 'var(--sys-text-tertiary)' }}>02</span>
                                <span>Architecture</span>
                            </a>
                            <a href="#products" className="sys-button-ghost text-left w-full flex items-center gap-2">
                                <span style={{ color: 'var(--sys-text-tertiary)' }}>03</span>
                                <span>Products</span>
                            </a>
                            <a href="#security" className="sys-button-ghost text-left w-full flex items-center gap-2">
                                <span style={{ color: 'var(--sys-text-tertiary)' }}>04</span>
                                <span>Security</span>
                            </a>
                            <a href="#fees" className="sys-button-ghost text-left w-full flex items-center gap-2">
                                <span style={{ color: 'var(--sys-text-tertiary)' }}>05</span>
                                <span>Fee Structure</span>
                            </a>
                            <a href="#roadmap" className="sys-button-ghost text-left w-full flex items-center gap-2">
                                <span style={{ color: 'var(--sys-text-tertiary)' }}>06</span>
                                <span>Roadmap</span>
                            </a>
                        </nav>
                    </Window>

                    {/* Overview */}
                    <Window title="01 — Overview" className="mb-4" id="overview">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">What is PAYDOS?</h3>
                            <p className="text-sm mb-6" style={{ color: 'var(--sys-text-secondary)' }}>
                                PAYDOS is a payment infrastructure protocol built on Solana. It provides a suite of
                                tools for creating payment links, escrow transactions, revenue splits, and crowdfunding
                                campaigns — all without requiring users to give up custody of their funds.
                            </p>

                            <h4 className="text-sm font-semibold mb-3">Core Principles</h4>
                            <ul className="space-y-3 text-sm" style={{ color: 'var(--sys-text-secondary)' }}>
                                <li className="flex items-start gap-3">
                                    <span style={{ color: 'var(--sys-accent)' }}><Icons.arrow /></span>
                                    <span><strong className="text-[var(--sys-text)]">Non-Custodial:</strong> Users maintain control of their funds at all times.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span style={{ color: 'var(--sys-accent)' }}><Icons.arrow /></span>
                                    <span><strong className="text-[var(--sys-text)]">Trustless:</strong> Smart contract logic ensures fair execution without trust.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span style={{ color: 'var(--sys-accent)' }}><Icons.arrow /></span>
                                    <span><strong className="text-[var(--sys-text)]">Instant:</strong> Sub-second finality on Solana.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span style={{ color: 'var(--sys-accent)' }}><Icons.arrow /></span>
                                    <span><strong className="text-[var(--sys-text)]">Low Cost:</strong> Transaction fees averaging $0.0003.</span>
                                </li>
                            </ul>
                        </div>
                    </Window>

                    {/* Architecture */}
                    <Window title="02 — Architecture" className="mb-4" id="architecture">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Technical Stack</h3>

                            <div className="p-4 rounded-lg mb-6 mono text-xs overflow-x-auto" style={{ background: 'var(--sys-bg)' }}>
                                <pre>
                                    {`PAYDOS ARCHITECTURE
├── Frontend      Next.js + React
├── Blockchain    Solana Mainnet
├── Wallet        Wallet Adapter
├── Database      Supabase (PostgreSQL)
└── Hosting       Vercel Edge Network`}
                                </pre>
                            </div>

                            <h4 className="text-sm font-semibold mb-3">Transaction Flow</h4>
                            <ol className="space-y-2 text-sm" style={{ color: 'var(--sys-text-secondary)' }}>
                                <li className="flex items-start gap-3">
                                    <span className="mono text-xs" style={{ color: 'var(--sys-accent)' }}>01</span>
                                    <span>User creates a payment request through the interface</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mono text-xs" style={{ color: 'var(--sys-accent)' }}>02</span>
                                    <span>A unique payment wallet is generated</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mono text-xs" style={{ color: 'var(--sys-accent)' }}>03</span>
                                    <span>Payer sends funds via standard Solana transfer</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mono text-xs" style={{ color: 'var(--sys-accent)' }}>04</span>
                                    <span>System monitors for incoming transactions</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mono text-xs" style={{ color: 'var(--sys-accent)' }}>05</span>
                                    <span>Funds are automatically forwarded to recipient</span>
                                </li>
                            </ol>
                        </div>
                    </Window>

                    {/* Products */}
                    <Window title="03 — Products" className="mb-4" id="products">
                        <div className="space-y-4">
                            {/* Escrow */}
                            <div className="sys-card">
                                <div className="sys-card-body">
                                    <div className="flex items-start gap-4">
                                        <div className="sys-icon" style={{ background: '#3b82f6' }}>
                                            <div style={{ color: 'white' }}><Icons.lock /></div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2">Escrow</h4>
                                            <p className="text-xs mb-3" style={{ color: 'var(--sys-text-secondary)' }}>
                                                Trustless P2P transactions where both parties deposit funds into a smart contract.
                                                Funds are released only when both parties confirm completion.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="sys-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>Mutual Confirmation</span>
                                                <span className="sys-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>Timeout Protection</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Splits */}
                            <div className="sys-card">
                                <div className="sys-card-body">
                                    <div className="flex items-start gap-4">
                                        <div className="sys-icon" style={{ background: '#8b5cf6' }}>
                                            <div style={{ color: 'white' }}><Icons.chart /></div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2">Splits</h4>
                                            <p className="text-xs mb-3" style={{ color: 'var(--sys-text-secondary)' }}>
                                                Automatic revenue distribution to multiple recipients. Define percentage allocations.
                                                Incoming payments are instantly split and forwarded.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="sys-badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>Auto Distribution</span>
                                                <span className="sys-badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>Multi-Recipient</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Goals */}
                            <div className="sys-card">
                                <div className="sys-card-body">
                                    <div className="flex items-start gap-4">
                                        <div className="sys-icon" style={{ background: '#22c55e' }}>
                                            <div style={{ color: 'white' }}><Icons.target /></div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2">Goals</h4>
                                            <p className="text-xs mb-3" style={{ color: 'var(--sys-text-secondary)' }}>
                                                Crowdfunding with full transparency. Set a target amount and deadline.
                                                Automatic refunds if the goal is not reached.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="sys-badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>Target Goals</span>
                                                <span className="sys-badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>Auto Refunds</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payments */}
                            <div className="sys-card">
                                <div className="sys-card-body">
                                    <div className="flex items-start gap-4">
                                        <div className="sys-icon" style={{ background: '#f97316' }}>
                                            <div style={{ color: 'white' }}><Icons.card /></div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm mb-2">Payment Links</h4>
                                            <p className="text-xs mb-3" style={{ color: 'var(--sys-text-secondary)' }}>
                                                Simple, shareable payment links. Generate a unique URL and QR code.
                                                Funds auto-forward to your wallet upon receipt.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="sys-badge" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>QR Codes</span>
                                                <span className="sys-badge" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>Auto Forward</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Window>

                    {/* Security */}
                    <Window title="04 — Security" className="mb-4" id="security">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Security Model</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="sys-card">
                                    <div className="sys-card-body">
                                        <h4 className="font-semibold text-sm mb-2">Non-Custodial Design</h4>
                                        <p className="text-xs" style={{ color: 'var(--sys-text-secondary)' }}>
                                            PAYDOS never has access to user private keys. All transactions are signed
                                            locally in the user's wallet.
                                        </p>
                                    </div>
                                </div>
                                <div className="sys-card">
                                    <div className="sys-card-body">
                                        <h4 className="font-semibold text-sm mb-2">Encrypted Storage</h4>
                                        <p className="text-xs" style={{ color: 'var(--sys-text-secondary)' }}>
                                            Sensitive data is encrypted at rest and in transit using industry-standard
                                            encryption protocols.
                                        </p>
                                    </div>
                                </div>
                                <div className="sys-card">
                                    <div className="sys-card-body">
                                        <h4 className="font-semibold text-sm mb-2">Open Source</h4>
                                        <p className="text-xs" style={{ color: 'var(--sys-text-secondary)' }}>
                                            Core protocol code is open source and available for community audit.
                                        </p>
                                    </div>
                                </div>
                                <div className="sys-card">
                                    <div className="sys-card-body">
                                        <h4 className="font-semibold text-sm mb-2">Timeout Protection</h4>
                                        <p className="text-xs" style={{ color: 'var(--sys-text-secondary)' }}>
                                            Escrow transactions include automatic timeout refunds.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Window>

                    {/* Fees */}
                    <Window title="05 — Fee Structure" className="mb-4" id="fees">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Transparent Pricing</h3>

                            <div className="p-4 rounded-lg mb-4 mono text-xs" style={{ background: 'var(--sys-bg)' }}>
                                <pre>
                                    {`FEE STRUCTURE
──────────────────────────────
Payment Links      1.0%
Escrow             1.0%
Splits             1.0%  
Goals              2.0%
──────────────────────────────
Network Fee        ~$0.0003/tx`}
                                </pre>
                            </div>

                            <p className="text-sm" style={{ color: 'var(--sys-text-secondary)' }}>
                                Fees are deducted automatically from the transaction amount. No hidden charges
                                or subscriptions.
                            </p>
                        </div>
                    </Window>

                    {/* Roadmap */}
                    <Window title="06 — Roadmap" className="mb-4" id="roadmap">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: 'var(--sys-success)' }}></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm">Q1 2025</span>
                                        <span className="sys-badge sys-badge-success">Complete</span>
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--sys-text-secondary)' }}>
                                        Payment links, escrow, splits, and crowdfunding MVP
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: 'var(--sys-warning)' }}></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm">Q2 2025</span>
                                        <span className="sys-badge sys-badge-warning">In Progress</span>
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--sys-text-secondary)' }}>
                                        API access, webhooks, merchant integrations
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: 'var(--sys-text-tertiary)' }}></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm">Q3 2025</span>
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--sys-text-secondary)' }}>
                                        Multi-chain expansion, fiat on/off ramps
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: 'var(--sys-text-tertiary)' }}></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm">Q4 2025</span>
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--sys-text-secondary)' }}>
                                        DAO governance, protocol token
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
