/**
 * @file page.tsx
 * @description This file defines the transactions page of the expense management application.
 * Currently serves as a placeholder for viewing and managing all transactions.
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"

/**
 * TransactionsPage component
 * @description Renders the transactions management page
 * @returns JSX element containing the transactions page content
 */
export default function TransactionsPage() {
  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              View and manage all your income and expense transactions. All amounts are displayed in Indian Rupees (₹).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">No transactions yet</p>
                <p className="text-sm">Add your first transaction to get started</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
} 