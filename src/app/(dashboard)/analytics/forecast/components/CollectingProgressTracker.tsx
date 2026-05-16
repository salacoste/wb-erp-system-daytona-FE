'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Brain } from 'lucide-react'
import type { AiStatusResponse } from '@/types/ai/status'

interface Props {
  status: AiStatusResponse
}

/**
 * Placeholder for Story 108.4-FE — collecting state progress tracker.
 * Story 108.3-FE provides minimal scaffold; Story 108.4 fills in progress bar,
 * missingRequirements list, estimatedActivationDate, top SKUs from /v1/ai/trends.
 */
export function CollectingProgressTracker({ status }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-purple-600" />
          <div>
            <h2 className="text-lg font-semibold">Сбор данных для AI</h2>
            <p className="text-sm text-muted-foreground">
              Собрано {status.weeksCollected} из {status.weeksRequired} недель (
              {status.progressPct ?? 0}% готовности).
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {/* Story 108.4-FE: add full progress bar + missing requirements + estimated activation + top SKUs */}
              Подробности появятся после реализации Story 108.4-FE.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
