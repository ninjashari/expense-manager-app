/**
 * @file protected-route.tsx
 * @description This component protects routes by requiring authentication.
 * It redirects unauthenticated users to the home page.
 */
'use client'

import { useAuth } from './auth-provider'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

/**
 * ProtectedRoute component
 * @description Wraps pages that require authentication
 * @param children - The protected page content
 * @returns JSX element or redirects to home if not authenticated
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      redirect('/')
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to home
  }

  return <>{children}</>
} 