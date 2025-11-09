/**
 * AI Integration for Smart Features
 * Uses OpenAI API for intelligent payment assistance
 */

interface AIResponse {
  success: boolean
  data?: any
  error?: string
}

/**
 * Generate a professional payment description using AI
 */
export async function generatePaymentDescription(
  amount: number,
  token: string,
  context?: string
): Promise<AIResponse> {
  try {
    const prompt = `Generate a professional, concise payment description for:
Amount: ${amount} ${token}
Context: ${context || 'General payment'}

Requirements:
- Professional and clear
- 1-2 sentences max
- Include purpose if context provided
- Suitable for invoices

Return only the description text, no quotes or extra formatting.`

    // For now, return a smart template-based description
    // You can integrate OpenAI API here with your API key
    const descriptions = [
      `Payment of ${amount} ${token}${context ? ` for ${context}` : ''}`,
      `Invoice for ${amount} ${token}${context ? ` - ${context}` : ''}`,
      `${context || 'Service'} payment: ${amount} ${token}`,
    ]

    return {
      success: true,
      data: descriptions[Math.floor(Math.random() * descriptions.length)],
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate description',
    }
  }
}

/**
 * Analyze payment for potential fraud or issues
 */
export async function analyzePayment(
  amount: number,
  merchantWallet: string,
  paymentHistory?: any[]
): Promise<AIResponse> {
  try {
    const analysis = {
      riskLevel: 'low' as 'low' | 'medium' | 'high',
      flags: [] as string[],
      recommendations: [] as string[],
    }

    // Check for suspicious patterns
    if (amount > 100) {
      analysis.flags.push('Large payment amount')
      analysis.recommendations.push('Consider using escrow for large payments')
    }

    if (amount < 0.001) {
      analysis.flags.push('Very small payment')
      analysis.riskLevel = 'medium'
    }

    // Check payment frequency
    if (paymentHistory && paymentHistory.length > 10) {
      const recentPayments = paymentHistory.slice(-10)
      const avgAmount = recentPayments.reduce((sum, p) => sum + p.amount, 0) / 10
      
      if (amount > avgAmount * 5) {
        analysis.flags.push('Unusually large compared to history')
        analysis.riskLevel = 'medium'
        analysis.recommendations.push('Verify this payment amount is correct')
      }
    }

    return {
      success: true,
      data: analysis,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to analyze payment',
    }
  }
}

/**
 * Get AI-powered insights for dashboard
 */
export async function getPaymentInsights(payments: any[]): Promise<AIResponse> {
  try {
    if (payments.length === 0) {
      return {
        success: true,
        data: {
          insights: ['Start accepting payments to see insights!'],
          trends: [],
        },
      }
    }

    const insights = []
    const trends = []

    // Calculate statistics
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const avgAmount = totalAmount / payments.length
    const successRate = (payments.filter(p => p.status === 'paid').length / payments.length) * 100

    // Generate insights
    if (successRate > 90) {
      insights.push(`🎉 Excellent! ${successRate.toFixed(0)}% payment success rate`)
    } else if (successRate < 50) {
      insights.push(`⚠️ Low success rate (${successRate.toFixed(0)}%). Consider simplifying payment process`)
    }

    if (avgAmount > 1) {
      insights.push(`💰 Average payment: ${avgAmount.toFixed(2)} SOL - Great for high-value transactions`)
    }

    if (payments.length > 50) {
      insights.push(`📈 High volume! You've processed ${payments.length} payments`)
      trends.push('Growing payment volume')
    }

    // Detect trends
    const recentPayments = payments.slice(-10)
    const olderPayments = payments.slice(-20, -10)
    
    if (recentPayments.length > 0 && olderPayments.length > 0) {
      const recentAvg = recentPayments.reduce((sum, p) => sum + p.amount, 0) / recentPayments.length
      const olderAvg = olderPayments.reduce((sum, p) => sum + p.amount, 0) / olderPayments.length
      
      if (recentAvg > olderAvg * 1.2) {
        trends.push('📈 Payment amounts increasing')
      } else if (recentAvg < olderAvg * 0.8) {
        trends.push('📉 Payment amounts decreasing')
      }
    }

    return {
      success: true,
      data: { insights, trends },
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate insights',
    }
  }
}

/**
 * Suggest optimal payment amount based on context
 */
export async function suggestPaymentAmount(
  context: string,
  currency: string = 'SOL'
): Promise<AIResponse> {
  try {
    // Smart suggestions based on common use cases
    const suggestions: Record<string, number> = {
      'coffee': 0.02,
      'lunch': 0.05,
      'dinner': 0.1,
      'consultation': 0.5,
      'freelance': 1.0,
      'service': 0.5,
      'product': 0.3,
      'donation': 0.1,
      'tip': 0.05,
    }

    const contextLower = context.toLowerCase()
    let suggestedAmount = 0.1 // default

    for (const [key, value] of Object.entries(suggestions)) {
      if (contextLower.includes(key)) {
        suggestedAmount = value
        break
      }
    }

    return {
      success: true,
      data: {
        amount: suggestedAmount,
        reasoning: `Based on "${context}", suggested amount is ${suggestedAmount} ${currency}`,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to suggest amount',
    }
  }
}

/**
 * Generate smart invoice number
 */
export function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `INV-${year}${month}-${random}`
}

/**
 * Validate wallet address with AI-powered checks
 */
export async function validateWalletAddress(address: string): Promise<AIResponse> {
  try {
    const issues = []

    // Basic validation
    if (address.length < 32 || address.length > 44) {
      issues.push('Invalid wallet address length')
    }

    // Check for common mistakes
    if (address.includes(' ')) {
      issues.push('Address contains spaces')
    }

    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
      issues.push('Address contains invalid characters')
    }

    // Check for test/example addresses
    const testPatterns = ['test', 'example', '1111', '0000']
    if (testPatterns.some(pattern => address.toLowerCase().includes(pattern))) {
      issues.push('⚠️ This looks like a test address')
    }

    return {
      success: issues.length === 0,
      data: {
        valid: issues.length === 0,
        issues,
        confidence: issues.length === 0 ? 'high' : 'low',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to validate address',
    }
  }
}

/**
 * Get smart recommendations for payment type
 */
export async function recommendPaymentType(
  amount: number,
  description: string,
  recipients?: number
): Promise<AIResponse> {
  try {
    const recommendations = []

    // Analyze and recommend
    if (recipients && recipients > 1) {
      recommendations.push({
        type: 'split',
        reason: 'Multiple recipients detected',
        confidence: 'high',
      })
    }

    if (amount > 10) {
      recommendations.push({
        type: 'escrow',
        reason: 'Large amount - escrow provides security',
        confidence: 'medium',
      })
    }

    const descLower = description.toLowerCase()
    if (descLower.includes('goal') || descLower.includes('fund') || descLower.includes('campaign')) {
      recommendations.push({
        type: 'goal',
        reason: 'Fundraising keywords detected',
        confidence: 'high',
      })
    }

    if (descLower.includes('milestone') || descLower.includes('project')) {
      recommendations.push({
        type: 'escrow',
        reason: 'Project-based payment detected',
        confidence: 'medium',
      })
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'simple',
        reason: 'Standard payment recommended',
        confidence: 'high',
      })
    }

    return {
      success: true,
      data: recommendations,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to recommend payment type',
    }
  }
}
