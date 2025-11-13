// Background service worker for NOVIQ extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('NOVIQ extension installed')
})

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'createPayment') {
    createPaymentLink(request.data)
      .then(link => sendResponse({ success: true, link }))
      .catch(error => sendResponse({ success: false, error: error.message }))
    return true // Keep channel open for async response
  }
})

// Create payment link
async function createPaymentLink(data) {
  const { walletAddress, amount, token, description } = data
  
  // Generate unique ID
  const paymentId = generateId()
  
  // Create payment data
  const paymentData = {
    id: paymentId,
    amount: parseFloat(amount),
    token,
    description,
    status: 'pending',
    createdAt: new Date().toISOString(),
    merchantWallet: walletAddress,
    type: 'simple'
  }

  // Store in chrome storage
  const result = await chrome.storage.local.get(['payments'])
  const payments = result.payments || []
  payments.push(paymentData)
  await chrome.storage.local.set({ payments })

  // Return payment link
  return `https://noviq.fun/pay/${paymentId}`
}

// Generate random ID
function generateId() {
  return Math.random().toString(36).substring(2, 12)
}

// Context menu for quick payment creation
chrome.contextMenus.create({
  id: 'createPayment',
  title: 'Create NOVIQ Payment Link',
  contexts: ['selection']
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'createPayment') {
    // Extract amount from selected text if it's a number
    const selectedText = info.selectionText
    const amount = parseFloat(selectedText)
    
    if (!isNaN(amount)) {
      chrome.action.openPopup()
      // Send message to popup to pre-fill amount
      chrome.runtime.sendMessage({ 
        action: 'prefillAmount', 
        amount 
      })
    }
  }
})
