'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import type { AiStatusResponse } from '@/types/ai/status'

interface Props {
  status: AiStatusResponse
}

/**
 * Placeholder for Story 108.5-FE — sneak-preview state UI.
 * Story 108.3-FE provides minimal scaffold; Story 108.5 fills in low-confidence
 * forecasts from /v1/ai/sneak-preview, disclaimer, trend arrows.
 */
export function SneakPreviewSection({ status }: Props) {
  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <p className="font-semibold">AI: предварительный прогноз — низкая уверенность</p>
        <p className="text-xs mt-1">
          Собрано {status.weeksCollected} недель. Полная AI активируется при достижении{' '}
          {status.weeksRequired} недель.
        </p>
        <p className="text-xs mt-1 text-muted-foreground">
          {/* Story 108.5-FE: add sneak-preview table with SKU forecasts, trend arrows, range */}
          Прогнозы появятся в ближайшем обновлении.
        </p>
      </AlertDescription>
    </Alert>
  )
}
