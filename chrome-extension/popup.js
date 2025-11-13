// Load saved wallet address
chrome.storage.sync.get(['walletAddress'], (result) => {
  if (result.walletAddress) {
    document.getElementById('walletAddress').value = result.walletAddress
  }
})

// Quick amount buttons
document.querySelectorAll('.quick-amount').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.quick-amount').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById('amount').value = btn.dataset.amount
  })
})

// Form submission
document.getElementById('paymentForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const walletAddress = document.getElementById('walletAddress').value
  const amount = document.getElementById('amount').value
  const token = document.getElementById('token').value
  const description = document.getElementById('description').value
  
  if (!walletAddress || !amount) {
    showMessage('Please fill in all required fields', 'error')
    return
  }

  // Save wallet address
  chrome.storage.sync.set({ walletAddress })

  const createBtn = document.getElementById('createBtn')
  createBtn.disabled = true
  createBtn.innerHTML = '<span class="loading"></span> Creating...'

  try {
    // Generate payment ID
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

    // Store in local storage (will sync with website)
    const payments = JSON.parse(localStorage.getItem('payments') || '[]')
    payments.push(paymentData)
    localStorage.setItem('payments', JSON.stringify(payments))

    // Generate link
    const paymentLink = `https://noviq.fun/pay/${paymentId}`

    // Copy to clipboard
    await navigator.clipboard.writeText(paymentLink)

    // Show success
    showMessage('✓ Payment link created and copied!', 'success')
    
    // Show the link
    const messageDiv = document.getElementById('message')
    messageDiv.innerHTML += `
      <div class="link-result">
        ${paymentLink}
      </div>
      <button class="btn" onclick="window.open('${paymentLink}', '_blank')">
        Open Payment Page
      </button>
    `

    // Reset form
    document.getElementById('amount').value = ''
    document.getElementById('description').value = ''
    document.querySelectorAll('.quick-amount').forEach(b => b.classList.remove('active'))

  } catch (error) {
    showMessage('Error creating payment link', 'error')
    console.error(error)
  } finally {
    createBtn.disabled = false
    createBtn.innerHTML = 'Create Payment Link'
  }
})

// Open dashboard
document.getElementById('openDashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://noviq.fun/dashboard' })
})

// Settings link
document.getElementById('settingsLink').addEventListener('click', (e) => {
  e.preventDefault()
  chrome.tabs.create({ url: 'https://noviq.fun/login' })
})

// Helper functions
function showMessage(text, type) {
  const messageDiv = document.getElementById('message')
  messageDiv.innerHTML = `<div class="${type}">${text}</div>`
  
  if (type === 'success') {
    setTimeout(() => {
      messageDiv.innerHTML = ''
    }, 3000)
  }
}

function generateId() {
  return Math.random().toString(36).substring(2, 12)
}
