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
import type { RefObject } from 'react'
import type { TariffSettingsFormData } from './tariffSettingsSchema'

interface TariffFormActionsProps {
  notes: string | undefined
  setValue: UseFormSetValue<TariffSettingsFormData>
  isSaving: boolean
  isValid: boolean
  isDirty: boolean
  onSaveClick: () => void
  onCancel: () => void
  saveButtonRef?: RefObject<HTMLButtonElement | null>
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
  saveButtonRef,
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
          aria-describedby="tariff-notes-description tariff-notes-count"
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setValue('notes', e.target.value, { shouldDirty: true, shouldValidate: true })
          }
          className="resize-none"
          rows={3}
          maxLength={500}
        />
        <p id="tariff-notes-description" className="text-xs text-muted-foreground">
          Укажите причину изменения, чтобы она была понятна в журнале тарифов.
        </p>
        <p id="tariff-notes-count" className="text-right text-xs text-muted-foreground">
          {notes?.length ?? 0}/500
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving || !isDirty}
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-2" />
          Отмена
        </Button>
        <Button
          ref={saveButtonRef}
          type="button"
          onClick={onSaveClick}
          disabled={isSaving || !isValid || !isDirty}
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </>
  )
}
