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
      className="flex items-center justify-between rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" aria-hidden="true" />
        <p className="text-sm text-yellow-800">
          Налоговая система не настроена. Прибыль отображается до вычета налогов.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={ROUTES.SETTINGS.TAX}
          className="rounded-md bg-yellow-600 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-700"
        >
          Настроить
        </Link>
        <button
          onClick={handleDismiss}
          className="text-yellow-600 hover:text-yellow-800"
          aria-label="Скрыть предупреждение"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
