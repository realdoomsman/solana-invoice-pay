'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'

interface EvidenceSubmissionProps {
  escrowId: string
  disputeId?: string
  milestoneId?: string
  submittedBy: string
  onSuccess?: () => void
  onCancel?: () => void
}

type EvidenceType = 'text' | 'image' | 'document' | 'link' | 'screenshot'

export default function EvidenceSubmission({
  escrowId,
  disputeId,
  milestoneId,
  submittedBy,
  onSuccess,
  onCancel,
}: EvidenceSubmissionProps) {
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('text')
  const [content, setContent] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileSize, setFileSize] = useState<number>()
  const [mimeType, setMimeType] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const validDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    
    if (evidenceType === 'image' && !validImageTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    if (evidenceType === 'document' && !validDocTypes.includes(file.type)) {
      setError('Please upload a valid document file (PDF or Word)')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('escrowId', escrowId)
      formData.append('evidenceType', evidenceType)

      // Upload to your file storage service
      // This is a placeholder - implement your actual file upload logic
      const uploadResponse = await fetch('/api/upload/evidence', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      const { url } = await uploadResponse.json()
      
      setFileUrl(url)
      setFileSize(file.size)
      setMimeType(file.type)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // Validate based on evidence type
      if (evidenceType === 'text' && !content.trim()) {
        throw new Error('Please provide text evidence')
      }

      if ((evidenceType === 'image' || evidenceType === 'document' || evidenceType === 'screenshot') && !fileUrl) {
        throw new Error('Please upload a file')
      }

      if (evidenceType === 'link' && !content.trim()) {
        throw new Error('Please provide a link')
      }

      // Validate URL format for links
      if (evidenceType === 'link') {
        try {
          new URL(content)
        } catch {
          throw new Error('Please provide a valid URL')
        }
      }

      const response = await fetch('/api/escrow/evidence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          escrowId,
          disputeId,
          milestoneId,
          submittedBy,
          evidenceType,
          content: content.trim() || undefined,
          fileUrl: fileUrl || undefined,
          fileSize,
          mimeType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit evidence')
      }

      setSuccess(true)
      setContent('')
      setFileUrl('')
      setFileSize(undefined)
      setMimeType('')

      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to submit evidence')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setContent('')
    setFileUrl('')
    setFileSize(undefined)
    setMimeType('')
    setError('')
    setSuccess(false)
  }

  const handleTypeChange = (type: EvidenceType) => {
    setEvidenceType(type)
    resetForm()
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Submit Evidence</h3>

      {success && (
        <Alert variant="success" className="mb-4">
          Evidence submitted successfully!
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Evidence Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Evidence Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {(['text', 'image', 'document', 'link', 'screenshot'] as EvidenceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`px-4 py-2 rounded-lg border-2 transition-colors capitalize ${
                  evidenceType === type
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Text Evidence */}
        {evidenceType === 'text' && (
          <div>
            <label htmlFor="text-content" className="block text-sm font-medium mb-2">
              Evidence Details
            </label>
            <textarea
              id="text-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide detailed information about your evidence..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Minimum 20 characters recommended for detailed evidence
            </p>
          </div>
        )}

        {/* Link Evidence */}
        {evidenceType === 'link' && (
          <div>
            <label htmlFor="link-content" className="block text-sm font-medium mb-2">
              Link URL
            </label>
            <input
              id="link-content"
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="https://example.com/evidence"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Provide a link to external evidence (e.g., GitHub, Google Drive, etc.)
            </p>
          </div>
        )}

        {/* File Upload (Image, Document, Screenshot) */}
        {(evidenceType === 'image' || evidenceType === 'document' || evidenceType === 'screenshot') && (
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
              Upload {evidenceType === 'image' || evidenceType === 'screenshot' ? 'Image' : 'Document'}
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              accept={
                evidenceType === 'image' || evidenceType === 'screenshot'
                  ? 'image/jpeg,image/png,image/gif,image/webp'
                  : 'application/pdf,.doc,.docx'
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={uploading}
            />
            <p className="text-sm text-gray-500 mt-1">
              {evidenceType === 'image' || evidenceType === 'screenshot'
                ? 'Supported formats: JPEG, PNG, GIF, WebP (max 10MB)'
                : 'Supported formats: PDF, Word (max 10MB)'}
            </p>
            {fileUrl && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✓ File uploaded successfully
                  {fileSize && ` (${(fileSize / 1024).toFixed(2)} KB)`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={submitting || uploading || success}
            className="flex-1"
          >
            {submitting ? 'Submitting...' : uploading ? 'Uploading...' : 'Submit Evidence'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting || uploading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
