/**
 * Margin Card — Секция 5: ПРИБЫЛЬ (правая, АКЦЕНТ)
 * Dashboard Restructuring: P&L Narrative
 *
 * Shows margin_pct with color coding by level.
 * Comparison in percentage points (п.п.).
 * Conditional on COGS coverage >= 80%.
 */

'use client'

import { Percent, Info, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { HighlightedMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface MarginCardProps {
  marginPct: number | null | undefined
  previousMarginPct: number | null | undefined
  cogsCoverage: number
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

function getMarginColor(pct: number): string {
  if (pct >= 30) return 'text-green-600'
  if (pct >= 15) return 'text-yellow-600'
  return 'text-red-600'
}

function getMarginBorder(pct: number): string {
  if (pct >= 30) return 'border-green-500'
  if (pct >= 15) return 'border-yellow-500'
  return 'border-red-500'
}

function getMarginBg(pct: number): string {
  if (pct >= 30) return 'bg-gradient-to-br from-green-50 to-white'
  if (pct >= 15) return 'bg-gradient-to-br from-yellow-50 to-white'
  return 'bg-gradient-to-br from-red-50 to-white'
}

function formatPp(diff: number): string {
  const sign = diff > 0 ? '+' : ''
  return `${sign}${diff.toFixed(1)} п.п.`
}

export function MarginCard({
  marginPct,
  previousMarginPct,
  cogsCoverage,
  isLoading = false,
  error,
  onRetry,
  className,
}: MarginCardProps): React.ReactElement {
  if (isLoading) return <HighlightedMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title="Маржинальность"
        icon={Percent}
        error={error}
        onRetry={onRetry}
        className={className}
        minHeight="min-h-[140px]"
      />
    )
  }

  const canShow = cogsCoverage >= 80 && marginPct != null
  const diff = canShow && previousMarginPct != null ? marginPct! - previousMarginPct : null

  const borderColor = canShow ? getMarginBorder(marginPct!) : 'border-gray-300'
  const bgGradient = canShow ? getMarginBg(marginPct!) : 'bg-gradient-to-br from-gray-50 to-white'

  return (
    <Card
      className={cn(
        'border-2 transition-shadow hover:shadow-md',
        borderColor,
        bgGradient,
        className
      )}
      role="article"
      aria-label={`Маржинальность: ${canShow ? `${marginPct!.toFixed(1)}%` : 'нет данных'}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Маржинальность</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о маржинальности"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>
                Валовая маржа: (К перечислению - COGS) / Продажи нетто × 100%. Показывает
                эффективность бизнеса.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-3">
          {canShow ? (
            <span className={cn('text-4xl font-bold', getMarginColor(marginPct!))}>
              {marginPct!.toFixed(1)}%
            </span>
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">—</span>
          )}
        </div>
        {diff != null && (
          <div className="mt-2">
            <span
              className={cn(
                'text-sm font-medium',
                diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'
              )}
            >
              {formatPp(diff)}
            </span>
            <span className="ml-1 text-xs text-muted-foreground">
              vs {previousMarginPct!.toFixed(1)}%
            </span>
          </div>
        )}
        {!canShow && cogsCoverage < 80 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            <span>Заполните себестоимость для расчёта</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
