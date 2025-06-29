/**
 * @file route.ts (signout)
 * @description This file contains the API route for user logout.
 * It handles signout requests and clears user sessions.
 */
import { NextResponse } from 'next/server'

/**
 * POST handler for user signout
 * @description Handles user logout requests
 * @param request - Next.js request object
 * @returns Response confirming logout
 */
export async function POST() {
  try {
    // Create response
    const response = NextResponse.json(
      { message: 'Signed out successfully' },
      { status: 200 }
    )

    // Clear the JWT token cookie
    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Signout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 