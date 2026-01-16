'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface MilestoneWorkSubmissionProps {
  milestone: {
    id: string
    description: string
    percentage: number
    amount: number
    status: string
    milestone_order: number
  }
  escrowId: string
  sellerWallet: string
  token: string
  onSubmitSuccess: () => void
  onCancel: () => void
}

export default function MilestoneWorkSubmission({
  milestone,
  escrowId,
  sellerWallet,
  token,
  onSubmitSuccess,
  onCancel,
}: MilestoneWorkSubmissionProps) {
  const [notes, setNotes] = useState('')
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>([''])
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const addEvidenceLink = () => {
    setEvidenceLinks([...evidenceLinks, ''])
  }

  const updateEvidenceLink = (index: number, value: string) => {
    const updated = [...evidenceLinks]
    updated[index] = value
    setEvidenceLinks(updated)
  }

  const removeEvidenceLink = (index: number) => {
    if (evidenceLinks.length > 1) {
      setEvidenceLinks(evidenceLinks.filter((_, i) => i !== index))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validate file size (max 10MB per file)
    const maxSize = 10 * 1024 * 1024
    const oversizedFiles = files.filter(f => f.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      toast.error('Some files exceed 10MB limit and were not added')
      const validFiles = files.filter(f => f.size <= maxSize)
      setEvidenceFiles([...evidenceFiles, ...validFiles])
    } else {
      setEvidenceFiles([...evidenceFiles, ...files])
    }
    
    // Reset input
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index))
  }

  const uploadFiles = async (): Promise<string[]> => {
    if (evidenceFiles.length === 0) return []

    setUploadingFiles(true)
    const uploadedUrls: string[] = []

    try {
      for (const file of evidenceFiles) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('escrowId', escrowId)
        formData.append('milestoneId', milestone.id)

        const response = await fetch('/api/upload/evidence', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const data = await response.json()
        uploadedUrls.push(data.url)
      }

      return uploadedUrls
    } catch (error: any) {
      console.error('File upload error:', error)
      throw new Error(error.message || 'Failed to upload files')
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleSubmit = async () => {
    if (!notes.trim()) {
      toast.error('Please add notes describing your completed work')
      return
    }

    setSubmitting(true)
    const loadingToast = toast.loading('Submitting work for review...')

    try {
      // Upload files first if any
      let uploadedFileUrls: string[] = []
      if (evidenceFiles.length > 0) {
        toast.loading('Uploading evidence files...', { id: loadingToast })
        uploadedFileUrls = await uploadFiles()
      }

      // Filter out empty evidence links
      const validEvidenceUrls = evidenceLinks.filter(link => link.trim() !== '')

      // Combine file URLs and link URLs
      const allEvidenceUrls = [...uploadedFileUrls, ...validEvidenceUrls]

      const response = await fetch('/api/escrow/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId: milestone.id,
          sellerWallet,
          notes: notes.trim(),
          evidenceUrls: allEvidenceUrls.length > 0 ? allEvidenceUrls : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit work')
      }

      toast.success('Work submitted successfully! Buyer will be notified.', { id: loadingToast })
      onSubmitSuccess()
    } catch (error: any) {
      console.error('Submit work error:', error)
      toast.error(error.message || 'Failed to submit work', { id: loadingToast })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-xl p-6 max-w-2xl w-full border border-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">Submit Completed Work</h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded font-medium">
              Milestone #{milestone.milestone_order}
            </span>
            <span className="text-slate-400">{milestone.description}</span>
          </div>
          <div className="mt-2 text-slate-400 text-sm">
            Payment: {milestone.amount} {token} ({milestone.percentage}%)
          </div>
        </div>

        {/* Work Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Work Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what you've completed for this milestone. Be specific about deliverables, features implemented, or tasks finished..."
            rows={6}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            disabled={submitting}
          />
          <div className="mt-1 text-xs text-slate-500">
            {notes.length} characters
          </div>
        </div>

        {/* Evidence Files */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Evidence Files (Optional)
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Upload screenshots, documents, or other files as proof of work (max 10MB per file)
          </p>
          
          {/* File Upload Button */}
          <div className="mb-3">
            <label className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer transition-colors border border-slate-700">
              <span className="text-sm">📎 Choose Files</span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                disabled={submitting || uploadingFiles}
              />
            </label>
            <span className="ml-3 text-xs text-slate-500">
              Images, PDFs, Documents
            </span>
          </div>

          {/* Selected Files List */}
          {evidenceFiles.length > 0 && (
            <div className="space-y-2 mb-3">
              {evidenceFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg border border-slate-700">
                  <span className="text-sm text-white flex-1 truncate">
                    📄 {file.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="px-2 py-1 text-red-400 hover:text-red-300 transition-colors"
                    disabled={submitting || uploadingFiles}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Evidence Links */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Evidence Links (Optional)
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Add links to external resources, demos, or hosted files
          </p>
          <div className="space-y-2">
            {evidenceLinks.map((link, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => updateEvidenceLink(index, e.target.value)}
                  placeholder="https://example.com/demo-video.mp4"
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={submitting || uploadingFiles}
                />
                {evidenceLinks.length > 1 && (
                  <button
                    onClick={() => removeEvidenceLink(index)}
                    className="px-3 py-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
                    disabled={submitting || uploadingFiles}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {evidenceLinks.length < 10 && (
            <button
              onClick={addEvidenceLink}
              className="mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              disabled={submitting || uploadingFiles}
            >
              + Add Another Link
            </button>
          )}
        </div>

        {/* Submission Status Info */}
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 font-bold">i</span>
            <div className="flex-1">
              <p className="text-sm text-blue-300 font-medium mb-1">What happens next?</p>
              <ul className="text-xs text-blue-400 space-y-1 list-disc list-inside">
                <li>Buyer will be notified to review your work</li>
                <li>They can approve and release funds, or raise a dispute</li>
                <li>You can update your submission before they review it</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || uploadingFiles || !notes.trim()}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadingFiles ? 'Uploading Files...' : submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
          <button
            onClick={onCancel}
            disabled={submitting || uploadingFiles}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
