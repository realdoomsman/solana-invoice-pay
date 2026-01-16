'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EscrowEvidence } from '@/lib/escrow/types'

interface EvidenceListProps {
  escrowId?: string
  disputeId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function EvidenceList({
  escrowId,
  disputeId,
  autoRefresh = false,
  refreshInterval = 30000,
}: EvidenceListProps) {
  const [evidence, setEvidence] = useState<EscrowEvidence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchEvidence = async () => {
    try {
      const params = new URLSearchParams()
      if (escrowId) params.append('escrowId', escrowId)
      if (disputeId) params.append('disputeId', disputeId)

      const response = await fetch(`/api/escrow/evidence?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch evidence')
      }

      setEvidence(data.evidence || [])
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load evidence')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvidence()

    if (autoRefresh) {
      const interval = setInterval(fetchEvidence, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [escrowId, disputeId, autoRefresh, refreshInterval])

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'text':
        return ''
      case 'image':
        return 'IMG'
      case 'document':
        return '📄'
      case 'link':
        return 'URL'
      case 'screenshot':
        return '📸'
      default:
        return '📎'
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="danger">
        {error}
      </Alert>
    )
  }

  if (evidence.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-center">No evidence submitted yet</p>
      </Card>
    )
  }

  // Group evidence by party role
  const buyerEvidence = evidence.filter((e) => e.party_role === 'buyer')
  const sellerEvidence = evidence.filter((e) => e.party_role === 'seller')
  const adminEvidence = evidence.filter((e) => e.party_role === 'admin')

  return (
    <div className="space-y-6">
      {/* Buyer Evidence */}
      {buyerEvidence.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Badge variant="info">Buyer</Badge>
            <span className="text-sm text-gray-500">
              ({buyerEvidence.length} {buyerEvidence.length === 1 ? 'item' : 'items'})
            </span>
          </h3>
          <div className="space-y-3">
            {buyerEvidence.map((item) => (
              <EvidenceCard key={item.id} evidence={item} />
            ))}
          </div>
        </div>
      )}

      {/* Seller Evidence */}
      {sellerEvidence.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Badge variant="success">Seller</Badge>
            <span className="text-sm text-gray-500">
              ({sellerEvidence.length} {sellerEvidence.length === 1 ? 'item' : 'items'})
            </span>
          </h3>
          <div className="space-y-3">
            {sellerEvidence.map((item) => (
              <EvidenceCard key={item.id} evidence={item} />
            ))}
          </div>
        </div>
      )}

      {/* Admin Evidence */}
      {adminEvidence.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Badge variant="warning">Admin</Badge>
            <span className="text-sm text-gray-500">
              ({adminEvidence.length} {adminEvidence.length === 1 ? 'item' : 'items'})
            </span>
          </h3>
          <div className="space-y-3">
            {adminEvidence.map((item) => (
              <EvidenceCard key={item.id} evidence={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EvidenceCard({ evidence }: { evidence: EscrowEvidence }) {
  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'text':
        return ''
      case 'image':
        return 'IMG'
      case 'document':
        return '📄'
      case 'link':
        return 'URL'
      case 'screenshot':
        return '📸'
      default:
        return '📎'
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{getEvidenceIcon(evidence.evidence_type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default" className="capitalize">
              {evidence.evidence_type}
            </Badge>
            <span className="text-xs text-gray-500">
              {formatDate(evidence.created_at)}
            </span>
          </div>

          {/* Text Content */}
          {evidence.content && evidence.evidence_type === 'text' && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {evidence.content}
            </p>
          )}

          {/* Link */}
          {evidence.content && evidence.evidence_type === 'link' && (
            <a
              href={evidence.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:text-purple-700 underline break-all"
            >
              {evidence.content}
            </a>
          )}

          {/* File */}
          {evidence.file_url && (
            <div className="mt-2">
              <a
                href={evidence.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                <span>View {evidence.evidence_type}</span>
                {evidence.file_size && (
                  <span className="text-xs text-gray-500">
                    ({formatFileSize(evidence.file_size)})
                  </span>
                )}
                <span className="text-gray-400">↗</span>
              </a>
              {evidence.mime_type && (
                <p className="text-xs text-gray-500 mt-1">
                  Type: {evidence.mime_type}
                </p>
              )}
            </div>
          )}

          {/* Submitter Info */}
          <div className="mt-2 text-xs text-gray-500">
            Submitted by: {truncateWallet(evidence.submitted_by)}
          </div>
        </div>
      </div>
    </Card>
  )
}
