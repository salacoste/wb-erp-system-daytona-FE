/**
 * Trends Tab Component
 * Story 51.8-FE: FBS Analytics Page (Tab Navigation & Integration)
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Full trends chart with aggregation toggle and metric visibility controls.
 * Extended view of FbsTrendsChart from Story 51.4-FE.
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FbsTrendsChart } from '@/components/custom/analytics/FbsTrendsChart'
import { calculateDaysDiff, getSmartAggregation } from '@/hooks/useFbsAnalytics'
import { getAggregationLabel } from '@/lib/fbs-analytics-utils'
import type { AggregationType } from '@/types/fbs-analytics'

interface TrendsTabProps {
  from: string
  to: string
}

/** Aggregation options with Russian labels */
const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: 'day', label: 'По дням' },
  { value: 'week', label: 'По неделям' },
  { value: 'month', label: 'По месяцам' },
]

export function TrendsTab({ from, to }: TrendsTabProps) {
  const daysDiff = from && to ? calculateDaysDiff(from, to) : 30
  const suggestedAggregation = getSmartAggregation(daysDiff)

  // Allow manual override of aggregation
  const [aggregation, setAggregation] = useState<AggregationType>(suggestedAggregation)

  // Update aggregation when date range changes
  if (suggestedAggregation !== aggregation && daysDiff > 180 && aggregation === 'day') {
    setAggregation(suggestedAggregation)
  }

  if (!from || !to) {
    return (
      <Card className="mt-4">
        <CardContent className="flex items-center justify-center h-[500px] text-muted-foreground">
          Выберите период для отображения трендов
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Aggregation Toggle */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">Настройки отображения</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">Группировка:</span>
              <div className="flex rounded-lg bg-muted p-1">
                {AGGREGATION_OPTIONS.map(option => (
                  <Button
                    key={option.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => setAggregation(option.value)}
                    className={cn(
                      'px-3 py-1.5 text-sm transition-colors',
                      aggregation === option.value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          {aggregation !== suggestedAggregation && (
            <p className="text-sm text-muted-foreground mt-2">
              Рекомендуемая группировка для выбранного периода:{' '}
              {getAggregationLabel(suggestedAggregation)}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Extended Trends Chart */}
      <FbsTrendsChart from={from} to={to} aggregation={aggregation} height={500} />
    </div>
  )
}
