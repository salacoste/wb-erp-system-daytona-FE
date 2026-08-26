/**
 * Operating Margin Card — Request #155: Renamed from "Маржинальность"
 * Shows margin_pct = (payout − COGS) / sale_gross × 100 (after WB deductions).
 * Comparison in percentage points (п.п.).
 * Conditional on COGS coverage >= 80%.
 */

'use client'

import { Percent, Info, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatPercentage, formatPercentageInt, formatPercentagePoints } from '@/lib/utils'
import { HighlightedMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface MarginCardProps {
  marginPct: number | null | undefined
  previousMarginPct: number | null | undefined
  cogsCoverage: number
  isLoading?: boolean
  showPreTaxLabel?: boolean
  error?: Error | null
  onRetry?: () => void
  onAssignCogs?: () => void
  className?: string
}

// iter-120: the <15% band was a single red, painting a thin-but-PROFITABLE operating margin
// (e.g. +10%) identically to an actual LOSS (e.g. −10%). Per the Defensive Frontend Principle
// (never visually misrepresent data), a profit must be distinct from a loss. Split into
// 0–15% orange ("низкая") and <0% red ("убыток"), matching the realized-margin BANDS already
// used by top-table-utils.getMarginColor (TopProducts/TopBrands). Semantic status tokens since
// 172.1; the weakest positive band dims the warning tone for a 4-state scale (same idiom as
// TopProductsTableRow).
function getMarginColor(pct: number): string {
  if (pct >= 30) return 'text-status-success'
  if (pct >= 15) return 'text-status-warning'
  if (pct >= 0) return 'text-status-warning/80'
  return 'text-status-error'
}

function getMarginBorder(pct: number): string {
  if (pct >= 30) return 'border-status-success'
  if (pct >= 15) return 'border-status-warning'
  if (pct >= 0) return 'border-status-warning/80'
  return 'border-status-error'
}

function getMarginBg(pct: number): string {
  if (pct >= 30) return 'bg-gradient-to-br from-status-success/10 to-card'
  if (pct >= 15) return 'bg-gradient-to-br from-status-warning/10 to-card'
  if (pct >= 0) return 'bg-gradient-to-br from-status-warning/10 to-card'
  return 'bg-gradient-to-br from-status-error/10 to-card'
}

export function MarginCard({
  marginPct,
  previousMarginPct,
  cogsCoverage,
  showPreTaxLabel = false,
  isLoading = false,
  error,
  onRetry,
  onAssignCogs,
  className,
}: MarginCardProps): React.ReactElement {
  if (isLoading) return <HighlightedMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title="Операционная маржа"
        icon={Percent}
        error={error}
        onRetry={onRetry}
        className={className}
        minHeight="min-h-[100px]"
      />
    )
  }

  const canShow = marginPct != null
  const diff = canShow && previousMarginPct != null ? marginPct! - previousMarginPct : null

  const borderColor = canShow ? getMarginBorder(marginPct!) : 'border-border'
  const bgGradient = canShow ? getMarginBg(marginPct!) : 'bg-gradient-to-br from-muted to-card'

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
      aria-label={`Операционная маржа: ${canShow ? formatPercentage(marginPct!, 1) : 'нет данных'}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">
              Операционная маржа
              {showPreTaxLabel && (
                <span className="ml-1 text-xs text-muted-foreground/70">(до налога)</span>
              )}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее об операционной марже"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="lg">
              <p style={{ whiteSpace: 'pre-line' }}>
                {
                  'Операционная маржа = (К перечислению − Себестоимость) / Выручка нетто × 100%.\nПоказывает, какой % от выручки остаётся после ВСЕХ удержаний WB и себестоимости.\nЭто ваша реальная рентабельность продаж (до налогов).\nОриентиры: ≥ 30% — отлично, 15–30% — нормально, 0–15% — низкая рентабельность, < 0% — убыток.\nСравнение в п.п. (процентных пунктах).\n⚠ Точность зависит от покрытия COGS.\nИсточник: расчёт из weekly_margin_fact.'
                }
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-1">
          {canShow ? (
            <span className={cn('text-xl font-bold', getMarginColor(marginPct!))}>
              {formatPercentage(marginPct!, 1)}
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
              vs {formatPercentage(previousMarginPct!, 1)}
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
