/**
 * @file page.tsx
 * @description This file defines the main page of the application.
 * It serves as the authentication entry point, showing login and signup options.
 */
'use client'

import { useAuth } from '@/components/auth/auth-provider'
import { AuthForm } from '@/components/auth/auth-form'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Home component
 * @description Shows authentication form for unauthenticated users, redirects authenticated users to dashboard
 */
export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

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

  if (user) {
    return null // Will redirect to dashboard
  }

  return <AuthForm />
}
