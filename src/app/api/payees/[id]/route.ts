/**
 * @file route.ts (payees/[id])
 * @description This file contains the API route for individual payee operations.
 * It provides endpoints for updating, deleting, and toggling payee status.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { 
  updatePayee, 
  deletePayee,
  togglePayeeStatus
} from '@/lib/services/payee-service'

/**
 * PUT handler for updating payees
 * @description Updates an existing payee
 * @param request - Request object
 * @param params - Route parameters containing payee ID
 * @returns Response with updated payee data
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
    const payee = await updatePayee(id, body, session.user.id)
    
    return NextResponse.json({ payee }, { status: 200 })
  } catch (error) {
    console.error('Update payee API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update payee' },
      { status: 500 }
    )
  }
}

/**
 * DELETE handler for payees
 * @description Deletes a payee
 * @param request - Request object
 * @param params - Route parameters containing payee ID
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
    await deletePayee(id, session.user.id)
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete payee API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete payee' },
      { status: 500 }
    )
  }
}

/**
 * PATCH handler for toggling payee status
 * @description Toggles the active status of a payee
 * @param request - Request object
 * @param params - Route parameters containing payee ID
 * @returns Response with updated payee data
 */
export async function PATCH(
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
    const payee = await togglePayeeStatus(id, session.user.id)
    
    return NextResponse.json({ payee }, { status: 200 })
  } catch (error) {
    console.error('Toggle payee status API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle payee status' },
      { status: 500 }
    )
  }
} 