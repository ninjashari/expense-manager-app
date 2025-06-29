/**
 * @file auth-form.tsx
 * @description This file contains the authentication form component.
 * It provides login and signup functionality with a modern UI.
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard } from 'lucide-react'

/**
 * AuthForm component
 * @description Renders authentication form with login and signup tabs
 * @returns JSX element containing the authentication form
 */
export function AuthForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Database setup check is handled via API error responses

  /**
   * Handle authentication (login or signup)
   * @description Processes user authentication based on the mode
   * @param email - User email
   * @param password - User password
   * @param mode - Authentication mode ('login' or 'signup')
   */
  const handleAuth = async (email: string, password: string, mode: 'login' | 'signup') => {
    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'signup') {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Signup failed')
        }
        
        setMessage({ 
          type: 'success', 
          text: 'Account created successfully! You can now sign in.' 
        })
      } else {
        const response = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Signin failed')
        }
        
        // Redirect to dashboard on successful login
        window.location.href = '/dashboard'
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during authentication'
      setMessage({ 
        type: 'error', 
        text: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * AuthTab component
   * @description Individual tab content for login or signup
   * @param mode - Authentication mode
   * @param buttonText - Submit button text
   */
  const AuthTab = ({ 
    mode, 
    buttonText 
  }: { 
    mode: 'login' | 'signup'
    buttonText: string
  }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      handleAuth(email, password, mode)
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor={`${mode}-email`} className="text-sm font-medium">
            Email
          </label>
          <Input
            id={`${mode}-email`}
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`${mode}-password`} className="text-sm font-medium">
            Password
          </label>
          <Input
            id={`${mode}-password`}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {buttonText}
        </Button>
      </form>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Expense Manager</CardTitle>
          <CardDescription>
            Manage your personal finances with ease
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={`mb-4 ${message.type === 'error' ? 'border-destructive' : 'border-green-500'}`}>
              <AlertDescription className={message.type === 'error' ? 'text-destructive' : 'text-green-600'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              <AuthTab
                mode="login"
                buttonText="Sign In"
              />
            </TabsContent>
            
            <TabsContent value="signup" className="mt-6">
              <AuthTab
                mode="signup"
                buttonText="Create Account"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 