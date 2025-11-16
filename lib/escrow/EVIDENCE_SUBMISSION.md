# Evidence Submission System

## Overview

The Evidence Submission System allows buyers and sellers in escrow transactions to submit various types of evidence to support their case in disputes or to document work completion. This system is a critical component of the dispute resolution process.

## Features

### Supported Evidence Types

1. **Text Evidence** - Written descriptions and explanations
2. **Image Evidence** - Screenshots, photos, and visual proof
3. **Document Evidence** - PDF files, Word documents, contracts
4. **Link Evidence** - URLs to external resources (GitHub, Google Drive, etc.)
5. **Screenshot Evidence** - Specific screenshots for dispute resolution

### Key Capabilities

- ✅ Multiple evidence types support
- ✅ File upload with validation (max 10MB)
- ✅ Real-time evidence list with auto-refresh
- ✅ Party role identification (Buyer/Seller/Admin)
- ✅ Evidence grouped by submitter
- ✅ Secure file storage integration ready
- ✅ Comprehensive validation and error handling

## Architecture

### Components

#### 1. EvidenceSubmission Component
**Location:** `components/EvidenceSubmission.tsx`

Interactive form for submitting evidence with:
- Evidence type selector (5 types)
- Dynamic form fields based on type
- File upload with progress indication
- Validation and error handling
- Success feedback

**Props:**
```typescript
interface EvidenceSubmissionProps {
  escrowId: string
  disputeId?: string
  milestoneId?: string
  submittedBy: string
  onSuccess?: () => void
  onCancel?: () => void
}
```

#### 2. EvidenceList Component
**Location:** `components/EvidenceList.tsx`

Displays all submitted evidence with:
- Grouped by party role (Buyer/Seller/Admin)
- Evidence count per party
- File size and type display
- Clickable links for external evidence
- Auto-refresh capability

**Props:**
```typescript
interface EvidenceListProps {
  escrowId?: string
  disputeId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}
```

#### 3. Evidence Page
**Location:** `app/escrow/[id]/evidence/page.tsx`

Dedicated page for evidence management with:
- Escrow status display
- Role-based access control
- Evidence submission form
- Evidence list with real-time updates
- Guidelines and help text

### API Endpoints

#### Submit Evidence
**Endpoint:** `POST /api/escrow/evidence`

**Request Body:**
```json
{
  "escrowId": "string",
  "disputeId": "string (optional)",
  "milestoneId": "string (optional)",
  "submittedBy": "wallet_address",
  "evidenceType": "text|image|document|link|screenshot",
  "content": "string (for text/link)",
  "fileUrl": "string (for files)",
  "fileSize": "number (optional)",
  "mimeType": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "evidence": {
    "id": "string",
    "evidence_type": "string",
    "submitted_by": "string",
    "party_role": "buyer|seller",
    "created_at": "timestamp"
  }
}
```

#### Get Evidence
**Endpoint:** `GET /api/escrow/evidence?escrowId=xxx&disputeId=xxx`

**Response:**
```json
{
  "success": true,
  "evidence": [
    {
      "id": "string",
      "escrow_id": "string",
      "dispute_id": "string",
      "submitted_by": "string",
      "party_role": "buyer|seller|admin",
      "evidence_type": "text|image|document|link|screenshot",
      "content": "string",
      "file_url": "string",
      "file_size": "number",
      "mime_type": "string",
      "created_at": "timestamp"
    }
  ]
}
```

#### Upload Evidence File
**Endpoint:** `POST /api/upload/evidence`

**Request:** FormData with:
- `file`: File object
- `escrowId`: string
- `evidenceType`: string

**Response:**
```json
{
  "success": true,
  "url": "string",
  "filename": "string",
  "size": "number",
  "type": "string"
}
```

## Database Schema

### escrow_evidence Table

```sql
CREATE TABLE escrow_evidence (
  id TEXT PRIMARY KEY,
  escrow_id TEXT NOT NULL REFERENCES escrow_contracts(id),
  dispute_id TEXT REFERENCES escrow_disputes(id),
  milestone_id TEXT REFERENCES escrow_milestones(id),
  
  submitted_by TEXT NOT NULL,
  party_role TEXT NOT NULL CHECK (party_role IN ('buyer', 'seller', 'admin')),
  
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('text', 'image', 'document', 'link', 'screenshot')),
  content TEXT,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage Examples

### Submit Text Evidence

```typescript
const response = await fetch('/api/escrow/evidence', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    escrowId: 'escrow-123',
    disputeId: 'dispute-456',
    submittedBy: 'buyer-wallet-address',
    evidenceType: 'text',
    content: 'The seller did not complete the work as specified in milestone 1. Here are the details...'
  })
})
```

### Submit Image Evidence

```typescript
// 1. Upload file
const formData = new FormData()
formData.append('file', imageFile)
formData.append('escrowId', 'escrow-123')
formData.append('evidenceType', 'image')

const uploadResponse = await fetch('/api/upload/evidence', {
  method: 'POST',
  body: formData
})

const { url } = await uploadResponse.json()

// 2. Submit evidence
const response = await fetch('/api/escrow/evidence', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    escrowId: 'escrow-123',
    disputeId: 'dispute-456',
    submittedBy: 'seller-wallet-address',
    evidenceType: 'image',
    fileUrl: url,
    fileSize: imageFile.size,
    mimeType: imageFile.type
  })
})
```

### Submit Link Evidence

```typescript
const response = await fetch('/api/escrow/evidence', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    escrowId: 'escrow-123',
    disputeId: 'dispute-456',
    submittedBy: 'seller-wallet-address',
    evidenceType: 'link',
    content: 'https://github.com/project/pull/123'
  })
})
```

### Fetch Evidence

```typescript
const response = await fetch('/api/escrow/evidence?escrowId=escrow-123')
const { evidence } = await response.json()

// Group by party
const buyerEvidence = evidence.filter(e => e.party_role === 'buyer')
const sellerEvidence = evidence.filter(e => e.party_role === 'seller')
```

## Validation Rules

### File Upload
- Maximum file size: 10MB
- Allowed image types: JPEG, PNG, GIF, WebP
- Allowed document types: PDF, Word (.doc, .docx)

### Text Evidence
- Minimum recommended length: 20 characters
- No maximum length

### Link Evidence
- Must be a valid URL format
- Supports any protocol (http, https, etc.)

### Access Control
- Only buyer or seller can submit evidence
- Submitter must be a party to the escrow
- Evidence is visible to both parties and admins

## Integration with Dispute System

The evidence submission system is tightly integrated with the dispute resolution workflow:

1. **Dispute Raised** → Evidence submission enabled
2. **Evidence Submitted** → Counterparty notified
3. **Admin Reviews** → All evidence visible in admin dashboard
4. **Resolution** → Evidence considered in decision

## File Storage Integration

The current implementation includes a placeholder file upload endpoint. For production, integrate with:

### Recommended Storage Services

1. **Supabase Storage**
   ```typescript
   const { data, error } = await supabase.storage
     .from('escrow-evidence')
     .upload(`${escrowId}/${filename}`, file)
   ```

2. **AWS S3**
   ```typescript
   const command = new PutObjectCommand({
     Bucket: 'escrow-evidence',
     Key: `${escrowId}/${filename}`,
     Body: file
   })
   await s3Client.send(command)
   ```

3. **Cloudflare R2**
   ```typescript
   await env.EVIDENCE_BUCKET.put(
     `${escrowId}/${filename}`,
     file
   )
   ```

4. **Vercel Blob Storage**
   ```typescript
   const blob = await put(
     `evidence/${escrowId}/${filename}`,
     file,
     { access: 'public' }
   )
   ```

## Security Considerations

### Access Control
- Verify wallet signatures for all submissions
- Check party role before allowing evidence submission
- Validate escrow exists and is in valid state

### File Validation
- Validate file types and sizes
- Scan for malware (recommended for production)
- Generate unique filenames to prevent collisions
- Use secure storage with access controls

### Data Privacy
- Evidence is only visible to parties and admins
- File URLs should be signed/temporary when possible
- Consider encryption for sensitive documents

## Testing

The evidence submission system includes comprehensive test coverage in:
- `lib/escrow/__tests__/dispute-system.test.ts`

Tests cover:
- Text evidence submission
- Image evidence submission
- Document evidence submission
- Link evidence submission
- Evidence type validation
- Content validation
- Access control

## Future Enhancements

### Planned Features
- [ ] Evidence versioning and editing
- [ ] Evidence comments and annotations
- [ ] Evidence search and filtering
- [ ] Bulk evidence upload
- [ ] Evidence templates
- [ ] OCR for document evidence
- [ ] Video evidence support
- [ ] Evidence encryption at rest

### Performance Optimizations
- [ ] Lazy loading for large evidence lists
- [ ] Image thumbnails and compression
- [ ] CDN integration for file delivery
- [ ] Evidence caching

## Requirements Satisfied

This implementation satisfies **Requirement 6.4** from the requirements document:

> **Requirement 6.4:** Evidence Submission
> - Allow text evidence submission ✅
> - Support file uploads (images, documents) ✅
> - Add link evidence support ✅
> - Store evidence in database ✅

## Related Documentation

- [Dispute System](./DISPUTE_SYSTEM.md)
- [Admin Resolution](./ADMIN_RESOLUTION.md)
- [Database Schema](../../supabase-escrow-complete-schema.sql)
- [API Documentation](./API.md)

