"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showPageNumbers?: number // Number of page numbers to show around current page
  className?: string
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showPageNumbers = 5,
  className = ""
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const halfVisible = Math.floor(showPageNumbers / 2)
    let start = Math.max(1, currentPage - halfVisible)
    let end = Math.min(totalPages, currentPage + halfVisible)

    // Adjust if we're near the beginning or end
    if (end - start + 1 < showPageNumbers) {
      if (start === 1) {
        end = Math.min(totalPages, start + showPageNumbers - 1)
      } else {
        start = Math.max(1, end - showPageNumbers + 1)
      }
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const visiblePages = getVisiblePages()
  const showFirstEllipsis = visiblePages[0] > 1
  const showLastEllipsis = visiblePages[visiblePages.length - 1] < totalPages

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {/* First page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
        title="First page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* Previous page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
        title="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* First page number (if not in visible range) */}
      {showFirstEllipsis && (
        <>
          <Button
            variant={1 === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(1)}
            className="h-8 w-8 p-0"
          >
            1
          </Button>
          {visiblePages[0] > 2 && (
            <span className="text-gray-400 px-1">...</span>
          )}
        </>
      )}

      {/* Visible page numbers */}
      {visiblePages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
          className="h-8 w-8 p-0"
        >
          {page}
        </Button>
      ))}

      {/* Last page number (if not in visible range) */}
      {showLastEllipsis && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="text-gray-400 px-1">...</span>
          )}
          <Button
            variant={totalPages === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className="h-8 w-8 p-0"
          >
            {totalPages}
          </Button>
        </>
      )}

      {/* Next page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
        title="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Last page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
        title="Last page"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Helper component to show pagination info
interface PaginationInfoProps {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  className?: string
}

export function PaginationInfo({ currentPage, itemsPerPage, totalItems, className = "" }: PaginationInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      Showing {startItem} to {endItem} of {totalItems} results
    </div>
  )
}