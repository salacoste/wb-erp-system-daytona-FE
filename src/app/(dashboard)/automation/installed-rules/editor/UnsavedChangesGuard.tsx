'use client'

/**
 * UnsavedChangesGuard (Story 163.3-FE, AC #7).
 *
 * Confirmation dialog shown when the operator tries to leave the editor with
 * unsaved edits. "Покинуть редактор? Несохранённые изменения будут потеряны."
 * Two actions: «Остаться» (default, keeps input) and «Покинуть» (proceeds).
 *
 * Purely presentational; the editor owns `open` + the onConfirm/onCancel wiring.
 */
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

interface UnsavedChangesGuardProps {
  open: boolean
  /** Called when the operator confirms leaving (discards unsaved edits). */
  onConfirmLeave: () => void
  /** Called when the operator chooses to stay. */
  onCancelStay: () => void
}

export function UnsavedChangesGuard({
  open,
  onConfirmLeave,
  onCancelStay,
}: UnsavedChangesGuardProps) {
  return (
    <AlertDialog open={open} onOpenChange={next => (next ? undefined : onCancelStay())}>
      <AlertDialogContent data-testid="unsaved-changes-guard">
        <AlertDialogHeader>
          <AlertDialogTitle>Покинуть редактор?</AlertDialogTitle>
          <AlertDialogDescription>Несохранённые изменения будут потеряны.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancelStay} data-testid="unsaved-stay">
            Остаться
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmLeave} data-testid="unsaved-leave">
            Покинуть
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
