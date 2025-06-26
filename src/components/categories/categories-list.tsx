/**
 * @file categories-list.tsx
 * @description This file contains the categories list component for displaying all user categories.
 * It provides functionality to view, edit, delete, and toggle status of categories.
 */

"use client"

import { useState, useMemo } from "react"
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pagination, usePagination } from "@/components/ui/pagination"
import { Category } from "@/types/category"

/**
 * Props interface for CategoriesList component
 * @description Defines the properties passed to the CategoriesList component
 */
interface CategoriesListProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (categoryId: string) => Promise<void>
  onToggleStatus: (categoryId: string) => Promise<void>
}

/**
 * CategoriesList component
 * @description Renders a table of categories with management actions
 * @param categories - Array of categories to display
 * @param onEdit - Function called when editing a category
 * @param onDelete - Function called when deleting a category
 * @param onToggleStatus - Function called when toggling category status
 * @param isLoading - Whether the list is in a loading state
 * @returns JSX element containing the categories list
 */
export function CategoriesList({ 
  categories, 
  onEdit, 
  onDelete, 
  onToggleStatus
}: CategoriesListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Pagination state management
  const {
    currentPage,
    pageSize,
    onPageChange,
    onPageSizeChange,
  } = usePagination(categories.length, 10)

  // Get paginated categories
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return categories.slice(startIndex, endIndex)
  }, [categories, currentPage, pageSize])

  /**
   * Handle delete confirmation
   * @description Opens the delete confirmation dialog
   * @param category - Category to delete
   */
  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  /**
   * Handle delete confirmation
   * @description Confirms and processes category deletion
   */
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    setActionLoading(`delete-${categoryToDelete.id}`)
    try {
      await onDelete(categoryToDelete.id)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    } catch (error) {
      console.error('Error deleting category:', error)
    } finally {
      setActionLoading(null)
    }
  }

  /**
   * Handle status toggle
   * @description Toggles the active status of a category
   * @param category - Category to toggle
   */
  const handleToggleStatus = async (category: Category) => {
    setActionLoading(`toggle-${category.id}`)
    try {
      await onToggleStatus(category.id)
    } catch (error) {
      console.error('Error toggling category status:', error)
    } finally {
      setActionLoading(null)
    }
  }

  /**
   * Format date for display
   * @description Formats a date object for user-friendly display
   * @param date - Date to format
   * @returns Formatted date string
   */
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Categories ({categories.length})</CardTitle>
          <CardDescription>
            Manage your expense categories for better organization and reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">No categories yet</p>
                <p className="text-sm">Create your first category to organize expenses</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.displayName}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate">
                            {category.description || (
                              <span className="text-muted-foreground text-sm">No description</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={category.isActive ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => handleToggleStatus(category)}
                          >
                            {actionLoading === `toggle-${category.id}` ? (
                              <div className="mr-1 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                            ) : category.isActive ? (
                              <Eye className="mr-1 h-3 w-3" />
                            ) : (
                              <EyeOff className="mr-1 h-3 w-3" />
                            )}
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(category.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onEdit(category)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(category)}
                                disabled={actionLoading === `toggle-${category.id}`}
                              >
                                {category.isActive ? (
                                  <>
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(category)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalItems={categories.length}
                  pageSize={pageSize}
                  onPageChange={onPageChange}
                  onPageSizeChange={onPageSizeChange}
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{categoryToDelete?.displayName}&rdquo;? 
              This action cannot be undone and may affect your transaction history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setCategoryToDelete(null)
              }}
              disabled={actionLoading === `delete-${categoryToDelete?.id}`}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={actionLoading === `delete-${categoryToDelete?.id}`}
            >
              {actionLoading === `delete-${categoryToDelete?.id}` ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 