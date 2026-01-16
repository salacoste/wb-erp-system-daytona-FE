'use client'

import { useState, useCallback } from 'react'
import { Upload, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { usePaidStorageImport, useImportStatus } from '@/hooks/useStorageAnalytics'
import { useInvalidateStorageQueries } from '@/hooks/useStorageAnalytics'

/**
 * Paid Storage Import Dialog
 * Story 24.6-FE: Manual Import UI
 * Epic 24: Paid Storage Analytics (Frontend)
 */

interface PaidStorageImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ImportState =
  | { status: 'idle' }
  | { status: 'processing'; importId: string }
  | { status: 'success'; rowsImported: number }
  | { status: 'error'; message: string }

// Format date for display
const formatDateDisplay = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Get default date range (last 7 days)
const getDefaultDates = () => {
  const today = new Date()
  const to = new Date(today)
  to.setDate(to.getDate() - 1) // Yesterday
  const from = new Date(to)
  from.setDate(from.getDate() - 6) // 7 days range

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

// Validate date range
const validateDates = (from: string, to: string): string | null => {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  if (fromDate > toDate) {
    return 'Дата "С" должна быть раньше даты "По"'
  }

  const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  if (diffDays > 8) {
    return `Максимальный период: 8 дней (выбрано: ${diffDays})`
  }

  if (toDate > today) {
    return 'Нельзя импортировать будущие даты'
  }

  return null
}

export function PaidStorageImportDialog({ open, onOpenChange }: PaidStorageImportDialogProps) {
  const defaultDates = getDefaultDates()
  const [dateFrom, setDateFrom] = useState(defaultDates.from)
  const [dateTo, setDateTo] = useState(defaultDates.to)
  const [importState, setImportState] = useState<ImportState>({ status: 'idle' })
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  const importMutation = usePaidStorageImport()
  const invalidateQueries = useInvalidateStorageQueries()

  // Poll import status
  const { data: statusData } = useImportStatus(
    importState.status === 'processing' ? importState.importId : null,
    {
      refetchInterval: importState.status === 'processing' ? 2000 : false,
    }
  )

  // Handle status updates
  if (importState.status === 'processing' && statusData) {
    if (statusData.status === 'completed') {
      setImportState({
        status: 'success',
        rowsImported: statusData.rows_imported || 0,
      })
      invalidateQueries()
    } else if (statusData.status === 'failed') {
      setImportState({
        status: 'error',
        message: statusData.error_message || 'Ошибка импорта',
      })
    }
  }

  const validationError = validateDates(dateFrom, dateTo)

  const handleStartImport = useCallback(async () => {
    if (validationError) return

    try {
      const result = await importMutation.mutateAsync({
        dateFrom,
        dateTo,
      })
      setImportState({ status: 'processing', importId: result.import_id })
    } catch (error) {
      setImportState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Ошибка запуска импорта',
      })
    }
  }, [dateFrom, dateTo, validationError, importMutation])

  const handleClose = useCallback(() => {
    if (importState.status === 'processing') {
      setShowCloseConfirm(true)
    } else {
      setImportState({ status: 'idle' })
      onOpenChange(false)
    }
  }, [importState.status, onOpenChange])

  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirm(false)
    setImportState({ status: 'idle' })
    onOpenChange(false)
  }, [onOpenChange])

  const handleReset = useCallback(() => {
    setImportState({ status: 'idle' })
    const defaults = getDefaultDates()
    setDateFrom(defaults.from)
    setDateTo(defaults.to)
  }, [])

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Импорт данных о хранении
            </DialogTitle>
            <DialogDescription>
              Загрузка данных о платном хранении из WB API
            </DialogDescription>
          </DialogHeader>

          {importState.status === 'idle' && (
            <>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date-from">С</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-to">По</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>

                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Максимальный период: 8 дней (ограничение WB API)
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>Автоматический импорт: каждый вторник в 08:00 МСК</span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Отмена
                </Button>
                <Button onClick={handleStartImport} disabled={!!validationError || importMutation.isPending}>
                  {importMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Начать импорт
                </Button>
              </DialogFooter>
            </>
          )}

          {importState.status === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
              <div>
                <p className="font-medium">Импорт выполняется...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusData?.status === 'pending' && 'Ожидание в очереди...'}
                  {statusData?.status === 'processing' && 'Обработка данных...'}
                  {!statusData && 'Запуск импорта...'}
                </p>
              </div>
              <Progress value={undefined} className="w-full animate-pulse" />
              <p className="text-xs text-muted-foreground">
                Ожидаемое время: ~60 секунд
              </p>
            </div>
          )}

          {importState.status === 'success' && (
            <div className="py-8 text-center space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <div>
                <p className="font-medium text-lg">Импорт завершён!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Импортировано строк: {importState.rowsImported.toLocaleString('ru-RU')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Период: {formatDateDisplay(dateFrom)} - {formatDateDisplay(dateTo)}
                </p>
              </div>
              <DialogFooter className="justify-center">
                <Button onClick={handleClose}>Закрыть</Button>
              </DialogFooter>
            </div>
          )}

          {importState.status === 'error' && (
            <div className="py-8 text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
              <div>
                <p className="font-medium text-lg">Ошибка импорта</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {importState.message}
                </p>
              </div>
              <DialogFooter className="justify-center gap-2">
                <Button variant="outline" onClick={handleClose}>Закрыть</Button>
                <Button onClick={handleReset}>Попробовать снова</Button>
              </DialogFooter>
            </div>
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
