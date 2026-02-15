/**
 * ROI Card — Story 65.3: Return on Investment
 * ROI = gross_profit / cogs_total * 100
 *
 * Guards: grossProfit != null AND cogsTotal != null AND cogsTotal > 0
 * Comparison in percentage points (п.п.), NOT relative %.
 * Color: green >=100%, yellow 50-100%, red <50%
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-1-2.md — Story 65.3
 */

'use client'

import Link from 'next/link'
import { TrendingUp, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/routes'

export interface RoiCardProps {
  grossProfit: number | null | undefined
  cogsTotal: number | null | undefined
  previousGrossProfit?: number | null | undefined
  previousCogsTotal?: number | null | undefined
  isLoading?: boolean
  className?: string
}

/** ROI value color by threshold: green >=100%, yellow 50-100%, red <50% */
function getRoiColor(roi: number): string {
  if (roi >= 100) return 'text-green-600'
  if (roi >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

/** Format ROI as "XX,X%" with 1 decimal, Russian locale */
function formatRoi(value: number): string {
  const formatted = value.toFixed(1).replace('.', ',')
  return `${formatted}%`
}

/** Format percentage-point diff with sign: "+3,2 п.п." or "-1,5 п.п." */
function formatPp(diff: number): string {
  const sign = diff > 0 ? '+' : ''
  const formatted = diff.toFixed(1).replace('.', ',')
  return `${sign}${formatted} п.п.`
}

/** Calculate ROI; returns null if inputs are invalid */
function calculateRoi(
  grossProfit: number | null | undefined,
  cogsTotal: number | null | undefined
): number | null {
  if (grossProfit == null || cogsTotal == null || cogsTotal === 0) return null
  return (grossProfit / cogsTotal) * 100
}

export function RoiCard({
  grossProfit,
  cogsTotal,
  previousGrossProfit,
  previousCogsTotal,
  isLoading = false,
  className,
}: RoiCardProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card
        className={cn('min-h-[120px]', className)}
        role="article"
        aria-busy="true"
        data-testid="roi-card-skeleton"
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="mt-2 h-8 w-32" />
          <Skeleton className="mt-2 h-5 w-24" />
        </CardContent>
      </Card>
    )
  }

  const roi = calculateRoi(grossProfit, cogsTotal)
  const previousRoi = calculateRoi(previousGrossProfit, previousCogsTotal)
  const canShow = roi != null
  const diff = canShow && previousRoi != null ? roi - previousRoi : null
  const ariaValue = canShow ? formatRoi(roi) : 'нет данных'

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`ROI: ${ariaValue}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">ROI</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о ROI"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>
                ROI = Валовая прибыль / Себестоимость * 100%. Показывает рентабельность вложений в
                товар.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-2">
          {canShow ? (
            <span className={cn('text-2xl font-bold', getRoiColor(roi))}>{formatRoi(roi)}</span>
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
          </div>
        )}

        {!canShow && (
          <div className="mt-2 text-xs text-muted-foreground">
            <Link href={ROUTES.COGS.ROOT} className="font-medium text-primary hover:underline">
              Заполнить COGS
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
