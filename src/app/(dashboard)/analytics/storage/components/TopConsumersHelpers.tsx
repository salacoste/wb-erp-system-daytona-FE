import { Trophy, Medal } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatPercentage } from '@/lib/utils'
// Story 169.12 parked dedupe: identical >20/>10 thresholds — absorb the shared
// classifier instead of the local getCostSeverity copy (read-only shared import).
import {
  getStorageRatioSeverity,
  type RatioSeverity,
} from '@/components/custom/dashboard/StorageRatioIndicator'

/**
 * Helper components for TopConsumersWidget.
 * Story 24.4-FE: Top Consumers Widget — extracted for file-size compliance.
 */

// Rank Indicator Component (UX Decision Q9); Story 169.12: rank medal colors →
// status/warning tokens + muted (aria-labels preserved verbatim).
export function RankIndicator({ rank }: { rank: number }) {
  switch (rank) {
    case 1:
      return (
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-status-warning" aria-label="1 место" />
          <span className="text-sm font-medium">1</span>
        </div>
      )
    case 2:
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-muted-foreground" aria-label="2 место" />
          <span className="text-sm font-medium">2</span>
        </div>
      )
    case 3:
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-status-warning" aria-label="3 место" />
          <span className="text-sm font-medium">3</span>
        </div>
      )
    default:
      return <span className="text-sm text-muted-foreground ml-5">{rank}</span>
  }
}

// Cost Severity Dot Component (UX Decision Q10); Story 169.12: severity dots →
// status-success/warning/error solid pairs + muted neutral (169.9 canon).
export function CostSeverityDot({ ratio }: { ratio: number | null }) {
  const severity: RatioSeverity = getStorageRatioSeverity(ratio)

  const colors: Record<RatioSeverity, string> = {
    high: 'bg-status-error',
    medium: 'bg-status-warning',
    low: 'bg-status-success',
    unknown: 'bg-muted',
  }

  const labels: Record<RatioSeverity, string> = {
    high: 'Высокие затраты',
    medium: 'Средние затраты',
    low: 'Низкие затраты',
    unknown: 'Нет данных',
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            {ratio !== null && (
              <span
                className={cn('text-sm', severity === 'high' && 'text-status-error font-medium')}
              >
                {formatPercentage(ratio, 1)}
              </span>
            )}
            <span
              className={cn('w-2 h-2 rounded-full flex-shrink-0', colors[severity])}
              aria-hidden="true"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{labels[severity]}</p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Отношение затрат на хранение к выручке.
            {severity === 'high' && ' Рекомендуется оптимизация.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
