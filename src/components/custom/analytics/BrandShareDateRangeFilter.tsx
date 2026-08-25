'use client'

/**
 * BrandShareDateRangeFilter — date column of the brand-share filter bar.
 * Extracted from BrandShareView (Story 170.4) to keep the View under the
 * 200-line cap; owns the invalid-range inline hint (AC-2): values are
 * RETAINED — no auto-reset — and the hint never disables other branches.
 */
import type { BrandShareDateRange } from '@/types/brand-share'
import { isInvalidBrandShareRange } from './brand-share-view-helpers'

interface BrandShareDateRangeFilterProps {
  dateRange: BrandShareDateRange
  onDateRangeChange: (range: BrandShareDateRange) => void
}

export function BrandShareDateRangeFilter({
  dateRange,
  onDateRangeChange,
}: BrandShareDateRangeFilterProps) {
  const invalid = isInvalidBrandShareRange(dateRange)
  return (
    <div className="flex flex-col gap-1">
      <span id="brand-share-period-label" className="text-xs text-muted-foreground">
        Период (с / по, ГГГГ-ММ-ДД)
      </span>
      <div className="flex items-center gap-2">
        <input
          type="date"
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          value={dateRange.dateFrom ?? ''}
          onChange={e => onDateRangeChange({ ...dateRange, dateFrom: e.target.value || undefined })}
          aria-label="Дата начала периода"
          data-testid="brand-share-date-from"
        />
        <span className="text-muted-foreground">—</span>
        <input
          type="date"
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          value={dateRange.dateTo ?? ''}
          onChange={e => onDateRangeChange({ ...dateRange, dateTo: e.target.value || undefined })}
          aria-label="Дата окончания периода"
          data-testid="brand-share-date-to"
        />
      </div>
      {invalid ? (
        <span className="text-xs text-destructive" data-testid="brand-share-invalid-range">
          Дата начала позже даты окончания
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Без выбора — последние 7 дней</span>
      )}
    </div>
  )
}
