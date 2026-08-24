'use client'

/**
 * Paid Storage Import Status Views
 * Extracted from PaidStorageImportDialog for max-lines compliance
 */

import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { formatDateDisplay } from './storage-import-utils'

interface IdleFormProps {
  dateFrom: string
  dateTo: string
  setDateFrom: (v: string) => void
  setDateTo: (v: string) => void
  validationError: string | null
  isPending: boolean
  onStart: () => void
  onCancel: () => void
}

export function ImportIdleForm({
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  validationError,
  isPending,
  onStart,
  onCancel,
}: IdleFormProps) {
  return (
    <>
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date-from">С</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-to">По</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
        </div>
        {validationError && <p className="text-sm text-destructive">{validationError}</p>}
        <p className="text-xs text-muted-foreground">
          Максимальный период: 8 дней (ограничение WB API)
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button onClick={onStart} disabled={!!validationError || isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Начать импорт
        </Button>
      </div>
    </>
  )
}

export function ImportProcessing({ statusUnknown = false }: { statusUnknown?: boolean }) {
  return (
    <div className="py-8 text-center space-y-4">
      <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
      <p className="font-medium">Импорт выполняется...</p>
      <Progress value={undefined} className="w-full animate-pulse" />
      <p className="text-xs text-muted-foreground">Ожидаемое время: ~60 секунд</p>
      {/* Story 169.12 (Task 0 follow-up): unrecognized backend poll status —
          neutral muted hint, NOT an error-red state (Defensive Frontend:
          indicate, never coerce; poll keeps running). */}
      {statusUnknown && <p className="text-xs text-muted-foreground">Статус импорта неизвестен</p>}
    </div>
  )
}

interface ImportSuccessProps {
  rowsImported: number
  dateFrom: string
  dateTo: string
  onClose: () => void
}

export function ImportSuccess({ rowsImported, dateFrom, dateTo, onClose }: ImportSuccessProps) {
  return (
    <div
      className="py-8 text-center space-y-4"
      role="status"
      tabIndex={0}
      aria-label="Результат импорта: завершён"
    >
      {/* Story 169.12: focusable result summary + bounded live announcement (AX);
          green-500 → status-success foreground pair. */}
      <CheckCircle className="h-12 w-12 mx-auto text-status-success" />
      <p className="font-medium text-lg">Импорт завершён!</p>
      <p className="text-sm text-muted-foreground">
        Импортировано строк: {rowsImported.toLocaleString('ru-RU')}
      </p>
      <p className="text-sm text-muted-foreground">
        Период: {formatDateDisplay(dateFrom)} - {formatDateDisplay(dateTo)}
      </p>
      <Button onClick={onClose}>Закрыть</Button>
    </div>
  )
}

interface ImportErrorProps {
  message: string
  onClose: () => void
  onRetry: () => void
}

export function ImportError({ message, onClose, onRetry }: ImportErrorProps) {
  return (
    <div
      className="py-8 text-center space-y-4"
      role="alert"
      tabIndex={0}
      aria-label="Результат импорта: ошибка"
    >
      {/* Story 169.12: focusable result summary + bounded live announcement (AX);
          red-500 → status-error foreground pair. */}
      <AlertCircle className="h-12 w-12 mx-auto text-status-error" />
      <p className="font-medium text-lg">Ошибка импорта</p>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="flex justify-center gap-2">
        <Button variant="outline" onClick={onClose}>
          Закрыть
        </Button>
        <Button onClick={onRetry}>Попробовать снова</Button>
      </div>
    </div>
  )
}
