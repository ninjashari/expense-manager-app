/**
 * @file route.ts (signup)
 * @description This file contains the API route for user registration.
 * It handles signup requests and creates new user accounts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { signUp } from '@/lib/auth-server'

/**
 * POST handler for user signup
 * @description Handles user registration requests
 * @param request - Next.js request object
 * @returns Response with user data or error
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Create user
    const { user, error } = await signUp(email, password)

    if (error) {
      return NextResponse.json(
        { error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 