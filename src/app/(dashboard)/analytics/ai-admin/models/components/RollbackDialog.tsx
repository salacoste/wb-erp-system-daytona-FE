'use client'

/**
 * RollbackDialog — destructive confirmation for AI model rollback.
 * Story 112.1-FE Task 4.
 * Pattern: CogsDeleteDialog (AlertDialog) + useModelRollback mutation.
 * Error branching: 403 ApiError → distinct message; other → generic.
 */

import { useState, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useModelRollback } from '@/hooks/useModelRollback'
import { ApiError } from '@/types/api'
import type { AiModel } from '@/types/ai/models'

interface RollbackDialogProps {
  model: AiModel
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/** Minimum reason length — frontend gate; backend may enforce its own. */
const MIN_REASON_LENGTH = 10

export function RollbackDialog({ model, open, onOpenChange, onSuccess }: RollbackDialogProps) {
  const [reason, setReason] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const mutation = useModelRollback()

  const mutationReset = mutation.reset

  // Reset state on dialog open/close
  useEffect(() => {
    if (!open) {
      setReason('')
      setErrorMessage(null)
      mutationReset()
    }
  }, [open, mutationReset])

  const reasonTrimmed = reason.trim()
  const isReasonValid = reasonTrimmed.length >= MIN_REASON_LENGTH

  function handleConfirm() {
    if (!isReasonValid) return
    setErrorMessage(null)
    mutation.mutate(
      { modelId: model.id, reason: reasonTrimmed },
      {
        onSuccess: () => {
          toast.success('Модель откачена. Причина залогирована.')
          onOpenChange(false)
          onSuccess?.()
        },
        onError: (err: unknown) => {
          if (err instanceof ApiError && err.status === 403) {
            setErrorMessage('Нет доступа. Проверьте, что вы являетесь владельцем кабинета.')
          } else if (err instanceof ApiError && err.status === 409) {
            // 171.2 gap-6: conflict — model already rolled back server-side; dialog stays
            // open with the entered reason retained so the admin can recover deliberately.
            setErrorMessage('Модель уже откатана. Обновите список.')
          } else {
            setErrorMessage('Не удалось выполнить откат. Попробуйте позже.')
          }
        },
      }
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Откатить модель v{model.version}?</AlertDialogTitle>
          {/* F-7: AlertDialogDescription must contain only static inline text (ARIA contract).
              Form elements (Textarea) and live regions (Alert) are siblings, not children. */}
          <AlertDialogDescription>
            Модель v{model.version} будет откачена к предыдущей стабильной версии. Это действие
            отразится на всех активных прогнозах. Укажите причину:
            {/* 171.2 gap-7 (AC-2 «server truth»): honest non-promise about post-rollback state */}
            Актуальный статус определяется на сервере после отката.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Form elements outside description — valid DOM + ARIA contract preserved */}
        <div className="space-y-3">
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Например: MAPE деградировал с 12% до 45%"
            rows={3}
            aria-label="Причина отката"
            aria-required="true"
          />
          {!isReasonValid && reason.length > 0 && (
            <p className="text-xs text-destructive">
              Минимальная длина причины — {MIN_REASON_LENGTH} символов.
            </p>
          )}
          {errorMessage && (
            // F-12: shadcn Alert has role="alert" baked in (implies aria-live="assertive").
            // Override to role="status" (implies aria-live="polite") — less intrusive for
            // errors already displayed inside an open dialog. aria-atomic ensures full
            // message is read. The ...props spread in Alert allows this override.
            <Alert variant="destructive" role="status" aria-atomic="true">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Отменить</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isReasonValid || mutation.isPending}
            aria-label={`Подтвердить откат модели v${model.version}`}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Подтвердить откат
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
