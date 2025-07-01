/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * @file page.tsx
 * @description This file is the main page for managing credit cards.
 * It displays a list of credit card accounts and provides options to add new cards.
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/components/auth/auth-provider'
import { getAccounts } from '@/lib/services/account-service'
import { Account } from '@/types/account'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'

/**
 * Credit Cards Page
 * @description Main component for the credit cards management page.
 * It fetches and displays all credit card accounts.
 */
export default function CreditCardsPage() {
  const { user } = useAuth()
  const [creditCards, setCreditCards] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadCreditCards = useCallback(async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const accounts = await getAccounts(user.id)
      const creditCardAccounts = accounts.filter(acc => acc.type === 'credit-card')
      setCreditCards(creditCardAccounts)
    } catch {
      toast.error('Failed to load credit card accounts.')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadCreditCards()
  }, [loadCreditCards])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex-1 space-y-6">
          <div className="text-center py-8">
            <div className="text-lg">Loading credit cards...</div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Credit Cards</h1>
          <div className="flex items-center space-x-4">
            <Link href="/accounts/add?type=credit-card">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Card
              </Button>
            </Link>
          </div>
        </div>

        {/* Account Summaries */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {creditCards.map(account => (
            <Card key={account.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{account.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {account.accountNumber ? `...${account.accountNumber.slice(-4)}` : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Current Balance</div>
                    <div className="text-2xl font-bold">{formatCurrency(account.currentBalance)}</div>
                  </div>
                  {account.creditCardInfo && (
                    <div>
                      <div className="text-sm text-muted-foreground">Credit Limit</div>
                      <div className="text-lg font-medium">{formatCurrency(account.creditCardInfo.creditLimit)}</div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex space-x-2">
                <Link href={`/transactions?accountId=${account.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">View Transactions</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {creditCards.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold">No Credit Cards Found</h3>
            <p className="text-muted-foreground mt-2">
              Get started by adding your first credit card account.
            </p>
            <div className="mt-4">
              <Link href="/accounts/add?type=credit-card">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Credit Card
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
} 