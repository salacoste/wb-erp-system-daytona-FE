'use client'

/**
 * Supply Planning Detail - Velocity Trend Section + shared trend indicators.
 * Extracted from SupplyDetailLeftColumn (file-size compliance + Defensive Frontend).
 *
 * 'no_data'/null velocity_trend (backend: insufficient sales history) → indicate "Нет данных",
 * NEVER fabricate a 'stable' label + Minus icon + upward sparkline. Mirrors the row cell.
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { VELOCITY_TREND_CONFIG } from '@/lib/supply-planning-utils'
import type { VelocityTrend } from '@/types/supply-planning'

type TrendConfig = (typeof VELOCITY_TREND_CONFIG)[Exclude<VelocityTrend, 'no_data'>]

interface TrendIndicatorProps {
  trendConfig: TrendConfig | null
  TrendIcon: React.ComponentType<{ className?: string }> | null
  className?: string
}

/**
 * Renders the trend icon for a known trend, or a muted "—" unknown indicator (with tooltip)
 * when the trend is unknown (no_data/null). Shared by the velocity row and the trend header.
 */
export function TrendIndicator({ trendConfig, TrendIcon, className }: TrendIndicatorProps) {
  if (TrendIcon) {
    return <TrendIcon className={cn(className, trendConfig?.textClass ?? 'text-muted-foreground')} />
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help text-muted-foreground" aria-label="Нет данных о тренде продаж">
            —
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          Недостаточно данных о продажах для определения тренда
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface TrendSectionProps {
  trendConfig: TrendConfig | null
  TrendIcon: React.ComponentType<{ className?: string }> | null
}

/** "Тренд скорости продаж" section: label + sparkline (suppressed for unknown trends). */
export function SupplyDetailTrendSection({ trendConfig, TrendIcon }: TrendSectionProps) {
  return (
    <section className="bg-card rounded-lg border p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        <TrendIndicator trendConfig={trendConfig} TrendIcon={TrendIcon} className="h-4 w-4" />
        Тренд скорости продаж
      </h4>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex items-center gap-2 text-lg font-bold',
            trendConfig?.textClass ?? 'text-muted-foreground'
          )}
        >
          <TrendIndicator trendConfig={trendConfig} TrendIcon={TrendIcon} className="h-5 w-5" />
          {trendConfig?.label ?? 'Нет данных'}
        </div>
        <span className="text-sm text-muted-foreground">(за последние 14 дней)</span>
      </div>
      {/* Sparkline: only for known trends. For unknown (no_data/null) we MUST NOT fabricate an
          upward ramp — render a neutral placeholder instead (Defensive Frontend). */}
      {TrendIcon ? (
        <div className="mt-3 flex items-end gap-0.5 h-8">
          {[3, 4, 5, 4, 6, 7, 5, 6, 8, 7, 9, 8, 10, 9].map((h, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-t',
                i >= 12
                  ? (trendConfig?.textClass ?? 'text-muted-foreground').replace('text-', 'bg-')
                  : 'bg-muted'
              )}
              style={{ height: `${h * 10}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 flex items-center h-8 text-sm text-muted-foreground">Недостаточно данных</div>
      )}
    </section>
  )
}
