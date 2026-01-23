'use client'

// ============================================================================
// Save Confirm Dialog
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Confirmation dialog before saving tariff changes
// ============================================================================

import { Loader2 } from 'lucide-react'
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
}: SaveConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Сохранить изменения тарифов?</AlertDialogTitle>
          <AlertDialogDescription>
            Новые тарифы вступят в силу немедленно и будут применяться ко всем
            последующим расчётам. Это действие будет записано в журнал изменений.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              'Подтвердить'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
