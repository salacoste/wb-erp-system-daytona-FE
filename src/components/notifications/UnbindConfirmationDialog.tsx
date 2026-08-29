// ============================================================================
// Unbind Confirmation Dialog Component
// Epic 34-FE: Story 34.2-FE
// ============================================================================

'use client'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { useTelegramBinding } from '@/hooks/useTelegramBinding'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import type { MouseEvent } from 'react'

// ============================================================================
// Component Props
// ============================================================================

interface UnbindConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onReturnFocus?: () => void
}

// ============================================================================
// Component
// ============================================================================

/**
 * Confirmation dialog for removing Telegram binding
 *
 * Features:
 * - Warning message with consequences explained
 * - Bullet points listing what happens after unbind
 * - Two-button layout: Cancel (secondary) and Unbind (danger)
 * - Success toast notification after unbind
 *
 * @see docs/stories/epic-34/story-34.2-fe-telegram-binding-flow.md
 */
export function UnbindConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  onReturnFocus,
}: UnbindConfirmationDialogProps) {
  // ============================================================================
  // Hooks
  // ============================================================================

  const { unbind, isUnbinding } = useTelegramBinding()

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleUnbind = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    unbind(undefined, {
      onSuccess: () => {
        toast.success('Telegram отключен')
        onConfirm()
      },
      onError: error => {
        toast.error('Не удалось отключить Telegram. Попробуйте ещё раз.')
        logger.error('Unbind error:', error)
      },
    })
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AlertDialog
      open={open}
      onOpenChange={nextOpen => {
        if (isUnbinding && !nextOpen) return
        onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent
        className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-[480px]"
        onEscapeKeyDown={event => {
          if (isUnbinding) event.preventDefault()
        }}
        onCloseAutoFocus={event => {
          if (!onReturnFocus) return
          event.preventDefault()
          onReturnFocus()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="text-2xl text-status-warning" aria-hidden="true">
              ⚠️
            </span>
            Отключить Telegram?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p className="text-foreground">
                Вы уверены, что хотите отключить Telegram-уведомления?
              </p>

              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Вы перестанете получать уведомления о задачах</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Настройки будут сброшены</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Вы сможете переподключить Telegram в любое время</span>
                </li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUnbinding} aria-label="Отменить отключение">
            Отменить
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnbind}
            disabled={isUnbinding}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            aria-label="Подтвердить отключение Telegram"
          >
            {isUnbinding ? 'Отключение...' : 'Отключить Telegram'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
