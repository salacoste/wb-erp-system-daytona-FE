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

  // Story 170.1: yellow palette → status-warning /15+/30 matched pair (169.5)
  return (
    <Alert className="relative border-status-warning/30 bg-status-warning/15 pr-12" role="alert">
      <AlertTriangle className="h-4 w-4 text-status-warning" aria-hidden="true" />
      <AlertTitle className="text-foreground">Мультипликация расходов</AlertTitle>
      <AlertDescription className="text-foreground">
        {warningCount} {pluralize(warningCount, 'товар', 'товара', 'товаров')}{' '}
        {pluralize(warningCount, 'участвует', 'участвуют', 'участвуют')} в нескольких кампаниях.
        Показатели прибыли могут быть завышены.
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6 text-status-warning hover:bg-status-warning/20"
        onClick={handleDismiss}
        aria-label="Скрыть предупреждение"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </Alert>
  )
}
