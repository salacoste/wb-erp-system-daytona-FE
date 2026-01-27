'use client'

import { Button } from '@/components/ui/button'
import { Loader2, Calculator, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

/**
 * Props for FormActionsSection component
 */
export interface FormActionsSectionProps {
  /** Show loading state on submit button */
  loading?: boolean
  /** Disable all buttons */
  disabled?: boolean
  /** Whether form is valid for submission */
  isValid: boolean
  /** Callback when reset is clicked */
  onReset: () => void
  /** Optional preset actions slot (Story 44.44) */
  presetActions?: ReactNode
}

/**
 * Form action buttons section for price calculator
 * Includes: Reset button and Submit button with loading state
 *
 * Story 44.2-FE: Input Form Component
 * Story 44.5-FE: Real-time Calculation & UX Enhancements
 *
 * Features:
 * - Esc keyboard shortcut hint on reset button
 * - Enter keyboard shortcut hint on submit button
 * - Loading spinner during calculation
 *
 * @example
 * <FormActionsSection
 *   loading={isPending}
 *   disabled={isLoading}
 *   isValid={formState.isValid}
 *   onReset={handleReset}
 * />
 */
export function FormActionsSection({
  loading = false,
  disabled = false,
  isValid,
  onReset,
  presetActions,
}: FormActionsSectionProps) {
  return (
    <div className="border-t border-muted pt-6">
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Расчёт...</span>
        </div>
      )}

      {/* Story 44.44: Preset Save/Clear buttons */}
      {presetActions && <div className="mb-4">{presetActions}</div>}

      <div className="flex gap-4 flex-col md:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={disabled || loading}
          className="flex items-center gap-2"
          title="Нажмите Esc для сброса"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Сбросить
        </Button>
        <Button
          type="submit"
          disabled={disabled || loading || !isValid}
          className={cn(
            'flex-1 flex items-center justify-center gap-2',
            'bg-gradient-to-r from-primary to-primary/80',
            'hover:shadow-md hover:from-primary/90 hover:to-primary/70',
            'transition-all duration-200'
          )}
          title="Нажмите Enter для расчёта"
        >
          <Calculator className="h-4 w-4" aria-hidden="true" />
          {loading ? 'Расчёт...' : 'Рассчитать цену'}
        </Button>
      </div>
    </div>
  )
}
