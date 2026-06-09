'use client'

/**
 * VelocityMetricsWidget Component
 * Story 40.6-FE: Orders Analytics Dashboard
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Displays order processing velocity metrics with color-coded thresholds.
 * Reference: docs/stories/epic-40/story-40.6-fe-orders-analytics-dashboard.md#AC2
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { VelocityMetricsResponse } from '@/types/orders-analytics'
import {
  VelocityMetricCard,
  PercentilesSection,
  VelocityWidgetSkeleton,
  VelocityWidgetError,
} from './VelocityWidgetParts'

interface VelocityMetricsWidgetProps {
  data?: VelocityMetricsResponse
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
}

export function VelocityMetricsWidget({
  data,
  isLoading,
  error,
  onRetry,
}: VelocityMetricsWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card data-testid="velocity-metrics-widget">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Скорость обработки
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <VelocityWidgetSkeleton />}
        {error && !isLoading && <VelocityWidgetError onRetry={onRetry} />}
        {!isLoading && !error && data && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <VelocityMetricCard
                label="Подтверждение"
                minutes={data.avgConfirmationTimeMinutes}
                type="confirm"
                testIdPrefix="confirmation-time"
              />
              <VelocityMetricCard
                label="Выполнение"
                minutes={data.avgCompletionTimeMinutes}
                type="complete"
                testIdPrefix="completion-time"
              />
            </div>

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  aria-expanded={isOpen}
                >
                  {isOpen ? (
                    <ChevronUp className="mr-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="mr-1 h-4 w-4" />
                  )}
                  P50/P95 детали
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <PercentilesSection
                  p50Confirm={data.p50ConfirmationMinutes}
                  p95Confirm={data.p95ConfirmationMinutes}
                  p50Complete={data.p50CompletionMinutes}
                  p95Complete={data.p95CompletionMinutes}
                  totalOrders={data.totalOrders}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
