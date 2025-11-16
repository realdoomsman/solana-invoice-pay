'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import EvidenceSubmission from '@/components/EvidenceSubmission'
import EvidenceList from '@/components/EvidenceList'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'

export default function EscrowEvidencePage() {
  const params = useParams()
  const router = useRouter()
  const { publicKey } = useWallet()
  const escrowId = params.id as string

  const [escrow, setEscrow] = useState<any>(null)
  const [dispute, setDispute] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchEscrowDetails()
  }, [escrowId])

  const fetchEscrowDetails = async () => {
    try {
      // Fetch escrow details
      const escrowResponse = await fetch(`/api/admin/escrow/${escrowId}`)
      const escrowData = await escrowResponse.json()

      if (!escrowResponse.ok) {
        throw new Error(escrowData.error || 'Failed to fetch escrow')
      }

      setEscrow(escrowData.escrow)

      // Fetch dispute if escrow is disputed
      if (escrowData.escrow.status === 'disputed') {
        const disputeResponse = await fetch(`/api/escrow/dispute?escrowId=${escrowId}`)
        const disputeData = await disputeResponse.json()

        if (disputeResponse.ok && disputeData.disputes?.length > 0) {
          setDispute(disputeData.disputes[0])
        }
      }

      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load escrow details')
    } finally {
      setLoading(false)
    }
  }

  const handleEvidenceSubmitted = () => {
    setShowSubmissionForm(false)
    setRefreshKey((prev) => prev + 1)
    fetchEscrowDetails()
  }

  if (!publicKey) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="warning">
          Please connect your wallet to view and submit evidence
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  if (!escrow) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="danger">Escrow not found</Alert>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const userWallet = publicKey.toBase58()
  const isBuyer = escrow.buyer_wallet === userWallet
  const isSeller = escrow.seller_wallet === userWallet
  const isParty = isBuyer || isSeller

  if (!isParty) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="warning">
          You are not a party to this escrow and cannot submit evidence
        </Alert>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Evidence Submission</h1>
          <p className="text-gray-600 mt-1">
            Escrow ID: {escrowId.slice(0, 8)}...
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back to Escrow
        </Button>
      </div>

      {/* Escrow Status */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-semibold capitalize">{escrow.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-semibold capitalize">
              {escrow.escrow_type.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Amount</p>
            <p className="font-semibold">
              {escrow.buyer_amount} {escrow.token}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Your Role</p>
            <p className="font-semibold capitalize">
              {isBuyer ? 'Buyer' : 'Seller'}
            </p>
          </div>
        </div>
      </Card>

      {/* Dispute Info */}
      {dispute && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">
            Active Dispute
          </h3>
          <p className="text-sm text-yellow-800 mb-1">
            <strong>Reason:</strong> {dispute.reason}
          </p>
          <p className="text-sm text-yellow-800">
            <strong>Description:</strong> {dispute.description}
          </p>
        </Card>
      )}

      {/* Submit Evidence Button */}
      {!showSubmissionForm && (
        <Button
          onClick={() => setShowSubmissionForm(true)}
          className="w-full"
        >
          Submit New Evidence
        </Button>
      )}

      {/* Evidence Submission Form */}
      {showSubmissionForm && (
        <EvidenceSubmission
          escrowId={escrowId}
          disputeId={dispute?.id}
          submittedBy={userWallet}
          onSuccess={handleEvidenceSubmitted}
          onCancel={() => setShowSubmissionForm(false)}
        />
      )}

      {/* Evidence List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Submitted Evidence</h2>
        <EvidenceList
          key={refreshKey}
          escrowId={escrowId}
          disputeId={dispute?.id}
          autoRefresh={true}
          refreshInterval={30000}
        />
      </div>

      {/* Help Text */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          Evidence Submission Guidelines
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Provide clear and detailed evidence to support your case</li>
          <li>You can submit multiple pieces of evidence</li>
          <li>Supported formats: Text, Images, Documents (PDF/Word), Links</li>
          <li>Maximum file size: 10MB per file</li>
          <li>All evidence will be reviewed by an admin</li>
          <li>Both parties can view all submitted evidence</li>
        </ul>
      </Card>
    </div>
  )
}
