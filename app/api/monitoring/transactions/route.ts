/**
 * Transaction Monitoring API
 * Provides transaction metrics, status, and anomaly detection
 */

import { NextRequest, NextResponse } from 'next/server'
import { transactionMonitor } from '@/lib/transaction-monitor'
import { logger } from '@/lib/logging'

// ============================================
// GET - Get transaction metrics and status
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const id = searchParams.get('id')
    const escrowId = searchParams.get('escrowId')
    const severity = searchParams.get('severity') as any

    // Get metrics
    if (action === 'metrics') {
      const metrics = transactionMonitor.getMetrics()
      
      return NextResponse.json({
        success: true,
        metrics,
      })
    }

    // Get specific transaction
    if (action === 'transaction' && id) {
      const transaction = transactionMonitor.getTransaction(id)
      
      if (!transaction) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        transaction,
      })
    }

    // Get transactions by escrow
    if (action === 'escrow' && escrowId) {
      const transactions = transactionMonitor.getTransactionsByEscrow(escrowId)
      
      return NextResponse.json({
        success: true,
        transactions,
      })
    }

    // Get anomalies
    if (action === 'anomalies') {
      const anomalies = transactionMonitor.getAnomalies(severity)
      
      return NextResponse.json({
        success: true,
        anomalies,
      })
    }

    // Export transactions
    if (action === 'export') {
      const format = searchParams.get('format') as 'json' | 'csv' || 'json'
      const data = transactionMonitor.exportTransactions(format)
      
      const contentType = format === 'json' ? 'application/json' : 'text/csv'
      const filename = `transactions-${new Date().toISOString()}.${format}`
      
      return new NextResponse(data, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // Default: return overview
    const metrics = transactionMonitor.getMetrics()
    const anomalies = transactionMonitor.getAnomalies('high')
    
    return NextResponse.json({
      success: true,
      metrics,
      criticalAnomalies: anomalies.filter(a => a.severity === 'critical').length,
      highAnomalies: anomalies.filter(a => a.severity === 'high').length,
    })
  } catch (error: any) {
    logger.error('transaction', 'Error fetching transaction monitoring data', {
      error: error.message,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Check transaction status or retry
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, id, signature, type, escrowId } = body

    // Check transaction status
    if (action === 'check' && id) {
      const record = await transactionMonitor.checkTransactionStatus(id)
      
      if (!record) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        transaction: record,
      })
    }

    // Register new transaction for monitoring
    if (action === 'register' && signature && type) {
      const txId = transactionMonitor.registerTransaction(
        signature,
        type,
        escrowId,
        body.metadata
      )
      
      return NextResponse.json({
        success: true,
        id: txId,
      })
    }

    // Clear old records
    if (action === 'cleanup') {
      const hours = body.hours || 24
      transactionMonitor.clearOldRecords(hours)
      
      return NextResponse.json({
        success: true,
        message: `Cleared records older than ${hours} hours`,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    logger.error('transaction', 'Error in transaction monitoring operation', {
      error: error.message,
    })

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
