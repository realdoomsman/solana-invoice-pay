// Content script for NOVIQ extension
// Detects payment amounts on webpages and offers quick payment link creation

// Listen for keyboard shortcut (Ctrl+Shift+P or Cmd+Shift+P)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
    e.preventDefault()
    openQuickPayment()
  }
})

// Detect selected text that looks like an amount
document.addEventListener('mouseup', () => {
  const selection = window.getSelection().toString().trim()
  
  // Check if selection looks like a price/amount
  const amountMatch = selection.match(/(\d+\.?\d*)\s*(SOL|USDC|USDT|USD|\$)?/i)
  
  if (amountMatch) {
    showQuickPaymentButton(amountMatch)
  }
})

// Show floating button for quick payment creation
function showQuickPaymentButton(match) {
  // Remove existing button
  const existing = document.getElementById('noviq-quick-btn')
  if (existing) existing.remove()

  const selection = window.getSelection()
  if (!selection.rangeCount) return

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  // Create button
  const btn = document.createElement('div')
  btn.id = 'noviq-quick-btn'
  btn.innerHTML = `
    <div style="
      position: fixed;
      top: ${rect.bottom + window.scrollY + 5}px;
      left: ${rect.left + window.scrollX}px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: transform 0.2s;
    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
      ⚡ Create Payment Link (${match[1]} ${match[2] || 'SOL'})
    </div>
  `

  btn.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'openPopupWithAmount',
      amount: match[1],
      token: match[2] || 'SOL'
    })
    btn.remove()
  })

  document.body.appendChild(btn)

  // Remove button after 5 seconds
  setTimeout(() => btn.remove(), 5000)
}

// Open quick payment popup
function openQuickPayment() {
  chrome.runtime.sendMessage({ action: 'openPopup' })
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'paymentCreated') {
    showNotification('Payment link created and copied!', 'success')
  }
})

// Show notification
function showNotification(message, type) {
  const notification = document.createElement('div')
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: slideIn 0.3s ease-out;
    ">
      ${message}
    </div>
  `

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out'
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}

// Add CSS animations
const style = document.createElement('style')
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`
document.head.appendChild(style)
