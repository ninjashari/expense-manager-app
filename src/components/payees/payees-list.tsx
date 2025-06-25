/**
 * @file payees-list.tsx
 * @description This file contains the payees list component for displaying all user payees.
 * It provides functionality to view, edit, delete, and toggle status of payees.
 */

"use client"

import { useState, useMemo } from "react"
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pagination, usePagination } from "@/components/ui/pagination"
import { Payee } from "@/types/payee"
import { Category } from "@/types/category"

/**
 * Props interface for PayeesList component
 * @description Defines the properties passed to the PayeesList component
 */
interface PayeesListProps {
  payees: Payee[]
  categories: Category[]
  onEdit: (payee: Payee) => void
  onDelete: (payeeId: string) => Promise<void>
  onToggleStatus: (payeeId: string) => Promise<void>
}

/**
 * PayeesList component
 * @description Renders a table of payees with management actions
 * @param payees - Array of payees to display
 * @param onEdit - Function called when editing a payee
 * @param onDelete - Function called when deleting a payee
 * @param onToggleStatus - Function called when toggling payee status
 * @returns JSX element containing the payees list
 */
export function PayeesList({ 
  payees, 
  categories,
  onEdit, 
  onDelete, 
  onToggleStatus
}: PayeesListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [payeeToDelete, setPayeeToDelete] = useState<Payee | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Pagination state management
  const {
    currentPage,
    pageSize,
    onPageChange,
    onPageSizeChange,
  } = usePagination(payees.length, 10)

  // Get paginated payees
  const paginatedPayees = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return payees.slice(startIndex, endIndex)
  }, [payees, currentPage, pageSize])

  /**
   * Get category display name by category name
   * @description Finds the category display name from the categories list
   * @param categoryName - Category name to look up
   * @returns Category display name or the original name if not found
   */
  const getCategoryDisplayName = (categoryName: string): string => {
    const category = categories.find(cat => cat.name === categoryName)
    return category ? category.displayName : categoryName
  }

  /**
   * Handle delete confirmation
   * @description Opens the delete confirmation dialog
   * @param payee - Payee to delete
   */
  const handleDeleteClick = (payee: Payee) => {
    setPayeeToDelete(payee)
    setDeleteDialogOpen(true)
  }

  /**
   * Handle delete confirmation
   * @description Confirms and processes payee deletion
   */
  const handleDeleteConfirm = async () => {
    if (!payeeToDelete) return

    setActionLoading(`delete-${payeeToDelete.id}`)
    try {
      await onDelete(payeeToDelete.id)
      setDeleteDialogOpen(false)
      setPayeeToDelete(null)
    } catch (error) {
      console.error('Error deleting payee:', error)
    } finally {
      setActionLoading(null)
    }
  }

  /**
   * Handle status toggle
   * @description Toggles the active status of a payee
   * @param payee - Payee to toggle
   */
  const handleToggleStatus = async (payee: Payee) => {
    setActionLoading(`toggle-${payee.id}`)
    try {
      await onToggleStatus(payee.id)
    } catch (error) {
      console.error('Error toggling payee status:', error)
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

  /**
   * Get category badge variant based on category
   * @description Returns appropriate badge variant for category
   * @param category - Category string
   * @returns Badge variant
   */
  const getCategoryVariant = (category?: string) => {
    if (!category) return "outline"
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      retail: "default",
      utilities: "secondary",
      healthcare: "default",
      transportation: "secondary",
      dining: "default",
      entertainment: "secondary",
      services: "default",
      government: "secondary",
      financial: "default",
      personal: "secondary",
    }
    return variants[category] || "outline"
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payees ({payees.length})</CardTitle>
          <CardDescription>
            Manage your payees for better transaction tracking and reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payees.length === 0 ? (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No payees yet</p>
                <p className="text-sm">Create your first payee to track payments</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayees.map((payee) => (
                      <TableRow key={payee.id}>
                        <TableCell className="font-medium">
                          {payee.displayName}
                        </TableCell>
                        <TableCell>
                          {payee.category ? (
                            <Badge variant={getCategoryVariant(payee.category)} className="text-xs">
                              {getCategoryDisplayName(payee.category)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No category</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate">
                            {payee.description || (
                              <span className="text-muted-foreground text-sm">No description</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={payee.isActive ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => handleToggleStatus(payee)}
                          >
                            {actionLoading === `toggle-${payee.id}` ? (
                              <div className="mr-1 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                            ) : payee.isActive ? (
                              <Eye className="mr-1 h-3 w-3" />
                            ) : (
                              <EyeOff className="mr-1 h-3 w-3" />
                            )}
                            {payee.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(payee.createdAt)}
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
                              <DropdownMenuItem onClick={() => onEdit(payee)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(payee)}
                                disabled={actionLoading === `toggle-${payee.id}`}
                              >
                                {payee.isActive ? (
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
                                onClick={() => handleDeleteClick(payee)}
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
                  totalItems={payees.length}
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
            <DialogTitle>Delete Payee</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{payeeToDelete?.displayName}&rdquo;? 
              This action cannot be undone and may affect your transaction history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setPayeeToDelete(null)
              }}
              disabled={actionLoading === `delete-${payeeToDelete?.id}`}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={actionLoading === `delete-${payeeToDelete?.id}`}
            >
              {actionLoading === `delete-${payeeToDelete?.id}` ? (
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