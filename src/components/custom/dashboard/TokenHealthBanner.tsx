'use client'

/**
 * Token Health warning banner — shown on all dashboard pages when WB API token is unhealthy.
 * Story 84.3: Dismissable per session, re-appears if errorCount increases.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useTokenHealth } from '@/hooks/useTokenHealth'
import { ROUTES } from '@/lib/routes'

const STORAGE_KEY = 'token-health-dismissed'

interface DismissedState {
  dismissed: boolean
  errorCount: number
}

function getDismissedState(): DismissedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'dismissed' in parsed &&
      'errorCount' in parsed
    ) {
      const obj = parsed as Record<string, unknown>
      if (typeof obj.dismissed === 'boolean' && typeof obj.errorCount === 'number') {
        return { dismissed: obj.dismissed, errorCount: obj.errorCount }
      }
    }
    return null
  } catch {
    return null
  }
}

function setDismissedState(errorCount: number): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissed: true, errorCount }))
}

export function TokenHealthBanner() {
  const cabinetId = useAuthStore(state => state.cabinetId)
  const { data } = useTokenHealth(cabinetId ?? '')
  const [dismissed, setDismissed] = useState(false)

  // Check if banner was dismissed but errorCount changed
  useEffect(() => {
    if (!data) return
    const prev = getDismissedState()
    if (prev?.dismissed && (data.errorCount ?? 0) > prev.errorCount) {
      setDismissed(false) // Re-appear — new errors since dismissal
    } else if (prev?.dismissed) {
      setDismissed(true)
    }
  }, [data])

  if (!data || data.healthy || dismissed) return null

  // Capture data to a non-null local so the handleDismiss closure (and the JSX
  // below) can read it without TypeScript losing the narrow from the early return.
  // Function declarations don't inherit narrowing from outer-scope guards, so
  // referencing `data` directly inside `function handleDismiss` would re-widen
  // it back to `TokenHealthResponse | undefined`. CLAUDE.md anti-pattern #2.
  const safeData = data

  function handleDismiss() {
    setDismissedState(safeData.errorCount ?? 0)
    setDismissed(true)
  }

  return (
    <Alert className="mx-4 mt-2 border-yellow-300 bg-yellow-50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <p className="font-medium">Проблема с WB API токеном</p>
            {data.recommendation && <p className="mt-1 text-sm">{data.recommendation}</p>}
            {data.lastError && (
              <p className="mt-1 text-xs text-yellow-700">
                Ошибка: {data.lastError}
                {data.lastErrorAt && ` (${new Date(data.lastErrorAt).toLocaleString('ru-RU')})`}
              </p>
            )}
            <Link
              href={ROUTES.SETTINGS.CABINET}
              className="mt-2 inline-block text-sm font-medium text-yellow-800 underline"
            >
              Настройки кабинета
            </Link>
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="shrink-0 text-yellow-700 hover:text-yellow-900"
          aria-label="Скрыть предупреждение"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
}
