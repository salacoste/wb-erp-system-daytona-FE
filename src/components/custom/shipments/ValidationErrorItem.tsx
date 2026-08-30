'use client'

/**
 * Single validation error display with navigation links
 * Epic 76-FE, Story 76.4 (AC: #3, #4, #5)
 */

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { type ValidationErrorCode } from '@/types/shipment-cost'
import { VALIDATION_ERROR_MAP } from './validation-error-config'

interface ValidationErrorItemProps {
  code: ValidationErrorCode
  message: string
  affectedIds?: string[]
}

export function ValidationErrorItem({ code, message, affectedIds }: ValidationErrorItemProps) {
  const config = VALIDATION_ERROR_MAP[code]
  if (!config) return null

  const Icon = config.icon
  const borderClass =
    config.severity === 'error'
      ? 'border-destructive/50 bg-destructive/5'
      : 'border-status-warning/30 bg-status-warning/10'

  return (
    <div className={`flex items-start gap-3 rounded-md border p-3 ${borderClass}`}>
      <Icon
        className={`h-5 w-5 shrink-0 mt-0.5 ${config.severity === 'error' ? 'text-destructive' : 'text-status-warning'}`}
        aria-hidden="true"
      />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{config.message}</p>
        {message !== config.message && <p className="text-xs text-muted-foreground">{message}</p>}
        {affectedIds && affectedIds.length > 0 && config.linkPattern && (
          <div className="flex flex-wrap gap-2 mt-1">
            {affectedIds.map(id => (
              <Link
                key={id}
                href={config.linkPattern!(id)}
                className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                aria-label={`${config.linkLabel ?? 'Исправить'} для ${id}`}
              >
                {config.linkLabel ?? id}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
        {affectedIds && affectedIds.length > 0 && !config.linkPattern && (
          <p className="text-xs text-muted-foreground">Затронуто: {affectedIds.join(', ')}</p>
        )}
      </div>
    </div>
  )
}
