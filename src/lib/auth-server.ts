/**
 * @file auth-server.ts
 * @description This file contains server-side authentication functions.
 * It provides JWT-based authentication with password hashing for server-side use only.
 */
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { queryOne } from './database'

import { User, Session } from './types'

/**
 * JWT configuration
 * @description Environment variables for JWT authentication
 */
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_EXPIRES_IN = '7d' // Token expires in 7 days

/**
 * Hash password using bcrypt
 * @description Hashes a plaintext password for secure storage
 * @param password - Plaintext password
 * @returns Promise resolving to hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify password against hash
 * @description Verifies a plaintext password against a hash
 * @param password - Plaintext password
 * @param hash - Hashed password
 * @returns Promise resolving to boolean indicating match
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate JWT token
 * @description Creates a JWT token for the user
 * @param userId - User ID
 * @returns JWT token string
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Verify JWT token
 * @description Verifies and decodes a JWT token
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded
  } catch {
    return null
  }
}

/**
 * Sign up a new user
 * @description Creates a new user account with email and password
 * @param email - User email
 * @param password - User password
 * @returns Promise resolving to user object or error
 */
export async function signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  try {
    // Check if user already exists
    const existingUser = await queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser) {
      return { user: null, error: 'User with this email already exists' }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const userRow = await queryOne<User>(`
      INSERT INTO users (email, password_hash, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING id, email, created_at, updated_at
    `, [email, hashedPassword])

    if (!userRow) {
      return { user: null, error: 'Failed to create user' }
    }

    return { user: userRow, error: null }
  } catch (error) {
    console.error('Sign up error:', error)
    return { user: null, error: 'An error occurred during sign up' }
  }
}

/**
 * Sign in with email and password
 * @description Authenticates a user with email and password
 * @param email - User email
 * @param password - User password
 * @returns Promise resolving to session object or error
 */
export async function signInWithPassword(email: string, password: string): Promise<{ session: Session | null; error: string | null }> {
  try {
    // Get user with password hash
    const userRow = await queryOne<{ id: string; email: string; password_hash: string; created_at: string; updated_at: string }>(`
      SELECT id, email, password_hash, created_at, updated_at
      FROM users
      WHERE email = $1
    `, [email])

    if (!userRow) {
      return { session: null, error: 'Invalid email or password' }
    }

    // Verify password
    const passwordValid = await verifyPassword(password, userRow.password_hash)
    if (!passwordValid) {
      return { session: null, error: 'Invalid email or password' }
    }

    // Generate token
    const token = generateToken(userRow.id)
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days from now

    // Create session
    const user: User = {
      id: userRow.id,
      email: userRow.email,
      created_at: userRow.created_at,
      updated_at: userRow.updated_at,
    }

    const session: Session = {
      user,
      access_token: token,
      expires_at: expiresAt,
    }

    return { session, error: null }
  } catch (error) {
    console.error('Sign in error:', error)
    return { session: null, error: 'An error occurred during sign in' }
  }
}

/**
 * Get current user from token
 * @description Retrieves user information from JWT token
 * @param token - JWT token string
 * @returns Promise resolving to user object or null
 */
export async function getUser(token: string): Promise<User | null> {
  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }

  try {
    const userRow = await queryOne<User>(`
      SELECT id, email, created_at, updated_at
      FROM users
      WHERE id = $1
    `, [decoded.userId])

    return userRow
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

/**
 * Get session from request
 * @description Extracts and validates session from request cookies
 * @returns Promise resolving to session object or null
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    if (!token) {
      return null
    }

    const user = await getUser(token)
    if (!user) {
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }

    return {
      user,
      access_token: token,
      expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // Extend expiry
    }
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

/**
 * Get current user ID
 * @description Helper function to get current authenticated user ID
 * @returns Promise resolving to user ID or null
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.user?.id || null
} 