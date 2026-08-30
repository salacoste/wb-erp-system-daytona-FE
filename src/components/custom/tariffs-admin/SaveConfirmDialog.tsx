'use client'

// ============================================================================
// Save Confirm Dialog
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Confirmation dialog before saving tariff changes
// ============================================================================

import { Loader2 } from 'lucide-react'
import type { MouseEvent } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface SaveConfirmDialogProps {
  /** Whether dialog is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when confirmed */
  onConfirm: () => void
  /** Whether save is in progress */
  isPending?: boolean
  /** Whether the previous save attempt failed and can be retried */
  hasError?: boolean
  /** Focus destination after the controlled dialog closes */
  onReturnFocus?: () => void
}

/**
 * Confirmation dialog for saving tariff settings
 *
 * AC8: Confirm dialog before save: "Сохранить изменения тарифов?"
 */
export function SaveConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  hasError = false,
  onReturnFocus,
}: SaveConfirmDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isPending) return
    onOpenChange(nextOpen)
  }

  const handleConfirm = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto"
        onEscapeKeyDown={event => {
          if (isPending) event.preventDefault()
        }}
        onCloseAutoFocus={event => {
          event.preventDefault()
          onReturnFocus?.()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Сохранить изменения тарифов?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Новые тарифы вступят в силу немедленно и будут применяться ко всем последующим
                расчётам. Это действие будет записано в журнал изменений.
              </p>
              {hasError && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-foreground"
                >
                  <p className="font-medium text-destructive">Не удалось сохранить тарифы</p>
                  <p>Введённые значения сохранены в форме. Проверьте соединение и повторите.</p>
                </div>
              )}
              {isPending && (
                <p role="status" aria-live="polite" className="text-foreground">
                  Сохраняем тарифы. Не закрывайте окно до завершения операции.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                Сохранение...
              </>
            ) : hasError ? (
              'Повторить сохранение'
            ) : (
              'Подтвердить'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
