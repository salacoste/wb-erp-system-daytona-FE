'use client'

import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FieldTooltip } from './FieldTooltip'
import { formatCurrency } from '@/lib/utils'

/**
 * Props for FixedCostField wrapper component
 * Provides consistent layout with reserved space for badges and helper text
 */
export interface FixedCostFieldProps {
  /** Input field ID for label association */
  id: string
  /** Field label text */
  label: string
  /** Tooltip help content */
  tooltipContent: string
  /** Whether to show the auto-filled badge */
  showBadge?: boolean
  /** Custom badge text (default: "Автозаполнено") */
  badgeText?: string
  /** Calculated value to display in helper text */
  calculatedValue?: number | null
  /** Whether to show the "Рассчитано:" helper text */
  showCalculated?: boolean
  /** Error message to display */
  error?: string
  /** Input element(s) to render */
  children: React.ReactNode
}

/**
 * Fixed cost field wrapper with consistent layout zones:
 * - Zone 1: Label row with reserved space for badge (min-h-[24px])
 * - Zone 2: Input field
 * - Zone 3: Helper text with reserved height (min-h-[20px])
 *
 * This ensures all fields in the grid have the same height regardless
 * of whether they have badges or calculated values.
 */
export function FixedCostField({
  id,
  label,
  tooltipContent,
  showBadge = false,
  badgeText = 'Автозаполнено',
  calculatedValue,
  showCalculated = false,
  error,
  children,
}: FixedCostFieldProps) {
  return (
    <div className="flex flex-col">
      {/* Zone 1: Label Row - fixed height for consistent alignment */}
      <div className="flex items-center gap-2 mb-2 min-h-[24px]">
        <Label htmlFor={id} className="flex-1">
          {label}
        </Label>
        {showBadge && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
            {badgeText}
          </Badge>
        )}
        <FieldTooltip content={tooltipContent} />
      </div>

      {/* Zone 2: Input field */}
      {children}

      {/* Zone 3: Helper text with reserved height */}
      <div className="min-h-[20px] mt-1.5">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : showCalculated && calculatedValue != null ? (
          <p className="text-xs text-muted-foreground">
            Рассчитано: {formatCurrency(calculatedValue)}
          </p>
        ) : null}
      </div>
    </div>
  )
}
