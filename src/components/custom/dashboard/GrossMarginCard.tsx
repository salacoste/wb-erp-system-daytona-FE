/**
 * Gross Margin Card — Request #155: TRUE Gross Margin
 * Shows gross_margin_pct = (revenue_net − COGS) / revenue_net × 100.
 * Weighted by SKU revenue from weekly_margin_fact.
 * Comparison in percentage points (п.п.).
 */

'use client'

import { Percent, Info, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatPercentage, formatPercentageInt, formatPercentagePoints } from '@/lib/utils'
import { HighlightedMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface GrossMarginCardProps {
  grossMarginPct: number | null | undefined
  previousGrossMarginPct: number | null | undefined
  cogsCoverage: number
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  onAssignCogs?: () => void
  className?: string
}

// iter-120: same profit-vs-loss fix as MarginCard — the <30% band was a single red, painting a
// positive-but-low gross margin (e.g. +20%) identically to a LOSS (e.g. −10%, possible when
// COGS > net revenue). Per the Defensive Frontend Principle, split into 0–30% orange ("низкая
// наценка") and <0% red ("убыток"). Semantic status tokens since 172.1; the weakest positive
// band dims the warning tone for a 4-state scale (same idiom as TopProductsTableRow).
function getMarginColor(pct: number): string {
  if (pct >= 50) return 'text-status-success'
  if (pct >= 30) return 'text-status-warning'
  if (pct >= 0) return 'text-status-warning'
  return 'text-status-error'
}

function getMarginBorder(pct: number): string {
  if (pct >= 50) return 'border-status-success'
  if (pct >= 30) return 'border-status-warning'
  if (pct >= 0) return 'border-status-warning/80'
  return 'border-status-error'
}

function getMarginBg(pct: number): string {
  if (pct >= 50) return 'bg-gradient-to-br from-status-success/10 to-card'
  if (pct >= 30) return 'bg-gradient-to-br from-status-warning/10 to-card'
  if (pct >= 0) return 'bg-gradient-to-br from-status-warning/10 to-card'
  return 'bg-gradient-to-br from-status-error/10 to-card'
}

export function GrossMarginCard({
  grossMarginPct,
  previousGrossMarginPct,
  cogsCoverage,
  isLoading = false,
  error,
  onRetry,
  onAssignCogs,
  className,
}: GrossMarginCardProps): React.ReactElement {
  if (isLoading) return <HighlightedMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title="Валовая маржа"
        icon={Percent}
        error={error}
        onRetry={onRetry}
        className={className}
        minHeight="min-h-[100px]"
      />
    )
  }

  const canShow = grossMarginPct != null
  const diff =
    canShow && previousGrossMarginPct != null ? grossMarginPct! - previousGrossMarginPct : null

  const borderColor = canShow ? getMarginBorder(grossMarginPct!) : 'border-border'
  const bgGradient = canShow ? getMarginBg(grossMarginPct!) : 'bg-gradient-to-br from-muted to-card'

  return (
    <Card
      className={cn(
        'border-2 transition-shadow hover:shadow-md',
        borderColor,
        bgGradient,
        className
      )}
      role="article"
      data-testid="metric-card"
      aria-label={`Валовая маржа: ${canShow ? formatPercentage(grossMarginPct!, 1) : 'нет данных'}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Валовая маржа</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о валовой марже"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="lg">
              <p style={{ whiteSpace: 'pre-line' }}>
                {
                  'Валовая маржа = (Выручка нетто − Себестоимость) / Выручка нетто × 100%.\nПоказывает, какой % от выручки остаётся после вычета себестоимости, но ДО удержаний WB.\nОриентиры: ≥ 50% — отлично, 30–50% — нормально, 0–30% — низкая наценка, < 0% — убыток.\nСравнение в п.п. (процентных пунктах): например, 56% → 50% = −6 п.п.\n⚠ Точность зависит от покрытия COGS.\nИсточник: расчёт из weekly_margin_fact (взвешенная по выручке SKU).'
                }
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-1">
          {canShow ? (
            <span className={cn('text-xl font-bold', getMarginColor(grossMarginPct!))}>
              {formatPercentage(grossMarginPct!, 1)}
            </span>
          ) : (
            <span className="text-xl font-bold text-muted-foreground">—</span>
          )}
        </div>
        {diff != null && (
          <div className="mt-2">
            <span
              className={cn(
                'text-sm font-medium',
                diff > 0
                  ? 'text-status-success'
                  : diff < 0
                    ? 'text-status-error'
                    : 'text-muted-foreground'
              )}
            >
              {formatPercentagePoints(diff)}
            </span>
            <span className="ml-1 text-xs text-muted-foreground">
              vs {formatPercentage(previousGrossMarginPct!, 1)}
            </span>
          </div>
        )}
        {cogsCoverage < 100 && (
          <div className="mt-1 flex items-center gap-1 text-xs text-status-warning">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>Покрытие COGS: {formatPercentageInt(cogsCoverage)}</span>
            {onAssignCogs && (
              <button
                onClick={onAssignCogs}
                className="ml-1 font-medium text-primary hover:underline"
              >
                Перейти
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
