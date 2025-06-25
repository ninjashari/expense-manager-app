/**
 * @file pagination.tsx
 * @description Pagination component for navigating through paginated data.
 * Provides controls for page navigation, page size selection, and displays current page info.
 */

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * Pagination component props
 * @description Interface for pagination component properties
 */
interface PaginationProps {
  /**
   * Current page number (1-based)
   */
  currentPage: number
  /**
   * Total number of items
   */
  totalItems: number
  /**
   * Number of items per page
   */
  pageSize: number
  /**
   * Available page size options
   */
  pageSizeOptions?: number[]
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void
  /**
   * Callback when page size changes
   */
  onPageSizeChange?: (pageSize: number) => void
  /**
   * Whether pagination is disabled
   */
  disabled?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Show page size selector
   */
  showPageSize?: boolean
  /**
   * Show page info text
   */
  showPageInfo?: boolean
}

/**
 * Calculate pagination details
 * @description Calculates total pages and current page range
 * @param totalItems - Total number of items
 * @param pageSize - Items per page
 * @param currentPage - Current page number
 * @returns Pagination calculation results
 */
function usePaginationCalculations(totalItems: number, pageSize: number, currentPage: number) {
  const totalPages = Math.ceil(totalItems / pageSize)
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems)
  const endItem = Math.min(currentPage * pageSize, totalItems)
  
  return {
    totalPages,
    startItem,
    endItem,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  }
}

/**
 * Generate page numbers for pagination display
 * @description Creates array of page numbers to display in pagination
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @param maxVisible - Maximum number of page buttons to show
 * @returns Array of page numbers or ellipsis indicators
 */
function generatePageNumbers(currentPage: number, totalPages: number, maxVisible: number = 7): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = []
  const halfVisible = Math.floor(maxVisible / 2)

  // Always show first page
  pages.push(1)

  if (currentPage <= halfVisible + 2) {
    // Show pages from start
    for (let i = 2; i <= Math.min(maxVisible - 1, totalPages - 1); i++) {
      pages.push(i)
    }
    if (totalPages > maxVisible - 1) {
      pages.push('ellipsis')
    }
  } else if (currentPage >= totalPages - halfVisible - 1) {
    // Show pages from end
    if (totalPages > maxVisible - 1) {
      pages.push('ellipsis')
    }
    for (let i = Math.max(totalPages - maxVisible + 2, 2); i <= totalPages - 1; i++) {
      pages.push(i)
    }
  } else {
    // Show pages around current
    pages.push('ellipsis')
    for (let i = currentPage - halfVisible + 1; i <= currentPage + halfVisible - 1; i++) {
      pages.push(i)
    }
    pages.push('ellipsis')
  }

  // Always show last page if more than 1 page
  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return pages
}

/**
 * Pagination component
 * @description Renders pagination controls with page navigation and optional page size selector
 * @param props - Pagination component props
 * @returns JSX element containing pagination controls
 */
export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  disabled = false,
  className,
  showPageSize = true,
  showPageInfo = true,
}: PaginationProps) {
  const {
    totalPages,
    startItem,
    endItem,
    hasNextPage,
    hasPreviousPage,
  } = usePaginationCalculations(totalItems, pageSize, currentPage)

  const pageNumbers = generatePageNumbers(currentPage, totalPages)

  /**
   * Handle page change with validation
   * @description Ensures page number is within valid range
   * @param page - Target page number
   */
  const handlePageChange = (page: number) => {
    if (disabled) return
    const validPage = Math.max(1, Math.min(page, totalPages))
    if (validPage !== currentPage) {
      onPageChange(validPage)
    }
  }

  /**
   * Handle page size change
   * @description Updates page size and adjusts current page if necessary
   * @param newPageSize - New page size
   */
  const handlePageSizeChange = (newPageSize: string) => {
    if (disabled || !onPageSizeChange) return
    const size = parseInt(newPageSize, 10)
    onPageSizeChange(size)
    
    // Adjust current page to maintain approximate position
    const currentFirstItem = (currentPage - 1) * pageSize + 1
    const newPage = Math.ceil(currentFirstItem / size)
    if (newPage !== currentPage) {
      onPageChange(newPage)
    }
  }

  if (totalItems === 0) {
    return null
  }

  return (
    <div className={cn("flex items-center justify-between px-2", className)}>
      <div className="flex items-center space-x-6 lg:space-x-8">
        {showPageSize && onPageSizeChange && (
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {showPageInfo && (
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            {totalItems > 0 ? (
              <>
                {startItem}-{endItem} of {totalItems}
              </>
            ) : (
              "0 of 0"
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={() => handlePageChange(1)}
          disabled={disabled || !hasPreviousPage}
        >
          <span className="sr-only">Go to first page</span>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={disabled || !hasPreviousPage}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === 'ellipsis' ? (
                <div className="flex h-8 w-8 items-center justify-center">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              ) : (
                <Button
                  variant={page === currentPage ? "default" : "outline"}
                  className="h-8 w-8 p-0"
                  onClick={() => handlePageChange(page)}
                  disabled={disabled}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled || !hasNextPage}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={() => handlePageChange(totalPages)}
          disabled={disabled || !hasNextPage}
        >
          <span className="sr-only">Go to last page</span>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/**
 * Hook for managing pagination state
 * @description Custom hook to manage pagination state and calculations
 * @param totalItems - Total number of items
 * @param initialPageSize - Initial page size
 * @returns Pagination state and handlers
 */
export function usePagination(totalItems: number, initialPageSize: number = 10) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(initialPageSize)

  const { totalPages, startItem, endItem } = usePaginationCalculations(totalItems, pageSize, currentPage)

  // Reset to first page if current page becomes invalid
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages])

  const handlePageChange = React.useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = React.useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    // Adjust current page to maintain approximate position
    const currentFirstItem = (currentPage - 1) * pageSize + 1
    const newPage = Math.ceil(currentFirstItem / newPageSize)
    setCurrentPage(newPage)
  }, [currentPage, pageSize])

  return {
    currentPage,
    pageSize,
    totalPages,
    startItem,
    endItem,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  }
} 