'use client'

/**
 * COGS Delete Confirmation Dialog
 * Story 5.3-fe: COGS Delete Confirmation Dialog
 *
 * AlertDialog for soft-deleting COGS record with version chain warnings.
 * Shows detailed summary, what will happen after deletion, confirmation checkbox
 * for only version case.
 *
 * AC: 1-17
 * Reference: frontend/docs/stories/epic-5/story-5.3-fe-cogs-delete-dialog.md
 */

import { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Info, Loader2 } from 'lucide-react'
import {
  useCogsDelete,
  analyzeVersionChain,
  formatDateForDelete,
  formatCurrencyForDelete,
} from '@/hooks/useCogsDelete'
import type { CogsHistoryItem } from '@/types/cogs'

interface CogsDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: CogsHistoryItem
  history: CogsHistoryItem[]
  onSuccess?: () => void
}

export function CogsDeleteDialog({
  open,
  onOpenChange,
  record,
  history,
  onSuccess,
}: CogsDeleteDialogProps) {
  const [confirmed, setConfirmed] = useState(false)

  // Reset confirmed state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setConfirmed(false)
    }
  }, [open])

  // Analyze version chain (AC: 7, 8)
  const versionInfo = analyzeVersionChain(record, history)

  // Mutation hook (AC: 13, 14, 15, 16, 17)
  const mutation = useCogsDelete(record.cogs_id, {
    onSuccess: () => {
      onOpenChange(false)
      onSuccess?.()
    },
  })

  const handleDelete = () => {
    if (versionInfo.isOnlyVersion && !confirmed) return
    mutation.mutate()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {/* Dialog title (AC: 4) */}
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Удаление записи COGS
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Detailed summary (AC: 5, 6) */}
              <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
                <div>
                  Себестоимость: {formatCurrencyForDelete(record.unit_cost_rub)}
                </div>
                <div>
                  Период действия: {formatDateForDelete(record.valid_from)} —{' '}
                  {formatDateForDelete(record.valid_to)}
                </div>
                <div>Затронутые недели: {record.affected_weeks.length}</div>
              </div>

              {/* What will happen after deletion (AC: 5) */}
              <div className="text-sm">
                <p className="font-medium mb-2 text-foreground">После удаления:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>
                    Маржа будет пересчитана для {record.affected_weeks.length}{' '}
                    недель
                  </li>
                  {versionInfo.hasPreviousVersion && (
                    <li>Предыдущая версия станет активной</li>
                  )}
                </ul>
              </div>

              {/* Version chain warning with previous version info (AC: 7) */}
              {versionInfo.isCurrentVersion && versionInfo.hasPreviousVersion && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    После удаления предыдущая версия (
                    {formatCurrencyForDelete(versionInfo.previousVersionCost!)}{' '}
                    от {formatDateForDelete(versionInfo.previousVersionDate!)})
                    станет активной.
                  </AlertDescription>
                </Alert>
              )}

              {/* Only version warning - red alert (AC: 8) */}
              {versionInfo.isOnlyVersion && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Внимание!</AlertTitle>
                  <AlertDescription>
                    Это единственная запись COGS для товара. После удаления расчёт
                    маржи станет невозможен.
                  </AlertDescription>
                </Alert>
              )}

              {/* Confirmation checkbox for only version (AC: 12) */}
              {versionInfo.isOnlyVersion && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="confirm-delete"
                    checked={confirmed}
                    onCheckedChange={(checked) => setConfirmed(checked === true)}
                  />
                  <Label htmlFor="confirm-delete" className="text-sm">
                    Я понимаю, что товар останется без COGS
                  </Label>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Form actions (AC: 9, 10, 11) */}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Отмена
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={
              mutation.isPending || (versionInfo.isOnlyVersion && !confirmed)
            }
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Удалить
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
