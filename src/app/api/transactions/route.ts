/**
 * @file route.ts (transactions)
 * @description This file contains the API route for transaction operations.
 * It provides endpoints for fetching user transactions.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { getTransactions, createTransaction } from '@/lib/services/transaction-service'

/**
 * GET handler for transactions
 * @description Retrieves transactions for the authenticated user
 * @returns Response with transactions data
 */
export async function GET() {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const transactions = await getTransactions(session.user.id)
    
    return NextResponse.json({ transactions }, { status: 200 })
  } catch (error) {
    console.error('Transactions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

/**
 * POST handler for creating transactions
 * @description Creates a new transaction for the authenticated user
 * @returns Response with created transaction data
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const transaction = await createTransaction(body, session.user.id)
    
    return NextResponse.json({ transaction }, { status: 201 })
  } catch (error) {
    console.error('Create transaction API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create transaction' },
      { status: 500 }
    )
  }
} 