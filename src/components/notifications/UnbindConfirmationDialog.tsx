// ============================================================================
// Unbind Confirmation Dialog Component
// Epic 34-FE: Story 34.2-FE
// ============================================================================

'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useTelegramBinding } from '@/hooks/useTelegramBinding';
import { toast } from 'sonner';

// ============================================================================
// Component Props
// ============================================================================

interface UnbindConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
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
}: UnbindConfirmationDialogProps) {
  // ============================================================================
  // Hooks
  // ============================================================================

  const { unbind, isUnbinding } = useTelegramBinding();

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleUnbind = () => {
    unbind(undefined, {
      onSuccess: () => {
        toast.success('Telegram отключен');
        onConfirm();
      },
      onError: (error) => {
        toast.error('Не удалось отключить Telegram. Попробуйте ещё раз.');
        console.error('Unbind error:', error);
      },
    });
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[480px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="text-orange-500 text-2xl" role="img" aria-label="Предупреждение">
              ⚠️
            </span>
            Отключить Telegram?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="text-gray-700">
              Вы уверены, что хотите отключить Telegram-уведомления?
            </p>

            <ul className="space-y-2 text-sm text-gray-600">
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
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isUnbinding}
            aria-label="Отменить отключение"
          >
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
  );
}
