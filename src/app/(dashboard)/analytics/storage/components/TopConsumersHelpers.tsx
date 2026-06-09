import { Trophy, Medal } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatPercentage } from '@/lib/utils'

/**
 * Helper components for TopConsumersWidget.
 * Story 24.4-FE: Top Consumers Widget — extracted for file-size compliance.
 */

// Cost severity thresholds per UX Decision Q10
type CostSeverity = 'high' | 'medium' | 'low' | 'unknown'

export function getCostSeverity(ratio: number | null): CostSeverity {
  if (ratio === null) return 'unknown'
  if (ratio > 20) return 'high'
  if (ratio > 10) return 'medium'
  return 'low'
}

// Rank Indicator Component (UX Decision Q9)
export function RankIndicator({ rank }: { rank: number }) {
  switch (rank) {
    case 1:
      return (
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-yellow-500" aria-label="1 место" />
          <span className="text-sm font-medium">1</span>
        </div>
      )
    case 2:
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-gray-400" aria-label="2 место" />
          <span className="text-sm font-medium">2</span>
        </div>
      )
    case 3:
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-amber-600" aria-label="3 место" />
          <span className="text-sm font-medium">3</span>
        </div>
      )
    default:
      return <span className="text-sm text-muted-foreground ml-5">{rank}</span>
  }
}

// Cost Severity Dot Component (UX Decision Q10)
export function CostSeverityDot({ ratio }: { ratio: number | null }) {
  const severity = getCostSeverity(ratio)

  const colors: Record<CostSeverity, string> = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
    unknown: 'bg-gray-300',
  }

  const labels: Record<CostSeverity, string> = {
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
              <span className={cn('text-sm', severity === 'high' && 'text-red-600 font-medium')}>
                {formatPercentage(ratio, 1)}
              </span>
            )}
            <span
              className={cn('w-2 h-2 rounded-full flex-shrink-0', colors[severity])}
              aria-label={labels[severity]}
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
