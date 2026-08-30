'use client'

import { Loader2, RotateCcw, Save } from 'lucide-react'
import type { RefObject } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface TaxSettingsLoadStateProps {
  isError: boolean
  isLoading: boolean
  onRetry: () => void
}

export function TaxSettingsLoadState({ isError, isLoading, onRetry }: TaxSettingsLoadStateProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Не удалось загрузить налоговые настройки</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>Сервер не вернул сохранённую конфигурацию. Черновик не показывается как актуальный.</p>
          <Button variant="outline" onClick={onRetry}>
            Повторить загрузку
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!isLoading) return null

  return (
    <div
      role="status"
      aria-label="Загрузка налоговых настроек"
      aria-busy="true"
      className="space-y-4"
    >
      <span className="sr-only">Загружаем налоговые настройки</span>
      <Skeleton className="h-64 w-full" data-testid="skeleton" />
      <Skeleton className="h-56 w-full" data-testid="skeleton" />
    </div>
  )
}

interface TaxSettingsActionsProps {
  canManage: boolean
  isPending: boolean
  isDirty: boolean
  saveResult: 'idle' | 'success' | 'error'
  warningOpen: boolean
  saveButtonRef: RefObject<HTMLButtonElement | null>
  onReset: () => void
}

export function TaxSettingsActions({
  canManage,
  isPending,
  isDirty,
  saveResult,
  warningOpen,
  saveButtonRef,
  onReset,
}: TaxSettingsActionsProps) {
  if (!canManage) {
    return (
      <Alert>
        <AlertTitle>Режим просмотра</AlertTitle>
        <AlertDescription>
          Налоговые настройки доступны только для просмотра вашей роли.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3 border-t pt-4">
      {isPending && (
        <p role="status" aria-label="Состояние сохранения" aria-live="polite" className="text-sm">
          Сохраняем налоговые настройки. Поля временно недоступны.
        </p>
      )}
      {saveResult === 'success' && (
        <p
          role="status"
          aria-label="Результат сохранения"
          aria-live="polite"
          className="text-sm text-status-success"
        >
          Налоговые настройки сохранены. Новые расчёты будут использовать эту конфигурацию.
        </p>
      )}
      {saveResult === 'error' && !warningOpen && (
        <p role="alert" className="text-sm text-destructive">
          Не удалось сохранить налоговые настройки. Черновик сохранён — повторите попытку.
        </p>
      )}
      <div className="grid gap-3 sm:flex sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={isPending || !isDirty}
          className="min-h-11"
        >
          <RotateCcw aria-hidden="true" className="mr-2 size-4" />
          Отменить
        </Button>
        <Button
          ref={saveButtonRef}
          type="submit"
          disabled={isPending || (!isDirty && saveResult !== 'error')}
          className="min-h-11"
        >
          {isPending ? (
            <Loader2
              aria-hidden="true"
              className="mr-2 size-4 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <Save aria-hidden="true" className="mr-2 size-4" />
          )}
          {isPending
            ? 'Сохранение…'
            : saveResult === 'error'
              ? 'Повторить сохранение'
              : 'Сохранить'}
        </Button>
      </div>
    </div>
  )
}
