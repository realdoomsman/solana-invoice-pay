'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'What is NOVIQ?',
    answer: 'NOVIQ is a payment platform for Solana that enables secure P2P trading through escrow, automated payment splits, and crowdfunding goals. Non-custodial, no KYC, instant settlements.',
  },
  {
    category: 'Getting Started',
    question: 'Do I need a Solana wallet?',
    answer: 'Yes, you need a Solana wallet address to receive payments. Popular options include Phantom, Solflare, and Backpack. Your customers will also need a wallet to send payments.',
  },
  {
    category: 'Getting Started',
    question: 'How do I create my first payment link?',
    answer: 'Simply enter your wallet address, the amount you want to charge, and an optional description. Click "Create Payment Link" and share the generated link with your customer.',
  },
  {
    category: 'Payments',
    question: 'How long do payments take to confirm?',
    answer: 'Solana transactions typically confirm in under 1 second. Once confirmed, funds are automatically forwarded to your merchant wallet.',
  },
  {
    category: 'Payments',
    question: 'What tokens are supported?',
    answer: 'Currently, SOL (Solana native token) is fully supported. USDC and USDT support is coming soon.',
  },
  {
    category: 'Payments',
    question: 'Can I accept multiple payments to the same link?',
    answer: 'Each payment link is designed for a single transaction. For recurring payments or multiple transactions, create separate links or use our goal-based payment feature.',
  },
  {
    category: 'Fees',
    question: 'What are the fees?',
    answer: 'NOVIQ charges 1% on successful transactions only. Solana network fees are around $0.00025 per transaction. Creating escrows, splits, and goals is free.',
  },
  {
    category: 'Fees',
    question: 'Who pays the transaction fees?',
    answer: 'The sender (your customer) pays the Solana network fee when sending the payment. The platform fee is deducted from the payment amount before forwarding to your wallet.',
  },
  {
    category: 'Security',
    question: 'Is my money safe?',
    answer: 'Yes! NOVIQ is non-custodial - we never hold your funds. Everything is transparent on the Solana blockchain. Escrow funds are locked until both parties confirm.',
  },
  {
    category: 'Security',
    question: 'What happens if I lose my payment link?',
    answer: 'If you\'re logged in, all your payment links are saved in your dashboard. If you created a link without logging in, make sure to save the URL. You can also track payments using the payment ID.',
  },
  {
    category: 'Security',
    question: 'Can payments be reversed?',
    answer: 'No. Blockchain transactions are irreversible once confirmed. This is why we recommend using escrow for high-value transactions where you need buyer protection.',
  },
  {
    category: 'Advanced Features',
    question: 'What is Split Payment?',
    answer: 'Split Payment allows you to divide a single payment among multiple recipients. Perfect for partnerships, revenue sharing, or team payments. Each recipient gets their share automatically.',
  },
  {
    category: 'Advanced Features',
    question: 'How does Escrow work?',
    answer: 'Escrow holds funds until specific conditions are met. The buyer sends payment, funds are held securely, and released to the seller once milestones are completed. Great for freelance work and high-value transactions.',
  },
  {
    category: 'Advanced Features',
    question: 'What are Goal-based payments?',
    answer: 'Goal-based payments are perfect for crowdfunding. Set a target amount, share the link, and track progress as multiple people contribute. Once the goal is reached, funds are released.',
  },
  {
    category: 'Technical',
    question: 'Do you store my private keys?',
    answer: 'No! We never store your merchant wallet private keys. Temporary payment wallets are created for each transaction, and their keys are encrypted and only used for auto-forwarding.',
  },
  {
    category: 'Technical',
    question: 'What network does this use?',
    answer: 'We use Solana mainnet for production transactions. Solana offers fast confirmations (under 1 second) and extremely low fees (around $0.00025 per transaction).',
  },
  {
    category: 'Technical',
    question: 'Can I integrate this into my website?',
    answer: 'Yes! You can embed payment links in your website, share them via email, or use them in your app. We\'re working on API access for deeper integrations.',
  },
  {
    category: 'Support',
    question: 'What if a payment fails?',
    answer: 'If a payment fails, the funds remain in the sender\'s wallet. Common reasons include insufficient balance, network issues, or incorrect wallet addresses. The sender can retry the transaction.',
  },
  {
    category: 'Support',
    question: 'How do I track my payments?',
    answer: 'Log in and visit your dashboard to see all payment links, their status, and transaction history. You can also verify transactions on Solana blockchain explorers like Solscan.',
  },
  {
    category: 'Support',
    question: 'How can I get help?',
    answer: 'For support, check our documentation, visit our GitHub repository, or contact us through the links in the footer. We\'re here to help!',
  },
]

const categories = Array.from(new Set(faqs.map((faq) => faq.category)))

export default function FAQPage() {
  const router = useRouter()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const filteredFaqs =
    selectedCategory === 'All'
      ? faqs
      : faqs.filter((faq) => faq.category === selectedCategory)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => router.push('/')}
            className="mb-6 text-blue-200 hover:text-white flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-5xl font-black mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-blue-100">
            Everything you need to know about NOVIQ
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === 'All'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                    {faq.category}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {faq.question}
                  </h3>
                </div>
                <svg
                  className={`w-5 h-5 text-slate-500 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-slate-600 dark:text-slate-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still have questions? */}
        <div className="mt-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Still have questions?</h2>
          <p className="text-blue-100 mb-6">
            Can't find what you're looking for? We're here to help!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Get Started
            </button>
            <a
              href="https://github.com/realdoomsman/solana-invoice-pay"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/30"
            >
              View Documentation
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
