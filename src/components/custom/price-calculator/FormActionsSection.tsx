'use client'

import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

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
}: FormActionsSectionProps) {
  return (
    <>
      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Расчёт...</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={disabled || loading}
          title="Нажмите Esc для сброса (горячая клавиша)"
        >
          Сбросить
        </Button>
        <Button
          type="submit"
          disabled={disabled || loading || !isValid}
          className="flex-1"
          title="Нажмите Enter для расчёта"
        >
          {loading ? 'Расчёт...' : 'Рассчитать цену'}
        </Button>
      </div>
    </>
  )
}
