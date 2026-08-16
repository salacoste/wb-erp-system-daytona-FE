'use client'

/**
 * AutoFillWarning - Warning alert for missing auto-fill data
 * Story 44.26b-FE: Auto-fill Dimensions & Category
 *
 * Displays dismissible warning when product has missing dimensions or category
 */

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'

export interface AutoFillWarningProps {
  /** Type of missing data */
  type: 'dimensions' | 'category'
  /** Optional custom message */
  message?: string
  /** Whether warning can be dismissed */
  dismissible?: boolean
}

const DEFAULT_MESSAGES = {
  dimensions: 'Габариты не указаны в карточке WB. Введите габариты вручную ниже.',
  category: 'Категория не указана в карточке WB. Выберите категорию вручную.',
}

/**
 * Warning component for missing auto-fill data
 * Shows when product is selected but lacks dimensions or category
 */
export function AutoFillWarning({ type, message, dismissible = true }: AutoFillWarningProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const displayMessage = message ?? DEFAULT_MESSAGES[type]

  return (
    <Alert
      variant="default"
      className="border-yellow-300 bg-yellow-50"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" aria-hidden="true" />
        <AlertDescription className="flex-1 text-yellow-800 text-sm">
          {displayMessage}
        </AlertDescription>
        {dismissible && (
          // TD-E (issue #13): min-h/min-w raise the button's hit-area to the
          // 44px touch floor. The X ICON stays 16px (h-4) — it is the button
          // BOX that grows from 24px (h-6/w-6) to 44px, making the alert row
          // ~20px taller. In-flow growth (unlike the absolute-positioned
          // MissingCogsAlert dismiss, which overlays without shifting layout).
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-6 w-6 min-h-11 min-w-11 p-0 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 shrink-0"
            aria-label="Закрыть предупреждение"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}
