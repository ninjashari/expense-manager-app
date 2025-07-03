/**
 * @file route.ts (session)
 * @description This file contains the API route for getting current session.
 * It retrieves the authenticated user's session information.
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'

/**
 * GET handler for current session
 * @description Retrieves the current user session
 * @param request - Next.js request object
 * @returns Response with session data or null
 */
export async function GET() {
  try {
    const session = await getSession()
    
    return NextResponse.json({ session }, { status: 200 })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json(
      { session: null, error: 'Failed to get session' },
      { status: 500 }
    )
  }
} 