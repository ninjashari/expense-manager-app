/**
 * @file route.ts (transactions/[id])
 * @description This file contains the API route for individual transaction operations.
 * It provides endpoints for updating and deleting transactions.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { 
  updateTransaction, 
  deleteTransaction
} from '@/lib/services/transaction-service'

/**
 * PUT handler for updating transactions
 * @description Updates an existing transaction
 * @param request - Request object
 * @param params - Route parameters containing transaction ID
 * @returns Response with updated transaction data
 */
export async function PUT(
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
    const transaction = await updateTransaction(id, body, session.user.id)
    
    return NextResponse.json({ transaction }, { status: 200 })
  } catch (error) {
    console.error('Update transaction API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

/**
 * DELETE handler for transactions
 * @description Deletes a transaction
 * @param request - Request object
 * @param params - Route parameters containing transaction ID
 * @returns Response confirming deletion
 */
export async function DELETE(
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
    await deleteTransaction(id, session.user.id)
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete transaction API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete transaction' },
      { status: 500 }
    )
  }
} 