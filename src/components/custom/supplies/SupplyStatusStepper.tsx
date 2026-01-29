'use client'

/**
 * SupplyStatusStepper Component
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Visual lifecycle progress for supply status.
 */

import { Check, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SupplyStatus } from '@/types/supplies'

// Step configuration
const STEPS = [
  { status: 'OPEN', label: 'Открыта' },
  { status: 'CLOSED', label: 'Закрыта' },
  { status: 'DELIVERING', label: 'В пути' },
  { status: 'DELIVERED', label: 'Доставлена' },
] as const

// Status to index mapping
const STATUS_ORDER: Record<SupplyStatus, number> = {
  OPEN: 0,
  CLOSED: 1,
  DELIVERING: 2,
  DELIVERED: 3,
  CANCELLED: -1,
}

interface SupplyStatusStepperProps {
  status: SupplyStatus
  className?: string
}

/** Cancelled state display */
function CancelledState() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
        <XCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
      </div>
      <div>
        <p className="font-medium text-red-700">Отменена</p>
        <p className="text-sm text-red-600">Поставка была отменена</p>
      </div>
    </div>
  )
}

export function SupplyStatusStepper({ status, className }: SupplyStatusStepperProps) {
  // Special case for cancelled status
  if (status === 'CANCELLED') {
    return <CancelledState />
  }

  const currentIndex = STATUS_ORDER[status]

  return (
    <nav aria-label="Статус поставки" className={cn('rounded-lg border bg-white p-4', className)}>
      <ol className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIndex
          const isCurrent = index === currentIndex
          const isFuture = index > currentIndex
          const isLast = index === STEPS.length - 1

          return (
            <li key={step.status} className="flex flex-1 items-center">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                    isComplete && 'border-green-500 bg-green-500',
                    isCurrent && 'border-primary bg-primary',
                    isFuture && 'border-gray-300 bg-white'
                  )}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5 text-white" aria-hidden="true" />
                  ) : (
                    <span
                      className={cn(
                        'h-3 w-3 rounded-full',
                        isCurrent && 'bg-white',
                        isFuture && 'bg-gray-300'
                      )}
                    />
                  )}
                </div>

                {/* Step label */}
                <span
                  className={cn(
                    'mt-2 text-sm font-medium',
                    isComplete && 'text-green-600',
                    isCurrent && 'text-primary',
                    isFuture && 'text-gray-400'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1',
                    index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
