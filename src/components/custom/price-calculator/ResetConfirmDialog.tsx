'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Props for ResetConfirmDialog component
 */
export interface ResetConfirmDialogProps {
  /** Whether dialog is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when reset is confirmed */
  onConfirm: () => void
}

/**
 * Reset confirmation dialog for price calculator
 * Shown when user attempts to reset form with existing results
 *
 * Story 44.5-FE: Real-time Calculation & UX Enhancements
 *
 * @example
 * <ResetConfirmDialog
 *   open={showResetConfirm}
 *   onOpenChange={setShowResetConfirm}
 *   onConfirm={handleConfirmReset}
 * />
 */
export function ResetConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: ResetConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Подтверждение сброса</DialogTitle>
          <DialogDescription>
            Вы уверены, что хотите сбросить форму? Все текущие значения будут
            очищены.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Сбросить форму
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
