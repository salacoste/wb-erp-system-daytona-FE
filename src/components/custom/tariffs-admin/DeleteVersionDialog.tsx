'use client'

// ============================================================================
// Delete Version Dialog Component
// Epic 52-FE: Story 52-FE.5 - Delete Scheduled Version
// Confirmation dialog for deleting scheduled tariff versions
// ============================================================================

import { Trash2, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useDeleteTariffVersion } from '@/hooks/useDeleteTariffVersion'
import { formatDate } from '@/lib/utils'
import type { TariffVersion } from '@/types/tariffs-admin'

interface DeleteVersionDialogProps {
  /** Whether dialog is open */
  open: boolean
  /** Version to delete, null when closed */
  version: TariffVersion | null
  /** Callback when dialog should close */
  onClose: () => void
}

/**
 * Confirmation dialog for deleting scheduled tariff versions
 *
 * Features:
 * - Displays formatted date of version to delete
 * - Warning about irreversible action
 * - Loading state during deletion
 * - Accessible with proper ARIA labels
 * - Closes on ESC or Cancel click
 *
 * @example
 * ```tsx
 * const [versionToDelete, setVersionToDelete] = useState<TariffVersion | null>(null)
 *
 * <DeleteVersionDialog
 *   open={!!versionToDelete}
 *   version={versionToDelete}
 *   onClose={() => setVersionToDelete(null)}
 * />
 * ```
 */
export function DeleteVersionDialog({
  open,
  version,
  onClose,
}: DeleteVersionDialogProps) {
  const deleteVersion = useDeleteTariffVersion()

  const handleConfirm = () => {
    if (version) {
      deleteVersion.mutate(version.id, {
        onSuccess: () => {
          onClose()
        },
      })
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    // Only allow closing when not loading
    if (!isOpen && !deleteVersion.isPending) {
      onClose()
    }
  }

  // Don't render if no version selected
  if (!version) {
    return null
  }

  const formattedDate = formatDate(version.effective_from)

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent aria-label="Удалить запланированную версию?">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span className="text-amber-500">⚠️</span>
            Подтвердите удаление
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground space-y-2">
              <span className="block">
                Вы уверены, что хотите удалить версию, запланированную на{' '}
                <strong>{formattedDate}</strong>?
              </span>
              <span className="block text-red-600">
                Это действие нельзя отменить.
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteVersion.isPending}
            aria-label="Отмена"
          >
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteVersion.isPending}
            aria-label={deleteVersion.isPending ? 'Удаление...' : 'Удалить'}
          >
            {deleteVersion.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Удаление...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
