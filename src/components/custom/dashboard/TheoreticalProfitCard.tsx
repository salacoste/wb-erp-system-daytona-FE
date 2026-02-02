/**
 * Theoretical Profit Card Component
 * Story 62.4-FE: Theoretical Profit Card with Breakdown
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * Highlighted card showing theoretical profit with expandable breakdown.
 * Formula: Заказы - COGS - Реклама - Логистика - Хранение
 *
 * @see docs/stories/epic-62/story-62.4-fe-theoretical-profit-card.md
 */

'use client'

import { useState } from 'react'
import { Calculator, Info, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { ProfitBreakdownPopover } from './ProfitBreakdownPopover'
import { HighlightedMetricSkeleton, MetricCardError } from './MetricCardStates'
import { formatCurrency, cn } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import type { TheoreticalProfitResult } from '@/lib/theoretical-profit'

const FIELD_LABELS: Record<string, string> = {
  ordersAmount: 'Заказы',
  cogs: 'COGS',
  advertisingSpend: 'Реклама',
  logisticsCost: 'Логистика',
  storageCost: 'Хранение',
}

export interface TheoreticalProfitCardProps {
  profit: TheoreticalProfitResult | null | undefined
  previousProfit: number | null | undefined
  isLoading?: boolean
  error?: Error | null
  className?: string
  onRetry?: () => void
}

export function TheoreticalProfitCard({
  profit,
  previousProfit,
  isLoading = false,
  error,
  className,
  onRetry,
}: TheoreticalProfitCardProps): React.ReactElement {
  const [breakdownOpen, setBreakdownOpen] = useState(false)

  if (isLoading) return <HighlightedMetricSkeleton className={className} />
  if (error)
    return (
      <MetricCardError
        title="Теор. прибыль"
        icon={Calculator}
        error={error}
        onRetry={onRetry}
        className={className}
        minHeight="min-h-[140px]"
      />
    )

  const value = profit?.value ?? null
  const isPositive = value != null && value >= 0
  const isComplete = profit?.isComplete ?? false
  const comparison =
    value != null && previousProfit != null ? calculateComparison(value, previousProfit) : null
  const missingLabels = profit?.missingFields?.map(f => FIELD_LABELS[f] || f) || []

  const borderColor = !isComplete
    ? 'border-yellow-500'
    : isPositive
      ? 'border-blue-500'
      : 'border-red-500'
  const bgGradient = !isComplete
    ? 'bg-gradient-to-br from-yellow-50 to-white'
    : isPositive
      ? 'bg-gradient-to-br from-blue-50 to-white'
      : 'bg-gradient-to-br from-red-50 to-white'
  const valueColor = isPositive ? 'text-green-500' : 'text-red-500'

  return (
    <Card
      className={cn(
        'border-2 transition-shadow hover:shadow-md',
        borderColor,
        bgGradient,
        className
      )}
      role="article"
      aria-label={`Теоретическая прибыль: ${value != null && isComplete ? formatCurrency(value) : 'нет данных'}`}
    >
      <CardContent className="p-4">
        <Header isComplete={isComplete} />
        <div className="mt-3">
          <span
            className={cn('text-5xl font-bold', isComplete ? valueColor : 'text-muted-foreground')}
          >
            {value != null && isComplete ? formatCurrency(value) : '—'}
          </span>
        </div>
        {comparison && isComplete && (
          <div className="mt-2 flex items-center gap-2">
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
            <span className="text-xs text-muted-foreground">
              vs {formatCurrency(previousProfit ?? 0)}
            </span>
          </div>
        )}
        {!isComplete && missingLabels.length > 0 && (
          <div className="mt-2 text-xs text-yellow-600">Не хватает: {missingLabels.join(', ')}</div>
        )}
        {profit?.breakdown && (
          <Popover open={breakdownOpen} onOpenChange={setBreakdownOpen}>
            <PopoverTrigger asChild>
              <button className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Показать разбивку
                {breakdownOpen ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4">
              <ProfitBreakdownPopover breakdown={profit.breakdown} totalProfit={profit.value} />
            </PopoverContent>
          </Popover>
        )}
      </CardContent>
    </Card>
  )
}

function Header({ isComplete }: { isComplete: boolean }): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-muted-foreground">Теор. прибыль</span>
      </div>
      <div className="flex items-center gap-2">
        {!isComplete && (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Неполные данные
          </Badge>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="text-muted-foreground hover:text-foreground"
              aria-label="Подробнее о теоретической прибыли"
            >
              <Info className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent size="lg">
            <p>
              Теоретическая прибыль = Заказы - COGS - Реклама - Логистика - Хранение. Показывает
              потенциальную прибыль до вычета комиссий WB.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
