'use client'

/**
 * AiPreferencesForm — Owner-gated master aiEnabled toggle.
 * Story 112.2-FE Task 3.
 * State-precedence chain: hydration skeleton → role-denied Alert → loading → error → happy form.
 * ARIA: Switch label-htmlFor + aria-describedby chain; inline error uses aria-live="polite"
 * (NOT role="alert" per Story 112.1 F-12 — override via role="status" props-spread).
 */

import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useAiPreferences } from '@/hooks/useAiPreferences'
import { useUpdateAiPreferences } from '@/hooks/useUpdateAiPreferences'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/routes'
import { ApiError } from '@/types/api'

const SWITCH_ID = 'ai-enabled-toggle'
const SWITCH_DESC_ID = 'ai-enabled-desc'
// Story 171.3 (AC-3 «errors are associated»): the mutation-error Alert id joins
// the Switch describedby chain when present — SR users reach the error FROM the control.
const MUTATION_ERROR_ID = 'ai-enabled-mutation-error'

export function AiPreferencesForm() {
  const user = useAuthStore(s => s.user)
  const { data, isLoading, isError } = useAiPreferences()
  const mutation = useUpdateAiPreferences()

  // F-11: differentiate "auth not yet hydrated" (user===null) from "explicitly denied".
  // Showing the denied Alert during initial hydration causes page-reload flicker for Owners.
  if (user === null) {
    return (
      <div className="space-y-2" aria-label="Загрузка">
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // Owner-only gate — mirrors AdminModelsList.tsx:64 pattern.
  if (user.role !== 'Owner') {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Доступ запрещён. Эта страница доступна только владельцу кабинета.{' '}
          <Link href={ROUTES.ANALYTICS.MODELS} className="underline">
            Вернуться к списку моделей
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  // Inside Owner branch — state-precedence chain: loading → error → happy form.
  if (isLoading) {
    return (
      <div className="space-y-2" aria-label="Загрузка настроек">
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      // F-12: shadcn Alert ships role="alert" (assertive). Override to role="status" (polite).
      <Alert variant="destructive" role="status" aria-live="polite" aria-atomic="true">
        <AlertDescription>
          Не удалось загрузить настройки. Попробуйте обновить страницу.
        </AlertDescription>
      </Alert>
    )
  }

  // Pre-check error messages thrown by mutationFn before patchAiPreferences is called.
  // These errors reflect component-state issues (auth/cabinet not ready) — stay silent.
  const PRE_CHECK_MESSAGES = ['Auth not yet loaded', 'Cabinet not selected'] as const

  function isPreCheckError(error: Error): boolean {
    return PRE_CHECK_MESSAGES.some(msg => error.message === msg)
  }

  function handleCheckedChange(checked: boolean) {
    mutation.mutate(
      { aiEnabled: checked },
      {
        onSuccess: () => {
          toast.success('Настройки сохранены.')
        },
        onError: error => {
          // Pre-check errors from mutationFn (auth hydration race, null cabinetId): stay silent.
          if (isPreCheckError(error)) {
            return
          }
          // 403: distinct message — user may not be aware their role changed.
          if (error instanceof ApiError && error.status === 403) {
            toast.error('Нет доступа. Проверьте, что вы являетесь владельцем кабинета.')
            return
          }
          // Everything else (network errors, JSON parse, generic ApiError): generic toast.
          toast.error('Не удалось сохранить настройки. Попробуйте позже.')
        },
      }
    )
  }

  // Determine error message from mutation state (inline Alert for screen-reader persistence)
  let mutationErrorMessage: string | null = null
  if (mutation.error) {
    // Pre-check errors (hydration race, null cabinetId): stay silent — no inline message.
    if (!isPreCheckError(mutation.error)) {
      if (mutation.error instanceof ApiError && mutation.error.status === 403) {
        mutationErrorMessage = 'Нет доступа. Проверьте, что вы являетесь владельцем кабинета.'
      } else {
        // Network errors, JSON parse, generic ApiError: show generic retry message.
        mutationErrorMessage = 'Не удалось сохранить настройки. Попробуйте позже.'
      }
    }
  }

  return (
    <div className="max-w-2xl space-y-6"> {/* Story 171.3 RTC-form: constrained readable width */}
      {/* Header card */}
      <div className="rounded-lg border bg-card p-6">
        <h1 className="text-lg font-semibold">Настройки AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Управление AI функциями для текущего кабинета.
        </p>
      </div>

      {/* Toggle card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor={SWITCH_ID} className="text-base font-medium">
              Включить AI прогнозы
            </Label>
            <p id={SWITCH_DESC_ID} className="text-sm text-muted-foreground">
              Когда отключено, все AI-эндпоинты возвращают пустые ответы. Используется для отладки,
              технических работ или временной деактивации функций.
            </p>
          </div>
          <Switch
            id={SWITCH_ID}
            checked={data?.aiEnabled ?? false}
            onCheckedChange={handleCheckedChange}
            disabled={mutation.isPending}
            aria-describedby={mutationErrorMessage ? `${SWITCH_DESC_ID} ${MUTATION_ERROR_ID}` : SWITCH_DESC_ID}
            className="focus-visible:ring-2 focus-visible:ring-offset-2"
          />
        </div>

        {/* Inline mutation error — aria-live="polite" per Story 112.1 F-12 */}
        {mutationErrorMessage && (
          <Alert
            id={MUTATION_ERROR_ID}
            variant="destructive"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="mt-4"
          >
            <AlertDescription>{mutationErrorMessage}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
