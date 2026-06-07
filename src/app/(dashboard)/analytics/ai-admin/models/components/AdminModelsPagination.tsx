'use client'

import { Button } from '@/components/ui/button'

/**
 * AdminModelsPagination — simple prev/next page controls.
 * Extracted from AdminModelsList.tsx for file-size compliance (205 → ~150 lines).
 */

interface AdminModelsPaginationProps {
  page: number
  totalPages: number
  total: number
  onPageChange: (fn: (p: number) => number) => void
}

export function AdminModelsPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: AdminModelsPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>Всего: {total}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(p => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          ←
        </Button>
        <span>
          Стр. {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          →
        </Button>
      </div>
    </div>
  )
}
