/**
 * Pagination Controls Component
 * 
 * This component provides comprehensive pagination controls including
 * page navigation, page size selection, and pagination information display.
 * It supports both client-side and server-side pagination patterns.
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';

// Pagination metadata interface
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

// Props interface for the component
interface PaginationControlsProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
  showFirstLast?: boolean;
  className?: string;
  isLoading?: boolean;
}

// Default page size options
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Generate page numbers for pagination display
 * Shows current page with surrounding pages and ellipsis for large ranges
 */
const generatePageNumbers = (currentPage: number, totalPages: number): (number | 'ellipsis')[] => {
  const pages: (number | 'ellipsis')[] = [];
  const delta = 2; // Number of pages to show on each side of current page

  // Always show first page
  if (totalPages > 0) {
    pages.push(1);
  }

  // Add ellipsis if there's a gap between 1 and the start of our range
  if (currentPage - delta > 2) {
    pages.push('ellipsis');
  }

  // Add pages around current page
  const start = Math.max(2, currentPage - delta);
  const end = Math.min(totalPages - 1, currentPage + delta);

  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  // Add ellipsis if there's a gap between our range and the last page
  if (currentPage + delta < totalPages - 1) {
    pages.push('ellipsis');
  }

  // Always show last page (if different from first)
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
};

/**
 * Main PaginationControls component
 * Provides comprehensive pagination interface with navigation and settings
 */
export const PaginationControls: React.FC<PaginationControlsProps> = ({
  meta,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showPageSizeSelector = true,
  showPageInfo = true,
  showFirstLast = true,
  className = '',
  isLoading = false,
}) => {
  const {
    currentPage,
    totalPages,
    totalCount,
    hasNextPage,
    hasPrevPage,
    limit,
  } = meta;

  // Calculate display range
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);

  // Generate page numbers for display
  const pageNumbers = generatePageNumbers(currentPage, totalPages);

  // Handle page navigation
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !isLoading) {
      onPageChange(page);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    const pageSize = parseInt(newPageSize, 10);
    if (pageSize !== limit && !isLoading) {
      onPageSizeChange(pageSize);
    }
  };

  // Don't render if no data
  if (totalCount === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Page Information */}
      {showPageInfo && (
        <div className="text-sm text-muted-foreground">
          Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of{' '}
          {totalCount.toLocaleString()} results
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Page Size Selector */}
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select
              value={limit.toString()}
              onValueChange={handlePageSizeChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center gap-1">
          {/* First Page Button */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={!hasPrevPage || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Previous Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevPage || isLoading}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Number Buttons */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) => (
              page === 'ellipsis' ? (
                <div
                  key={`ellipsis-${index}`}
                  className="flex h-8 w-8 items-center justify-center"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              )
            ))}
          </div>

          {/* Next Page Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNextPage || isLoading}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page Button */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={!hasNextPage || isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Simple pagination component for basic use cases
 * Provides minimal pagination controls without advanced features
 */
interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  className?: string;
}

export const SimplePagination: React.FC<SimplePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  className = '',
}) => {
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevPage || isLoading}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>
      
      <span className="text-sm text-muted-foreground px-4">
        Page {currentPage} of {totalPages}
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage || isLoading}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}; 