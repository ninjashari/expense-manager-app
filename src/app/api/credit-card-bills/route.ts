/**
 * @file route.ts (credit-card-bills)
 * @description This file contains the API route for credit card bill operations.
 * It provides endpoints for fetching, creating, and managing credit card bills.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { 
  getCreditCardBills, 
  createCreditCardBill,
  autoGenerateBillsForUser 
} from '@/lib/services/credit-card-bill-service'

/**
 * GET handler for credit card bills
 * @description Retrieves credit card bills for the authenticated user
 * @returns Response with bills data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const autoGenerate = searchParams.get('autoGenerate') === 'true'

    // Auto-generate bills if requested
    if (autoGenerate) {
      await autoGenerateBillsForUser(session.user.id)
    }

    const bills = await getCreditCardBills(session.user.id, accountId || undefined)
    
    return NextResponse.json({ bills }, { status: 200 })
  } catch (error) {
    console.error('Credit card bills API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit card bills' },
      { status: 500 }
    )
  }
}

/**
 * POST handler for creating credit card bills
 * @description Creates a new credit card bill for the authenticated user
 * @returns Response with created bill data
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
    const bill = await createCreditCardBill(body, session.user.id)
    
    return NextResponse.json({ bill }, { status: 201 })
  } catch (error) {
    console.error('Create credit card bill API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create credit card bill' },
      { status: 500 }
    )
  }
} 