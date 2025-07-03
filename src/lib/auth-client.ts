/**
 * @file auth-client.ts
 * @description This file contains client-side authentication functions.
 * It provides JWT-based authentication utilities that can be used in client components.
 */

import { User, Session } from './types'

/**
 * Get token from localStorage
 * @description Retrieves the access token from browser storage
 * @returns Access token string or null if not found
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

/**
 * Store token in localStorage
 * @description Stores the access token in browser storage
 * @param token - JWT token to store
 */
export function storeToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('access_token', token)
}

/**
 * Remove token from localStorage
 * @description Removes the access token from browser storage
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('access_token')
}

/**
 * Store session in localStorage
 * @description Stores the complete session object in browser storage
 * @param session - Session object to store
 */
export function storeSession(session: Session): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('session', JSON.stringify(session))
  localStorage.setItem('access_token', session.access_token)
}

/**
 * Get session from localStorage
 * @description Retrieves the session object from browser storage
 * @returns Session object or null if not found or expired
 */
export function getStoredSession(): Session | null {
  if (typeof window === 'undefined') return null
  
  try {
    const sessionStr = localStorage.getItem('session')
    if (!sessionStr) return null
    
    const session: Session = JSON.parse(sessionStr)
    
    // Check if session is expired
    if (session.expires_at && Date.now() > session.expires_at) {
      removeSession()
      return null
    }
    
    return session
  } catch (error) {
    console.error('Error parsing stored session:', error)
    removeSession()
    return null
  }
}

/**
 * Remove session from localStorage
 * @description Removes the session and token from browser storage
 */
export function removeSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('session')
  localStorage.removeItem('access_token')
}

/**
 * Get current user from stored session
 * @description Retrieves the current user from browser storage
 * @returns User object or null if not authenticated
 */
export function getCurrentUser(): User | null {
  const session = getStoredSession()
  return session?.user || null
}

/**
 * Get current user ID from stored session
 * @description Retrieves the current user ID from browser storage
 * @returns User ID string or null if not authenticated
 */
export function getCurrentUserId(): string | null {
  const user = getCurrentUser()
  return user?.id || null
}

/**
 * Check if user is authenticated
 * @description Checks if there's a valid session stored
 * @returns Boolean indicating authentication status
 */
export function isAuthenticated(): boolean {
  return getStoredSession() !== null
}

/**
 * Sign out user
 * @description Clears all authentication data from browser storage
 */
export function signOut(): void {
  removeSession()
} 