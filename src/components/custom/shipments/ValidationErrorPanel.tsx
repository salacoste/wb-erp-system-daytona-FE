'use client'

/**
 * Validation error panel — displays all errors simultaneously
 * Epic 76-FE, Story 76.4 (AC: #3)
 */

import { AlertTriangle } from 'lucide-react'
import { type ValidationError, type ValidationErrorCode } from '@/types/shipment-cost'
import { BACKEND_CODE_MAP } from './validation-error-config'
import { ValidationErrorItem } from './ValidationErrorItem'

interface ValidationErrorPanelProps {
  errors: ValidationError[]
}

/** Normalize backend errorCode to frontend ValidationErrorCode */
function normalizeCode(rawCode: string): ValidationErrorCode | null {
  return BACKEND_CODE_MAP[rawCode] ?? null
}

/** Extract all affected box line IDs across all errors */
export function getAffectedBoxLineIds(errors: ValidationError[]): string[] {
  return [...new Set(errors.flatMap(e => e.affectedIds ?? []))]
}

export function ValidationErrorPanel({ errors }: ValidationErrorPanelProps) {
  if (!errors.length) return null

  return (
    <div className="space-y-3" role="alert" aria-label="Ошибки валидации">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Ошибки валидации ({errors.length})</h3>
      </div>
      <div className="space-y-2">
        {errors.map((error, index) => {
          const code = normalizeCode(error.code)
          if (!code) {
            return (
              <div
                key={`unknown-${index}`}
                className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/5 p-3"
              >
                <AlertTriangle
                  className="h-5 w-5 shrink-0 mt-0.5 text-destructive"
                  aria-hidden="true"
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{error.message || error.code}</p>
                  {error.affectedIds && error.affectedIds.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Затронуто: {error.affectedIds.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )
          }
          return (
            <ValidationErrorItem
              key={`${error.code}-${index}`}
              code={code}
              message={error.message}
              affectedIds={error.affectedIds}
            />
          )
        })}
      </div>
    </div>
  )
}
