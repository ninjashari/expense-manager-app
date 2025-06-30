/**
 * @file route.ts (credit-card-bills/[id])
 * @description This file contains the API route for individual credit card bill operations.
 * It provides endpoints for updating and deleting specific credit card bills.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { 
  updateCreditCardBill,
  deleteCreditCardBill,
  getCreditCardBillById 
} from '@/lib/services/credit-card-bill-service'

/**
 * GET handler for individual credit card bill
 * @description Retrieves a specific credit card bill by ID
 * @returns Response with bill data
 */
export async function GET(
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
    const bill = await getCreditCardBillById(id, session.user.id)
    
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ bill }, { status: 200 })
  } catch (error) {
    console.error('Get credit card bill API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit card bill' },
      { status: 500 }
    )
  }
}

/**
 * PUT handler for updating credit card bills
 * @description Updates a specific credit card bill
 * @returns Response with updated bill data
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
    const bill = await updateCreditCardBill(id, body, session.user.id)
    
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ bill }, { status: 200 })
  } catch (error) {
    console.error('Update credit card bill API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update credit card bill' },
      { status: 500 }
    )
  }
}

/**
 * DELETE handler for credit card bills
 * @description Deletes a specific credit card bill
 * @returns Response with success status
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
    const success = await deleteCreditCardBill(id, session.user.id)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete credit card bill API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete credit card bill' },
      { status: 500 }
    )
  }
} 