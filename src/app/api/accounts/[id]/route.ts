/**
 * @file route.ts (accounts/[id])
 * @description This file contains the API route for individual account operations.
 * It provides endpoints for updating and deleting accounts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { 
  updateAccount, 
  deleteAccount
} from '@/lib/services/account-service'

/**
 * PUT handler for updating accounts
 * @description Updates an existing account
 * @param request - Request object
 * @param params - Route parameters containing account ID
 * @returns Response with updated account data
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
    const account = await updateAccount(id, body, session.user.id)
    
    return NextResponse.json({ account }, { status: 200 })
  } catch (error) {
    console.error('Update account API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update account' },
      { status: 500 }
    )
  }
}

/**
 * DELETE handler for accounts
 * @description Deletes an account
 * @param request - Request object
 * @param params - Route parameters containing account ID
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
    await deleteAccount(id, session.user.id)
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete account API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete account' },
      { status: 500 }
    )
  }
} 