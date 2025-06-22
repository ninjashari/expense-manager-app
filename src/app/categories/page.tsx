/**
 * @file page.tsx
 * @description This file defines the categories page of the expense management application.
 * Currently serves as a placeholder for organizing expenses by categories.
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"

/**
 * CategoriesPage component
 * @description Renders the categories management page
 * @returns JSX element containing the categories page content
 */
export default function CategoriesPage() {
  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>
              Organize your expenses into categories for better tracking and reporting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">No categories yet</p>
                <p className="text-sm">Create your first category to organize expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
} 