/**
 * @file route.ts (accounts)
 * @description This file contains the API route for account operations.
 * It provides endpoints for fetching user accounts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { getAccounts, createAccount } from '@/lib/services/account-service'

/**
 * GET handler for accounts
 * @description Retrieves accounts for the authenticated user
 * @returns Response with accounts data
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

    const accounts = await getAccounts(session.user.id)
    
    return NextResponse.json({ accounts }, { status: 200 })
  } catch (error) {
    console.error('Accounts API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

/**
 * POST handler for creating accounts
 * @description Creates a new account for the authenticated user
 * @returns Response with created account data
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
    const account = await createAccount(body, session.user.id)
    
    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    console.error('Create account API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create account' },
      { status: 500 }
    )
  }
} 