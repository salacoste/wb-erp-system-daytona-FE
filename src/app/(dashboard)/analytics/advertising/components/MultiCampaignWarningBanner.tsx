'use client'

/**
 * MultiCampaignWarningBanner Component
 * Story 72.4-FE: Advertising Profit Multiplication Warning
 *
 * Dismissible alert banner shown when multi-campaign SKUs exist.
 * Follows EfficiencyAlertBanner pattern (Alert + sessionStorage dismiss).
 */

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const DISMISS_KEY = 'multi-campaign-warning-dismissed'

/** Russian pluralization for товар/товара/товаров (same pattern as EfficiencyAlertBanner) */
function pluralize(count: number, one: string, few: string, many: string): string {
  const abs = Math.abs(count) % 100
  const last = abs % 10
  if (abs >= 11 && abs <= 19) return many
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}

interface MultiCampaignWarningBannerProps {
  warningCount: number
}

export function MultiCampaignWarningBanner({ warningCount }: MultiCampaignWarningBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true) // start hidden for SSR

  useEffect(() => {
    const stored = sessionStorage.getItem(DISMISS_KEY)
    const storedCount = stored ? Number(stored) : null
    // Show if never dismissed or count increased since last dismiss
    setIsDismissed(storedCount !== null && warningCount <= storedCount)
  }, [warningCount])

  if (warningCount === 0 || isDismissed) return null

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, String(warningCount))
    setIsDismissed(true)
  }

  return (
    <Alert className="relative border-yellow-400 bg-yellow-50 pr-12 text-yellow-800" role="alert">
      <AlertTriangle className="h-4 w-4 text-yellow-600" aria-hidden="true" />
      <AlertTitle className="text-yellow-800">Мультипликация расходов</AlertTitle>
      <AlertDescription className="text-yellow-700">
        {warningCount} {pluralize(warningCount, 'товар', 'товара', 'товаров')}{' '}
        {pluralize(warningCount, 'участвует', 'участвуют', 'участвуют')} в нескольких кампаниях.
        Показатели прибыли могут быть завышены.
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6 text-yellow-600 hover:bg-yellow-200 hover:text-yellow-800"
        onClick={handleDismiss}
        aria-label="Скрыть предупреждение"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </Alert>
  )
}
