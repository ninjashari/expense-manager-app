/**
 * @file route.ts (payees)
 * @description This file contains the API route for payee operations.
 * It provides endpoints for fetching, creating, updating, and deleting payees.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { 
  getPayees, 
  createPayee, 
  getActivePayees
} from '@/lib/services/payee-service'

/**
 * GET handler for payees
 * @description Retrieves payees for the authenticated user
 * @returns Response with payees data
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
    const activeOnly = searchParams.get('active') === 'true'

    const payees = activeOnly 
      ? await getActivePayees(session.user.id)
      : await getPayees(session.user.id)
    
    return NextResponse.json({ payees }, { status: 200 })
  } catch (error) {
    console.error('Payees API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payees' },
      { status: 500 }
    )
  }
}

/**
 * POST handler for creating payees
 * @description Creates a new payee for the authenticated user
 * @returns Response with created payee data
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
    const payee = await createPayee(body, session.user.id)
    
    return NextResponse.json({ payee }, { status: 201 })
  } catch (error) {
    console.error('Create payee API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payee' },
      { status: 500 }
    )
  }
} 