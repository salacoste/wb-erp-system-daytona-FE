'use client'

/**
 * COGS Edit Dialog Component
 * Story 5.2-fe: COGS Edit Dialog
 *
 * Modal dialog for editing existing COGS record (not creating new version).
 * Shows read-only info, editable fields with validation, margin warning.
 *
 * AC: 1-24
 * Reference: frontend/docs/stories/epic-5/story-5.2-fe-cogs-edit-dialog.md
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Info } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  useCogsEdit,
  hasCogsChanges,
  buildUpdatePayload,
  validateUnitCost,
  validateNotes,
} from '@/hooks/useCogsEdit'
import type { CogsHistoryItem } from '@/types/cogs'
import { cn } from '@/lib/utils'

interface CogsEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: CogsHistoryItem
  onSuccess?: () => void
}

/**
 * Format date to Russian locale (dd.mm.yyyy)
 */
function formatDateRu(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

/**
 * Format currency to Russian locale with RUB symbol
 */
function formatCurrencyRu(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const sourceLabels: Record<string, string> = {
  manual: 'Ручной ввод',
  import: 'Импорт из файла',
  system: 'Системный пересчёт',
}

export function CogsEditDialog({
  open,
  onOpenChange,
  record,
  onSuccess,
}: CogsEditDialogProps) {
  // Form state
  const [unitCostRub, setUnitCostRub] = useState('')
  const [notes, setNotes] = useState('')

  // Reset form when dialog opens with new record
  useEffect(() => {
    if (open) {
      setUnitCostRub(String(record.unit_cost_rub))
      setNotes(record.notes || '')
    }
  }, [open, record.unit_cost_rub, record.notes])

  // Validation (AC: 10, 11, 12, 13)
  const costError = validateUnitCost(unitCostRub)
  const notesError = validateNotes(notes)

  const parsedCost = parseFloat(unitCostRub)
  const hasChanges = hasCogsChanges(
    { unit_cost_rub: record.unit_cost_rub, notes: record.notes },
    { unit_cost_rub: parsedCost, notes }
  )

  const canSubmit = !costError && !notesError && hasChanges

  // Mutation hook (AC: 19, 20, 21, 22, 23, 24)
  const mutation = useCogsEdit(record.cogs_id, {
    onSuccess: () => {
      onOpenChange(false)
      onSuccess?.()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || mutation.isPending) return

    const payload = buildUpdatePayload(
      { unit_cost_rub: record.unit_cost_rub, notes: record.notes },
      { unit_cost_rub: parsedCost, notes }
    )

    mutation.mutate(payload)
  }

  // Check if cost has changed for margin warning (AC: 9)
  const costHasChanged =
    !isNaN(parsedCost) && parsedCost !== record.unit_cost_rub

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактирование COGS</DialogTitle>
          <DialogDescription>
            Измените себестоимость или примечание.
          </DialogDescription>
        </DialogHeader>

        {/* Read-only info (AC: 5) */}
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground border-b pb-4">
          <div>Артикул: {record.nm_id}</div>
          <div>Источник: {sourceLabels[record.source] || record.source}</div>
          <div className="col-span-2">
            Дата начала: {formatDateRu(record.valid_from)}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Unit cost field (AC: 6, 7, 8, 10, 13) */}
          <div className="space-y-2">
            <Label htmlFor="unit_cost_rub">Себестоимость (₽)</Label>
            {/* Current value display (AC: 8) */}
            <div className="text-sm text-muted-foreground">
              Текущее: {formatCurrencyRu(record.unit_cost_rub)}
            </div>
            <Input
              id="unit_cost_rub"
              type="number"
              step="0.01"
              min="0.01"
              value={unitCostRub}
              onChange={(e) => setUnitCostRub(e.target.value)}
              className={cn(costError && unitCostRub && 'border-destructive')}
              disabled={mutation.isPending}
            />
            {/* Validation error (AC: 13) */}
            {costError && unitCostRub && (
              <p className="text-sm text-destructive">{costError}</p>
            )}
            {/* Margin warning (AC: 9) */}
            {costHasChanged && !costError && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Info className="h-4 w-4" />
                Изменение затронет маржу за {record.affected_weeks.length} недель
              </p>
            )}
          </div>

          {/* Notes field (AC: 6, 11, 14) */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="notes">Примечание</Label>
              {/* Character counter - show when >800 (AC: 14) */}
              {notes.length > 800 && (
                <span
                  className={cn(
                    'text-xs',
                    notes.length > 950
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  {notes.length}/1000
                </span>
              )}
            </div>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              maxLength={1000}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={mutation.isPending}
            />
            {/* Validation error (AC: 13) */}
            {notesError && <p className="text-sm text-destructive">{notesError}</p>}
          </div>

          {/* Form actions (AC: 15, 16, 17, 18) */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending || !canSubmit}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
