/**
 * Export and download utilities for payments
 */

interface Payment {
  id: string
  amount: number
  token: string
  description: string
  status: string
  createdAt: string
  merchantWallet?: string
  txSignature?: string
}

/**
 * Export payments to CSV
 */
export function exportToCSV(payments: Payment[], filename = 'payments.csv') {
  const headers = ['ID', 'Amount', 'Token', 'Description', 'Status', 'Date', 'Transaction']
  const rows = payments.map(p => [
    p.id,
    p.amount,
    p.token,
    p.description || '',
    p.status,
    new Date(p.createdAt).toLocaleString(),
    p.txSignature || ''
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  downloadFile(csv, filename, 'text/csv')
}

/**
 * Export payments to JSON
 */
export function exportToJSON(payments: Payment[], filename = 'payments.json') {
  const json = JSON.stringify(payments, null, 2)
  downloadFile(json, filename, 'application/json')
}

/**
 * Generate PDF invoice for a payment
 */
export function generateInvoicePDF(payment: Payment) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${payment.id}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { color: #3b82f6; margin: 0; }
    .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .row { display: flex; justify-between; margin: 10px 0; }
    .label { font-weight: bold; color: #64748b; }
    .value { color: #1e293b; }
    .amount { font-size: 32px; font-weight: bold; color: #3b82f6; text-align: center; margin: 30px 0; }
    .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 14px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-pending { background: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <div class="header">
    <h1>💸 Payment Invoice</h1>
    <p>Solana Payment Platform</p>
  </div>
  
  <div class="invoice-details">
    <div class="row">
      <span class="label">Invoice ID:</span>
      <span class="value">${payment.id}</span>
    </div>
    <div class="row">
      <span class="label">Date:</span>
      <span class="value">${new Date(payment.createdAt).toLocaleString()}</span>
    </div>
    <div class="row">
      <span class="label">Status:</span>
      <span class="status status-${payment.status}">${payment.status.toUpperCase()}</span>
    </div>
    <div class="row">
      <span class="label">Description:</span>
      <span class="value">${payment.description || 'Payment'}</span>
    </div>
    ${payment.merchantWallet ? `
    <div class="row">
      <span class="label">Merchant Wallet:</span>
      <span class="value" style="font-size: 12px;">${payment.merchantWallet}</span>
    </div>
    ` : ''}
    ${payment.txSignature ? `
    <div class="row">
      <span class="label">Transaction:</span>
      <span class="value" style="font-size: 12px;">${payment.txSignature}</span>
    </div>
    ` : ''}
  </div>
  
  <div class="amount">
    ${payment.amount} ${payment.token}
  </div>
  
  <div class="footer">
    <p>Powered by Solana Blockchain</p>
    <p>Transaction verified on-chain</p>
  </div>
</body>
</html>
  `

  // Open in new window for printing
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Copy payment link to clipboard
 */
export async function copyPaymentLink(paymentId: string) {
  const baseUrl = window.location.origin
  const link = `${baseUrl}/pay/${paymentId}`
  
  try {
    await navigator.clipboard.writeText(link)
    return { success: true, link }
  } catch (error) {
    return { success: false, error: 'Failed to copy' }
  }
}

/**
 * Share payment link via Web Share API
 */
export async function sharePaymentLink(paymentId: string, amount: number, token: string) {
  const baseUrl = window.location.origin
  const link = `${baseUrl}/pay/${paymentId}`
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Payment Request',
        text: `Please pay ${amount} ${token}`,
        url: link,
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Share cancelled' }
    }
  } else {
    // Fallback to copy
    return copyPaymentLink(paymentId)
  }
}
