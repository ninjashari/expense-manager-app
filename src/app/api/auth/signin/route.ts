/**
 * @file route.ts (signin)
 * @description This file contains the API route for user authentication.
 * It handles signin requests and creates user sessions.
 */
import { NextRequest, NextResponse } from 'next/server'
import { signInWithPassword } from '@/lib/auth-server'

/**
 * POST handler for user signin
 * @description Handles user authentication requests
 * @param request - Next.js request object
 * @returns Response with session data or error
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Authenticate user
    const { session, error } = await signInWithPassword(email, password)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 401 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Create response with session data
    const response = NextResponse.json(
      { session },
      { status: 200 }
    )

    // Set JWT token in HTTP-only cookie
    response.cookies.set('access_token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Signin API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 