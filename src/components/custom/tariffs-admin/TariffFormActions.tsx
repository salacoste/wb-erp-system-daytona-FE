'use client'

// ============================================================================
// Tariff Form Actions (Notes + Buttons)
// Epic 52-FE / Story 74.6: Extracted from TariffSettingsForm.tsx
// Notes textarea and Save/Cancel action buttons
// ============================================================================

import { Save, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { UseFormSetValue } from 'react-hook-form'
import type { TariffSettingsFormData } from './tariffSettingsSchema'

interface TariffFormActionsProps {
  notes: string | undefined
  setValue: UseFormSetValue<TariffSettingsFormData>
  isSaving: boolean
  isValid: boolean
  isDirty: boolean
  onSaveClick: () => void
  onCancel: () => void
}

/**
 * Notes textarea and action buttons for the tariff settings form.
 * Handles Cancel (reset) and Save (open confirmation dialog) actions.
 */
export function TariffFormActions({
  notes,
  setValue,
  isSaving,
  isValid,
  isDirty,
  onSaveClick,
  onCancel,
}: TariffFormActionsProps) {
  return (
    <>
      {/* Notes textarea */}
      <div className="space-y-2 pt-4">
        <Label htmlFor="notes" className="text-sm font-medium">
          Заметки
        </Label>
        <Textarea
          id="notes"
          placeholder="Причина изменения тарифов..."
          disabled={isSaving}
          value={notes ?? ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setValue('notes', e.target.value)
          }
          className="resize-none"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">{notes?.length ?? 0}/500</p>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving || !isDirty}>
          <X className="h-4 w-4 mr-2" />
          Отмена
        </Button>
        <Button type="button" onClick={onSaveClick} disabled={isSaving || !isValid || !isDirty}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Сохранить
        </Button>
      </div>
    </>
  )
}
