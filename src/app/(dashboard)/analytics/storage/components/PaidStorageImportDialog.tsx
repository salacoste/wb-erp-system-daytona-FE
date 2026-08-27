'use client'

import { Upload, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useStorageImport } from './useStorageImport'
import {
  ImportIdleForm,
  ImportProcessing,
  ImportSuccess,
  ImportError,
} from './PaidStorageImportStatus'

/**
 * Paid Storage Import Dialog
 * Story 24.6-FE: Manual Import UI
 * Epic 24: Paid Storage Analytics (Frontend)
 */

interface PaidStorageImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PaidStorageImportDialog({ open, onOpenChange }: PaidStorageImportDialogProps) {
  const {
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    importState,
    statusData,
    showCloseConfirm,
    setShowCloseConfirm,
    validationError,
    isPending,
    handleStartImport,
    handleClose,
    handleConfirmClose,
    handleReset,
  } = useStorageImport(onOpenChange)

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Импорт данных о хранении
            </DialogTitle>
            <DialogDescription>Загрузка данных о платном хранении из WB API</DialogDescription>
          </DialogHeader>

          {importState.status === 'idle' && (
            <ImportIdleForm
              dateFrom={dateFrom}
              dateTo={dateTo}
              setDateFrom={setDateFrom}
              setDateTo={setDateTo}
              validationError={validationError}
              isPending={isPending}
              onStart={handleStartImport}
              onCancel={handleClose}
            />
          )}

          {importState.status === 'idle' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded-lg">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>Автоматический импорт: каждый вторник в 08:00 МСК</span>
            </div>
          )}

          {importState.status === 'processing' && (
            <ImportProcessing statusUnknown={statusData?.status === 'unknown'} />
          )}

          {importState.status === 'success' && (
            <ImportSuccess
              rowsImported={importState.rowsImported}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onClose={handleClose}
            />
          )}

          {importState.status === 'error' && (
            <ImportError
              code={importState.code}
              message={importState.message}
              onClose={handleClose}
              onRetry={handleReset}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Close confirmation dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Прервать импорт?</AlertDialogTitle>
            <AlertDialogDescription>
              Импорт продолжится в фоновом режиме. Вы можете проверить статус позже.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Остаться</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>Закрыть</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
