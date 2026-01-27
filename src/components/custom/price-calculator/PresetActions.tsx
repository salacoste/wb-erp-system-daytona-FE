/**
 * Preset Actions Component
 * Story 44.44-FE: Preset Save/Load
 *
 * Provides Save and Clear buttons for price calculator presets.
 * Used in conjunction with usePriceCalculatorPreset hook.
 *
 * @see docs/stories/epic-44/story-44.44-fe-preset-save-load.md
 */

'use client'

import { Button } from '@/components/ui/button'
import { Save, Trash2 } from 'lucide-react'
import type { FormData } from './usePriceCalculatorForm'

// ============================================================================
// Types
// ============================================================================

export interface PresetActionsProps {
  /** Current form values getter function */
  getFormValues: () => FormData
  /** Whether form is valid for saving */
  isFormValid: boolean
  /** Whether preset exists in storage */
  hasPreset: boolean
  /** Callback to save preset */
  onSave: (values: FormData) => void
  /** Callback to clear preset and reset form */
  onClear: () => void
  /** Disable buttons */
  disabled?: boolean
}

// ============================================================================
// Component
// ============================================================================

/**
 * AC1/AC3: Save and Clear preset buttons
 *
 * Features:
 * - Save button: Saves current form state to localStorage
 * - Clear button: Removes preset and resets form (only shown when preset exists)
 * - Icons for visual clarity
 * - Russian labels
 *
 * @example
 * ```tsx
 * <PresetActions
 *   getFormValues={() => form.getValues()}
 *   isFormValid={isValid}
 *   hasPreset={hasPreset}
 *   onSave={savePreset}
 *   onClear={() => { clearPreset(); form.reset() }}
 * />
 * ```
 */
export function PresetActions({
  getFormValues,
  isFormValid,
  hasPreset,
  onSave,
  onClear,
  disabled = false,
}: PresetActionsProps) {
  const handleSave = () => {
    const values = getFormValues()
    onSave(values)
  }

  return (
    <div className="flex gap-2" data-testid="preset-actions">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSave}
        disabled={disabled || !isFormValid}
        className="flex items-center gap-1.5"
        title="Сохранить текущие значения как пресет"
      >
        <Save className="h-3.5 w-3.5" aria-hidden="true" />
        Сохранить пресет
      </Button>

      {hasPreset && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={disabled}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive"
          title="Удалить сохранённый пресет"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Очистить
        </Button>
      )}
    </div>
  )
}
