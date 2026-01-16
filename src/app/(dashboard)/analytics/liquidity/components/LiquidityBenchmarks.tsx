'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { LiquidityBenchmarks as LiquidityBenchmarksType } from '@/types/liquidity'
import {
  getBenchmarkStatusConfig,
  formatPercentage,
  formatTurnoverDays,
} from '@/lib/liquidity-utils'
import { cn } from '@/lib/utils'

interface LiquidityBenchmarksProps {
  benchmarks: LiquidityBenchmarksType
}

/**
 * Benchmarks comparison section
 * Shows your performance vs targets and industry
 * Story 7.2: Liquidity Page Structure
 */
export function LiquidityBenchmarks({ benchmarks }: LiquidityBenchmarksProps) {
  const statusConfig = getBenchmarkStatusConfig(benchmarks.overall_status)

  // Calculate progress percentages for visualization
  const turnoverProgress = Math.min(100, (benchmarks.target_avg_turnover / benchmarks.your_avg_turnover) * 100)
  const highlyLiquidProgress = Math.min(100, (benchmarks.highly_liquid_pct / benchmarks.target_highly_liquid_pct) * 100)
  const illiquidProgress = Math.min(100, ((benchmarks.target_illiquid_pct + 1) / (benchmarks.illiquid_pct + 1)) * 100)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Сравнение с целями</CardTitle>
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium',
              statusConfig.textClass
            )}
            style={{ backgroundColor: `${statusConfig.color}15` }}
          >
            <span>{statusConfig.icon}</span>
            <span>{statusConfig.label}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Average Turnover Comparison */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Средний оборот</span>
            <div className="flex items-center gap-4">
              <span>
                <span className="font-medium">{formatTurnoverDays(benchmarks.your_avg_turnover)}</span>
                <span className="text-muted-foreground"> / цель: {formatTurnoverDays(benchmarks.target_avg_turnover)}</span>
              </span>
            </div>
          </div>
          <Progress
            value={turnoverProgress}
            className="h-2"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Быстрее = лучше</span>
            <span>Отрасль: {formatTurnoverDays(benchmarks.industry_avg_turnover)}</span>
          </div>
        </div>

        {/* Highly Liquid Share */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Доля высоколиквидных</span>
            <div className="flex items-center gap-4">
              <span>
                <span className={cn(
                  'font-medium',
                  benchmarks.highly_liquid_pct >= benchmarks.target_highly_liquid_pct
                    ? 'text-green-600'
                    : 'text-orange-600'
                )}>
                  {formatPercentage(benchmarks.highly_liquid_pct)}
                </span>
                <span className="text-muted-foreground"> / цель: {formatPercentage(benchmarks.target_highly_liquid_pct)}</span>
              </span>
            </div>
          </div>
          <Progress
            value={highlyLiquidProgress}
            className={cn(
              'h-2',
              benchmarks.highly_liquid_pct >= benchmarks.target_highly_liquid_pct
                ? '[&>div]:bg-green-500'
                : '[&>div]:bg-orange-500'
            )}
          />
          <div className="text-xs text-muted-foreground">
            Больше = лучше. Целевой показатель: &gt;50%
          </div>
        </div>

        {/* Illiquid Share */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Доля неликвида</span>
            <div className="flex items-center gap-4">
              <span>
                <span className={cn(
                  'font-medium',
                  benchmarks.illiquid_pct <= benchmarks.target_illiquid_pct
                    ? 'text-green-600'
                    : 'text-red-600'
                )}>
                  {formatPercentage(benchmarks.illiquid_pct)}
                </span>
                <span className="text-muted-foreground"> / цель: {formatPercentage(benchmarks.target_illiquid_pct)}</span>
              </span>
            </div>
          </div>
          <Progress
            value={illiquidProgress}
            className={cn(
              'h-2',
              benchmarks.illiquid_pct <= benchmarks.target_illiquid_pct
                ? '[&>div]:bg-green-500'
                : '[&>div]:bg-red-500'
            )}
          />
          <div className="text-xs text-muted-foreground">
            Меньше = лучше. Целевой показатель: &lt;5%
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
