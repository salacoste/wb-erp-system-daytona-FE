'use client'

/**
 * BrandShareView — PR4b container for the brand competitive-positioning page.
 * Reference: docs/request-backend/225-brand-share-backend-contract.md
 *
 * Cascading flow: brand Select → category (parent-subject) Select → date range →
 * `<BrandShareChart>`. Loading skeletons, empty state, and a friendly RU 503
 * error state (upstream WB failure). Null percents render «—» (AP#8) via the chart.
 *
 * Story 170.4: span-pseudo-labels → id + aria-labelledby (visible and
 * programmatic name unified); filter context (brand/category/period) threaded
 * into the chart card subtitle; SelectTrigger/retry Button ≥44px (min-h-11).
 */
import { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import {
  useBrandShareBrands,
  useBrandShareParentSubjects,
  useBrandShareReport,
} from '@/hooks/useBrandShare'
import { BrandShareChart } from './BrandShareChart'
import { BrandShareDateRangeFilter } from './BrandShareDateRangeFilter'
import {
  formatBrandSharePeriodLabel,
  resolveBrandShareCategoryName,
} from './brand-share-view-helpers'
import type { BrandShareDateRange } from '@/types/brand-share'

interface BrandShareViewProps {
  /** Selected brand, or null. */
  brand: string | null
  /** Selected WB parent-subject id, or null. */
  parentId: number | null
  /** Optional YYYY-MM-DD window. */
  dateRange: BrandShareDateRange
  onBrandChange: (brand: string | null) => void
  onParentIdChange: (parentId: number | null) => void
  onDateRangeChange: (range: BrandShareDateRange) => void
}

const NONE = '__NONE__'

function errorMessageFor(error: unknown): string {
  const status = (error as { status?: number } | null | undefined)?.status
  if (status === 503) {
    return 'Сервис Wildberries временно недоступен. Повторите попытку позже.'
  }
  return 'Не удалось загрузить данные о доле бренда. Попробуйте обновить.'
}

export function BrandShareView({
  brand,
  parentId,
  dateRange,
  onBrandChange,
  onParentIdChange,
  onDateRangeChange,
}: BrandShareViewProps) {
  const brandsQuery = useBrandShareBrands()
  const subjectsQuery = useBrandShareParentSubjects(brand, dateRange)
  const reportQuery = useBrandShareReport(brand, parentId, dateRange)

  const handleBrandChange = (v: string) => {
    onBrandChange(v === NONE ? null : v)
    // Reset the downstream category — its options depend on the brand.
    onParentIdChange(null)
  }

  const handleParentChange = (v: string) => {
    onParentIdChange(v === NONE ? null : Number(v))
  }

  const subjects = subjectsQuery.data ?? []
  const report = reportQuery.data?.report ?? []
  const categoryName = resolveBrandShareCategoryName(subjects, parentId)
  const periodLabel = formatBrandSharePeriodLabel(dateRange)

  const reportErrorEl = useMemo(() => {
    if (!reportQuery.error) return null
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <AlertTriangle
            className="h-8 w-8 text-status-warning"
            data-testid="brand-share-error-icon"
          />
          <p className="text-sm text-muted-foreground" data-testid="brand-share-error">
            {errorMessageFor(reportQuery.error)}
          </p>
          {/* min-h-11: 44×44 epic-AX target; first custom/analytics precedent (Story 170.4). */}
          <Button
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => reportQuery.refetch()}
            data-testid="brand-share-retry"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
        </CardContent>
      </Card>
    )
  }, [reportQuery.error, reportQuery.refetch])

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <Card>
        <CardContent className="grid gap-4 py-4 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span id="brand-share-brand-label" className="text-xs text-muted-foreground">
              Бренд
            </span>
            <Select
              value={brand ?? NONE}
              onValueChange={handleBrandChange}
              disabled={brandsQuery.isLoading}
            >
              <SelectTrigger
                aria-labelledby="brand-share-brand-label"
                className="min-h-11 bg-background text-foreground"
                data-testid="brand-share-brand-select"
              >
                <SelectValue placeholder="Выберите бренд" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— не выбран —</SelectItem>
                {(brandsQuery.data ?? []).map(b => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {brandsQuery.isLoading && (
              <Skeleton className="h-3 w-24" data-testid="brand-share-brands-skeleton" />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span id="brand-share-parent-label" className="text-xs text-muted-foreground">
              Категория (родительский предмет)
            </span>
            <Select
              value={parentId != null ? String(parentId) : NONE}
              onValueChange={handleParentChange}
              disabled={!brand || subjectsQuery.isLoading}
            >
              <SelectTrigger
                aria-labelledby="brand-share-parent-label"
                className="min-h-11 bg-background text-foreground"
                data-testid="brand-share-parent-select"
              >
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— не выбрана —</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s.parentId} value={String(s.parentId)}>
                    {s.parentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!brand && (
              <span className="text-xs text-muted-foreground">Сначала выберите бренд</span>
            )}
          </div>

          <BrandShareDateRangeFilter dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
        </CardContent>
      </Card>

      {/* Chart area */}
      {reportQuery.isLoading ? (
        <Card>
          <CardContent className="py-4">
            <Skeleton className="h-72 w-full" data-testid="brand-share-report-skeleton" />
          </CardContent>
        </Card>
      ) : reportErrorEl ? (
        reportErrorEl
      ) : (
        <BrandShareChart
          data={report}
          brand={brand}
          categoryName={categoryName}
          periodLabel={periodLabel}
        />
      )}
    </div>
  )
}
