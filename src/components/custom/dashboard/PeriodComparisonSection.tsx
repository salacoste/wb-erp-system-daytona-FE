/**
 * Period Comparison Section Component
 * Story 63.11-FE: WoW/MoM Period Comparison Cards
 *
 * Main section displaying 6 comparison metric cards with WoW/MoM toggle.
 *
 * @see docs/stories/epic-63/story-63.11-fe-period-comparison-cards.md
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ComparisonModeToggle } from './ComparisonModeToggle'
import { PeriodComparisonCard } from './PeriodComparisonCard'
import { PeriodComparisonSkeleton } from './PeriodComparisonSkeleton'
import { useAnalyticsComparison } from '@/hooks/comparison'
import {
  getComparisonPeriods,
  formatPeriodLabel,
  COMPARISON_MODE_STORAGE_KEY,
  type ComparisonMode,
} from '@/lib/period-comparison-helpers'
import { cn } from '@/lib/utils'

export interface PeriodComparisonSectionProps {
  /** Current week in ISO format (e.g., "2026-W05") */
  currentWeek: string
  /** Additional CSS classes */
  className?: string
}

/** Metric configuration for rendering cards */
interface MetricConfig {
  key: 'revenue' | 'profit' | 'margin_pct' | 'orders' | 'logistics' | 'storage'
  title: string
  format: 'currency' | 'percentage' | 'number'
  invertDirection: boolean
}

/** Top row metrics (4 cards) */
const TOP_METRICS: MetricConfig[] = [
  { key: 'revenue', title: 'Выручка', format: 'currency', invertDirection: false },
  { key: 'profit', title: 'Прибыль', format: 'currency', invertDirection: false },
  { key: 'margin_pct', title: 'Маржа', format: 'percentage', invertDirection: false },
  { key: 'orders', title: 'Заказы', format: 'number', invertDirection: false },
]

/** Bottom row metrics (2 cards - expenses) */
const EXPENSE_METRICS: MetricConfig[] = [
  { key: 'logistics', title: 'Логистика', format: 'currency', invertDirection: true },
  { key: 'storage', title: 'Хранение', format: 'currency', invertDirection: true },
]

/**
 * Period comparison section with WoW/MoM toggle
 */
export function PeriodComparisonSection({
  currentWeek,
  className,
}: PeriodComparisonSectionProps): React.ReactElement {
  // Mode state with localStorage persistence
  const [mode, setMode] = useState<ComparisonMode>(() => {
    if (typeof window === 'undefined') return 'wow'
    const stored = localStorage.getItem(COMPARISON_MODE_STORAGE_KEY)
    return (stored as ComparisonMode) || 'wow'
  })

  // Persist mode preference
  useEffect(() => {
    localStorage.setItem(COMPARISON_MODE_STORAGE_KEY, mode)
  }, [mode])

  // Calculate periods based on mode
  const { period1, period2 } = useMemo(
    () => getComparisonPeriods(currentWeek, mode),
    [currentWeek, mode]
  )

  // Fetch comparison data
  const { data, isLoading, error, refetch } = useAnalyticsComparison({
    period1,
    period2,
    enabled: !!currentWeek,
  })

  // Format period labels
  const currentLabel = formatPeriodLabel(period1)
  const previousLabel = formatPeriodLabel(period2)

  // Loading state
  if (isLoading) return <PeriodComparisonSkeleton className={className} />

  // Error state
  if (error) {
    return (
      <section aria-label="Сравнение периодов" className={className}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Сравнение периодов</h2>
          <ComparisonModeToggle mode={mode} onChange={setMode} />
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Ошибка загрузки данных сравнения</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      </section>
    )
  }

  // Helper to get metric value
  const getValue = (period: 'period1' | 'period2', key: MetricConfig['key']): number | null => {
    if (!data) return null
    return data[period][key] ?? null
  }

  // Helper to get delta
  const getDelta = (key: MetricConfig['key']) => {
    if (!data?.delta) return null
    return data.delta[key] ?? null
  }

  return (
    <section role="region" aria-label="Сравнение периодов" className={className}>
      {/* Header with toggle */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Сравнение периодов</h2>
        <ComparisonModeToggle mode={mode} onChange={setMode} disabled={isLoading} />
      </div>

      {/* Top row: 4 cards (Revenue, Profit, Margin, Orders) */}
      <div className={cn('grid gap-4', 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4')}>
        {TOP_METRICS.map(metric => (
          <PeriodComparisonCard
            key={metric.key}
            title={metric.title}
            currentValue={getValue('period1', metric.key)}
            previousValue={getValue('period2', metric.key)}
            delta={getDelta(metric.key)}
            currentPeriodLabel={currentLabel}
            previousPeriodLabel={previousLabel}
            format={metric.format}
            invertDirection={metric.invertDirection}
          />
        ))}
      </div>

      {/* Bottom row: 2 cards (Logistics, Storage - expenses) */}
      <div className={cn('mt-4 grid gap-4', 'grid-cols-1 md:grid-cols-2')}>
        {EXPENSE_METRICS.map(metric => (
          <PeriodComparisonCard
            key={metric.key}
            title={metric.title}
            currentValue={getValue('period1', metric.key)}
            previousValue={getValue('period2', metric.key)}
            delta={getDelta(metric.key)}
            currentPeriodLabel={currentLabel}
            previousPeriodLabel={previousLabel}
            format={metric.format}
            invertDirection={metric.invertDirection}
          />
        ))}
      </div>
    </section>
  )
}
