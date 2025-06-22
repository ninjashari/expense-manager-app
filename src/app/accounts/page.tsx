/**
 * @file page.tsx
 * @description This file defines the accounts page of the expense management application.
 * Currently serves as a placeholder for managing bank accounts and wallets.
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"

/**
 * AccountsPage component
 * @description Renders the accounts management page
 * @returns JSX element containing the accounts page content
 */
export default function AccountsPage() {
  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Accounts</CardTitle>
            <CardDescription>
              Manage your bank accounts, credit cards, and wallets here. All amounts will be displayed in Indian Rupees (₹).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">No accounts yet</p>
                <p className="text-sm">Add your first account to get started</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
} 