import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

/**
 * POST /api/upload/evidence
 * Upload evidence files (images, documents)
 * 
 * Note: This is a basic implementation that stores files temporarily.
 * For production, integrate with a proper file storage service like:
 * - AWS S3
 * - Cloudflare R2
 * - Supabase Storage
 * - Vercel Blob Storage
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const escrowId = formData.get('escrowId') as string
    const evidenceType = formData.get('evidenceType') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!escrowId) {
      return NextResponse.json(
        { error: 'Escrow ID is required' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const validDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    const isValidImage = validImageTypes.includes(file.type)
    const isValidDoc = validDocTypes.includes(file.type)

    if (!isValidImage && !isValidDoc) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) and documents (PDF, Word) are allowed' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${escrowId}-${nanoid(12)}.${fileExtension}`

    // TODO: Implement actual file upload to storage service
    // For now, we'll return a placeholder URL
    // In production, you would:
    // 1. Upload to S3/R2/Supabase Storage
    // 2. Get the public URL
    // 3. Return that URL

    // Example with Supabase Storage:
    /*
    const { data, error } = await supabase.storage
      .from('escrow-evidence')
      .upload(`${escrowId}/${uniqueFilename}`, file, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      throw new Error('Failed to upload file')
    }

    const { data: { publicUrl } } = supabase.storage
      .from('escrow-evidence')
      .getPublicUrl(`${escrowId}/${uniqueFilename}`)

    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      filename: uniqueFilename,
      size: file.size,
      type: file.type
    })
    */

    // Placeholder response for development
    // Replace this with actual storage implementation
    const placeholderUrl = `/uploads/evidence/${uniqueFilename}`

    return NextResponse.json({
      success: true,
      url: placeholderUrl,
      filename: uniqueFilename,
      size: file.size,
      type: file.type,
      message: 'File upload endpoint - integrate with storage service for production'
    })

  } catch (error: any) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}
