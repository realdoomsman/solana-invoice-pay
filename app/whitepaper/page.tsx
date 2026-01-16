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
        <div className={`window ${className}`} id={id}>
            <div className="window-header">
                <div className="traffic-lights">
                    <span className="traffic-light traffic-light-red"></span>
                    <span className="traffic-light traffic-light-yellow"></span>
                    <span className="traffic-light traffic-light-green"></span>
                </div>
                <span className="window-title">{title}</span>
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
        <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
            <Header />

            <main className="pt-12 px-4 pb-16">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="py-12 md:py-16 text-center">
                        <span className="badge badge-success mb-4 inline-block">Documentation</span>
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">PayOS Whitepaper</h1>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Technical documentation and protocol overview
                        </p>
                    </div>

                    {/* Table of Contents */}
                    <Window title="Contents" className="mb-4">
                        <nav className="space-y-1">
                            {[
                                { num: '01', label: 'Overview', href: '#overview' },
                                { num: '02', label: 'Architecture', href: '#architecture' },
                                { num: '03', label: 'Products', href: '#products' },
                                { num: '04', label: 'Security', href: '#security' },
                                { num: '05', label: 'Fee Structure', href: '#fees' },
                                { num: '06', label: 'Roadmap', href: '#roadmap' },
                            ].map((item) => (
                                <a
                                    key={item.num}
                                    href={item.href}
                                    className="btn-ghost text-left w-full flex items-center gap-3 px-3 py-2 rounded-lg"
                                >
                                    <span className="mono text-xs" style={{ color: 'var(--text-subtle)' }}>{item.num}</span>
                                    <span>{item.label}</span>
                                </a>
                            ))}
                        </nav>
                    </Window>

                    {/* Overview */}
                    <Window title="01 — Overview" className="mb-4" id="overview">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">What is PayOS?</h3>
                            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                                PayOS is a payment infrastructure protocol built on Solana. It provides a suite of
                                tools for creating payment links, escrow transactions, revenue splits, and crowdfunding
                                campaigns — all without requiring users to give up custody of their funds.
                            </p>

                            <h4 className="text-sm font-semibold mb-3">Core Principles</h4>
                            <ul className="space-y-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                                <li className="flex items-start gap-3">
                                    <span style={{ color: 'var(--accent)' }}><Icons.arrow /></span>
                                    <span><strong style={{ color: 'var(--text)' }}>Non-Custodial:</strong> Users maintain control of their funds at all times.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span style={{ color: 'var(--accent)' }}><Icons.arrow /></span>
                                    <span><strong style={{ color: 'var(--text)' }}>Trustless:</strong> Smart contract logic ensures fair execution without trust.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span style={{ color: 'var(--accent)' }}><Icons.arrow /></span>
                                    <span><strong style={{ color: 'var(--text)' }}>Instant:</strong> Sub-second finality on Solana.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span style={{ color: 'var(--accent)' }}><Icons.arrow /></span>
                                    <span><strong style={{ color: 'var(--text)' }}>Low Cost:</strong> Transaction fees averaging $0.0003.</span>
                                </li>
                            </ul>
                        </div>
                    </Window>

                    {/* Architecture */}
                    <Window title="02 — Architecture" className="mb-4" id="architecture">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Technical Stack</h3>

                            <div className="p-4 rounded-xl mb-6 mono text-xs overflow-x-auto" style={{ background: 'var(--bg-base)' }}>
                                <pre>
                                    {`PayOS ARCHITECTURE
├── Frontend      Next.js + React
├── Blockchain    Solana Mainnet
├── Wallet        Wallet Adapter
├── Database      Supabase (PostgreSQL)
└── Hosting       Vercel Edge Network`}
                                </pre>
                            </div>

                            <h4 className="text-sm font-semibold mb-3">Transaction Flow</h4>
                            <ol className="space-y-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                                {[
                                    'User creates a payment request through the interface',
                                    'A unique payment wallet is generated',
                                    'Payer sends funds via standard Solana transfer',
                                    'System monitors for incoming transactions',
                                    'Funds are automatically forwarded to recipient',
                                ].map((step, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="mono text-xs font-medium" style={{ color: 'var(--accent)' }}>
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </Window>

                    {/* Products */}
                    <Window title="03 — Products" className="mb-4" id="products">
                        <div className="space-y-4">
                            {[
                                {
                                    icon: Icons.lock,
                                    color: '#3b82f6',
                                    title: 'Escrow',
                                    desc: 'Trustless P2P transactions where both parties deposit funds into a smart contract. Funds are released only when both parties confirm completion.',
                                    badges: ['Mutual Confirmation', 'Timeout Protection']
                                },
                                {
                                    icon: Icons.chart,
                                    color: '#8b5cf6',
                                    title: 'Splits',
                                    desc: 'Automatic revenue distribution to multiple recipients. Define percentage allocations. Incoming payments are instantly split and forwarded.',
                                    badges: ['Auto Distribution', 'Multi-Recipient']
                                },
                                {
                                    icon: Icons.target,
                                    color: '#22c55e',
                                    title: 'Goals',
                                    desc: 'Crowdfunding with full transparency. Set a target amount and deadline. Automatic refunds if the goal is not reached.',
                                    badges: ['Target Goals', 'Auto Refunds']
                                },
                                {
                                    icon: Icons.card,
                                    color: '#f97316',
                                    title: 'Payment Links',
                                    desc: 'Simple, shareable payment links. Generate a unique URL and QR code. Funds auto-forward to your wallet upon receipt.',
                                    badges: ['QR Codes', 'Auto Forward']
                                },
                            ].map((product, i) => (
                                <div key={i} className="card">
                                    <div className="card-body">
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: product.color }}
                                            >
                                                <div style={{ color: 'white' }}><product.icon /></div>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm mb-2">{product.title}</h4>
                                                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                                                    {product.desc}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {product.badges.map((badge, j) => (
                                                        <span
                                                            key={j}
                                                            className="badge"
                                                            style={{
                                                                background: `${product.color}20`,
                                                                color: product.color
                                                            }}
                                                        >
                                                            {badge}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Window>

                    {/* Security */}
                    <Window title="04 — Security" className="mb-4" id="security">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Security Model</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    { title: 'Non-Custodial Design', desc: 'PayOS never has access to user private keys. All transactions are signed locally.' },
                                    { title: 'Encrypted Storage', desc: 'Sensitive data is encrypted at rest and in transit using industry-standard protocols.' },
                                    { title: 'Open Source', desc: 'Core protocol code is open source and available for community audit.' },
                                    { title: 'Timeout Protection', desc: 'Escrow transactions include automatic timeout refunds.' },
                                ].map((item, i) => (
                                    <div key={i} className="card">
                                        <div className="card-body">
                                            <h4 className="font-semibold text-sm mb-2">{item.title}</h4>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Window>

                    {/* Fees */}
                    <Window title="05 — Fee Structure" className="mb-4" id="fees">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Transparent Pricing</h3>

                            <div className="p-4 rounded-xl mb-4 mono text-xs" style={{ background: 'var(--bg-base)' }}>
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

                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                Fees are deducted automatically from the transaction amount.
                                No hidden charges or subscriptions.
                            </p>
                        </div>
                    </Window>

                    {/* Roadmap */}
                    <Window title="06 — Roadmap" className="mb-4" id="roadmap">
                        <div className="space-y-4">
                            {[
                                { q: 'Q1 2026', status: 'Complete', color: 'var(--success)', desc: 'Payment links, escrow, splits, and crowdfunding MVP' },
                                { q: 'Q2 2026', status: 'In Progress', color: 'var(--warning)', desc: 'API access, webhooks, merchant integrations' },
                                { q: 'Q3 2026', status: null, color: 'var(--text-subtle)', desc: 'Multi-chain expansion, fiat on/off ramps' },
                                { q: 'Q4 2026', status: null, color: 'var(--text-subtle)', desc: 'DAO governance, protocol token' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div
                                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                        style={{ background: item.color }}
                                    ></div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-sm">{item.q}</span>
                                            {item.status && (
                                                <span
                                                    className="badge"
                                                    style={{
                                                        background: item.status === 'Complete'
                                                            ? 'rgba(34, 197, 94, 0.12)'
                                                            : 'rgba(245, 158, 11, 0.12)',
                                                        color: item.color
                                                    }}
                                                >
                                                    {item.status}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Window>

                </div>
            </main>

            <Footer />
        </div>
    )
}
