/**
 * @file route.ts (credit-card-bills/[id]/payment)
 * @description This file contains the API route for credit card bill payment operations.
 * It provides endpoints for recording payments against credit card bills.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { recordBillPayment } from '@/lib/services/credit-card-bill-service'

/**
 * POST handler for recording bill payments
 * @description Records a payment against a credit card bill
 * @returns Response with updated bill data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { paymentAmount, paymentDate, paymentTransactionId, notes } = body

    if (paymentAmount == null || paymentAmount < 0) {
      return NextResponse.json(
        { error: 'Payment amount must be a valid non-negative number' },
        { status: 400 }
      )
    }

    const bill = await recordBillPayment({
      billId: id,
      paymentAmount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentTransactionId,
      notes
    }, session.user.id)
    
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ bill }, { status: 200 })
  } catch (error) {
    console.error('Record bill payment API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record bill payment' },
      { status: 500 }
    )
  }
} 