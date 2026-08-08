'use client'

/**
 * ConfirmAction — NEW-2 accessible two-click confirmation dialog for one-shot
 * write actions (pin/unpin, send). The user gesture that opens this dialog +
 * clicks "Подтвердить" IS the confirmation proof the BE confirmationToken
 * represents (the hook rotates a fresh crypto.randomUUID token on the firing
 * call). Accessible via radix AlertDialog (keyboard + screen-reader).
 *
 * Controlled `open`/`onOpenChange` so the parent owns the gesture state.
 */

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

export interface ConfirmActionProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Dialog title (e.g. "Закрепить отзыв?"). */
  title: string
  /** Descriptive body (RU). */
  description: string
  /** Confirm-button label (RU, e.g. "Закрепить"). */
  confirmLabel: string
  /** Fired on confirm — the parent runs the mutation (which mints the token). */
  onConfirm: () => void
  /** True while the confirmed action is pending (disables both buttons). */
  isPending?: boolean
}

/** Render the radix AlertDialog wired to the parent's mutation. */
export function ConfirmAction({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  isPending,
}: ConfirmActionProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={event => {
              // Prevent radix auto-close so the parent can drive close on terminal.
              event.preventDefault()
              onConfirm()
            }}
          >
            {isPending ? '…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
