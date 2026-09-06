/**
 * Tax Warning Banner — Story 66.7-FE
 * Dismissible warning when tax system not configured.
 * Session-based dismissal via sessionStorage.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, X } from 'lucide-react'
import { ROUTES } from '@/lib/routes'

const DISMISSED_KEY = 'tax-warning-dismissed'

export interface TaxWarningBannerProps {
  taxConfigured: boolean
}

export function TaxWarningBanner({
  taxConfigured,
}: TaxWarningBannerProps): React.ReactElement | null {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(DISMISSED_KEY) === 'true'
  })

  if (taxConfigured || dismissed) return null

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, 'true')
    setDismissed(true)
  }

  return (
    <div
      role="alert"
      className="flex items-center justify-between rounded-lg border border-status-warning/40 bg-status-warning/10 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        {/* p2-wave-6: icon = non-text channel on warn/10 over bg>muted/50
            (layout main): 4.07/10.03 >= 3:1 (1.4.11) — valence carrier. */}
        <AlertTriangle className="h-5 w-5 shrink-0 text-status-warning" aria-hidden="true" />
        {/* p2-wave-6: fg-on-tint — full warn on warn/10 = 4.07/10.03 (FAIL 4.5);
            text-foreground = 13.34/12.41. Valence = tint + border + icon. */}
        <p className="text-sm text-foreground">
          Налоговая система не настроена. Прибыль отображается до вычета налогов.
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* p2-wave-6: hardcoded text-white on solid warn = 1.41 dark (FAIL);
            theme-aware token = 4.81/11.41. /90 hover-dim dropped (4.02 light
            over dim) — underline affordance per B10 precedent (80-sweep). */}
        <Link
          href={ROUTES.SETTINGS.TAX}
          className="rounded-md bg-status-warning px-3 py-1 text-sm font-medium text-status-warning-foreground hover:underline"
        >
          Настроить
        </Link>
        {/* p2-wave-6: X icon on warn/10 over bg>muted/50 = 4.07/10.03 >=3 PASS
            with FULL warn; the /80 hover measured 2.95 on the real stack (the
            80-sweep 3.04 pin used a bare-background base) — hover pinned full. */}
        <button
          onClick={handleDismiss}
          className="text-status-warning hover:text-status-warning"
          aria-label="Скрыть предупреждение"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
