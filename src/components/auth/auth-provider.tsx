/**
 * @file auth-provider.tsx
 * @description This file contains the authentication context provider.
 * It manages user authentication state and provides auth-related functions.
 */
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@/lib/types'

/**
 * Authentication context type definition
 * @description Defines the shape of the authentication context
 */
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

/**
 * Authentication context
 * @description React context for managing authentication state
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider component
 * @description Provides authentication context to child components
 * @param children - Child components to wrap with auth context
 * @returns JSX element providing authentication context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        const session = data.session
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Failed to load session:', error)
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  /**
   * Sign out function
   * @description Signs out the current user
   */
  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Signout error:', error)
    } finally {
      setSession(null)
      setUser(null)
      window.location.href = '/'
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth hook
 * @description Hook to access authentication context
 * @returns Authentication context values
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 