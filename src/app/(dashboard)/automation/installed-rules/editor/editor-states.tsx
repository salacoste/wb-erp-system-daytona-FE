'use client'

/**
 * Editor independent error/loading UI (Story 163.3-FE, AC #1).
 * Extracted from InstalledRuleEditor.tsx for the 200-effective-line cap.
 * Status feedback is announced via aria-live in the container, not here.
 */
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/types/api'

/** Resolve a mutation error to a RU message (status-based). */
export function mutationErrorMessage(error: Error | null): string {
  if (!error) return 'Не удалось обновить правило.'
  const status = error instanceof ApiError ? error.status : 0
  if (status === 400) return 'Некорректные данные. Проверьте значения полей.'
  if (status === 403) return 'Недостаточно прав для изменения правила.'
  if (status === 404) return 'Правило не найдено.'
  if (status === 409) return 'Конфликт: правило было изменено другим сеансом.'
  if (status >= 500) return 'Ошибка сервера. Попробуйте ещё раз.'
  return error.message || 'Не удалось обновить правило.'
}

/** AC #1 load-error states driven from ApiError.status (404/401/403/5xx). */
export function EditorErrorState({
  error,
  refetch,
  onBack,
}: {
  error: Error | null
  refetch: () => void
  onBack: () => void
}) {
  const status = error instanceof ApiError ? error.status : 0
  let title = 'Не удалось загрузить правило.'
  let body = error instanceof Error ? error.message : ''
  let retry = true
  if (status === 404) {
    title = 'Правило не найдено.'
    body = 'Возможно, оно было удалено.'
    retry = false
  } else if (status === 401) {
    title = 'Требуется авторизация.'
    body = 'Войдите снова и откройте правило.'
    retry = false
  } else if (status === 403) {
    title = 'Недостаточно прав для просмотра правила.'
    retry = false
  }
  return (
    <div className="space-y-4" data-testid="editor-error-state">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium">{title}</p>
          {body ? <p className="text-sm">{body}</p> : null}
        </AlertDescription>
      </Alert>
      <div className="flex gap-2">
        {retry && (
          <Button variant="outline" onClick={() => refetch()} data-testid="editor-retry">
            Повторить
          </Button>
        )}
        <Button variant="outline" onClick={onBack}>
          Назад к списку
        </Button>
      </div>
    </div>
  )
}
