import sgMail from '@sendgrid/mail'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
const FROM_EMAIL = process.env.NOTIFICATION_EMAIL || 'noreply@solanapay.com'

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

export async function sendPaymentReceivedEmail(
  to: string,
  paymentData: {
    amount: number
    token: string
    description: string
    txSignature: string
  }
) {
  if (!SENDGRID_API_KEY) {
    console.log('SendGrid not configured, skipping email')
    return
  }

  const msg = {
    to,
    from: FROM_EMAIL,
    subject: `Payment Received: ${paymentData.amount} ${paymentData.token}`,
    text: `
You received a payment!

Amount: ${paymentData.amount} ${paymentData.token}
Description: ${paymentData.description || 'No description'}

Transaction: https://explorer.solana.com/tx/${paymentData.txSignature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}

Thank you for using Solana Pay!
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .amount { font-size: 32px; font-weight: bold; color: #667eea; margin: 20px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Received!</h1>
    </div>
    <div class="content">
      <p>Great news! You've received a payment.</p>
      
      <div class="amount">${paymentData.amount} ${paymentData.token}</div>
      
      ${paymentData.description ? `<p><strong>Description:</strong> ${paymentData.description}</p>` : ''}
      
      <p>The payment has been confirmed on the Solana blockchain and forwarded to your wallet.</p>
      
      <a href="https://explorer.solana.com/tx/${paymentData.txSignature}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'}" class="button">
        View Transaction
      </a>
      
      <div class="footer">
        <p>Powered by Solana Pay</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  }

  try {
    await sgMail.send(msg)
    console.log('Email sent successfully')
  } catch (error) {
    console.error('Error sending email:', error)
  }
}

export async function sendPaymentCreatedEmail(
  to: string,
  paymentData: {
    amount: number
    token: string
    description: string
    paymentLink: string
  }
) {
  if (!SENDGRID_API_KEY) {
    console.log('SendGrid not configured, skipping email')
    return
  }

  const msg = {
    to,
    from: FROM_EMAIL,
    subject: `Payment Link Created: ${paymentData.amount} ${paymentData.token}`,
    text: `
Your payment link has been created!

Amount: ${paymentData.amount} ${paymentData.token}
Description: ${paymentData.description || 'No description'}

Payment Link: ${paymentData.paymentLink}

Share this link with your customer to receive payment.
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .amount { font-size: 32px; font-weight: bold; color: #667eea; margin: 20px 0; }
    .link-box { background: white; border: 2px dashed #667eea; padding: 15px; border-radius: 5px; margin: 20px 0; word-break: break-all; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Link Created!</h1>
    </div>
    <div class="content">
      <p>Your payment link is ready to share.</p>
      
      <div class="amount">${paymentData.amount} ${paymentData.token}</div>
      
      ${paymentData.description ? `<p><strong>Description:</strong> ${paymentData.description}</p>` : ''}
      
      <div class="link-box">
        <strong>Payment Link:</strong><br>
        <a href="${paymentData.paymentLink}">${paymentData.paymentLink}</a>
      </div>
      
      <p>Share this link with your customer. They can pay by scanning the QR code or connecting their wallet.</p>
      
      <a href="${paymentData.paymentLink}" class="button">
        View Payment Page
      </a>
      
      <div class="footer">
        <p>Powered by Solana Pay</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
  }

  try {
    await sgMail.send(msg)
    console.log('Email sent successfully')
  } catch (error) {
    console.error('Error sending email:', error)
  }
}
