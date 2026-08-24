'use client'

/**
 * Supply Planning Detail - Velocity Trend Section + shared trend indicators.
 * Extracted from SupplyDetailLeftColumn (file-size compliance + Defensive Frontend).
 *
 * 'no_data'/null velocity_trend (backend: insufficient sales history) → indicate "Нет данных",
 * NEVER fabricate a 'stable' label + Minus icon + upward sparkline. Mirrors the row cell.
 *
 * Story 169.13: colors come from the route-local TREND_TEXT_TOKENS / TREND_BG_TOKENS
 * maps (supply-risk-tokens.ts) — lib VELOCITY_TREND_CONFIG.textClass and the
 * `.replace('text-','bg-')` hack are no longer consumed. Labels remain lib-owned.
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { VELOCITY_TREND_CONFIG } from '@/lib/supply-planning-utils'
import type { VelocityTrend } from '@/types/supply-planning'
import { TREND_TEXT_TOKENS, TREND_BG_TOKENS } from './supply-risk-tokens'

type KnownTrend = Exclude<VelocityTrend, 'no_data'>

interface TrendIndicatorProps {
  /** Known renderable trend; null = no_data/insufficient history → honest "—". */
  trend: KnownTrend | null
  TrendIcon: React.ComponentType<{ className?: string }> | null
  className?: string
}

/**
 * Renders the trend icon for a known trend, or a muted "—" unknown indicator (with tooltip)
 * when the trend is unknown (no_data/null). Shared by the velocity row and the trend header.
 */
export function TrendIndicator({ trend, TrendIcon, className }: TrendIndicatorProps) {
  if (TrendIcon && trend) {
    return <TrendIcon className={cn(className, TREND_TEXT_TOKENS[trend])} />
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="cursor-help text-muted-foreground/60"
            aria-label="Нет данных о тренде продаж"
          >
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
  trend: KnownTrend | null
  TrendIcon: React.ComponentType<{ className?: string }> | null
  /** avg_daily_sales for the sr-only data alternative (Story 169.13). Null → «Нет данных». */
  avgDailySales?: number | null
}

/** "Тренд скорости продаж" section: label + sparkline (suppressed for unknown trends). */
export function SupplyDetailTrendSection({
  trend,
  TrendIcon,
  avgDailySales = null,
}: TrendSectionProps) {
  // sr-only data alternative (169.11/169.12 canon): the sparkline bars are an
  // illustrative ramp, so screen readers get the underlying rate instead —
  // 14 days × avg_daily_sales, units шт/день; null velocity → «Нет данных».
  const srText =
    avgDailySales != null
      ? `Скорость продаж за последние 14 дней: ${Array.from(
          { length: 14 },
          (_, i) => `день ${i + 1} — ${avgDailySales.toFixed(1)} шт/день`
        ).join('; ')}.`
      : 'Скорость продаж за последние 14 дней: Нет данных.'

  return (
    <section className="bg-card rounded-lg border p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        <TrendIndicator trend={trend} TrendIcon={TrendIcon} className="h-4 w-4" />
        Тренд скорости продаж
      </h4>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex items-center gap-2 text-lg font-bold',
            trend ? TREND_TEXT_TOKENS[trend] : 'text-muted-foreground'
          )}
        >
          <TrendIndicator trend={trend} TrendIcon={TrendIcon} className="h-5 w-5" />
          {trend ? VELOCITY_TREND_CONFIG[trend].label : 'Нет данных'}
        </div>
        <span className="text-sm text-muted-foreground">(за последние 14 дней)</span>
      </div>
      {/* Sparkline: only for known trends. For unknown (no_data/null) we MUST NOT fabricate an
          upward ramp — render a neutral placeholder instead (Defensive Frontend). */}
      {TrendIcon && trend ? (
        <div
          className="mt-3 flex items-end gap-0.5 h-8"
          role="img"
          aria-label="Иллюстративный график тренда скорости продаж"
        >
          <span className="sr-only">{srText}</span>
          {[3, 4, 5, 4, 6, 7, 5, 6, 8, 7, 9, 8, 10, 9].map((h, i) => (
            <div
              key={i}
              className={cn('flex-1 rounded-t', i >= 12 ? TREND_BG_TOKENS[trend] : 'bg-muted')}
              style={{ height: `${h * 10}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 flex items-center h-8 text-sm text-muted-foreground">
          Недостаточно данных
        </div>
      )}
    </section>
  )
}
