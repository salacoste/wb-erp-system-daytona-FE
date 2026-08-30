'use client'

import { Loader2, TriangleAlert } from 'lucide-react'
import type { MouseEvent } from 'react'
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

interface TaxSettingsWarningDialogProps {
  open: boolean
  isPending: boolean
  hasError: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  onReturnFocus: () => void
}

export function TaxSettingsWarningDialog({
  open,
  isPending,
  hasError,
  onConfirm,
  onOpenChange,
  onReturnFocus,
}: TaxSettingsWarningDialogProps) {
  const handleConfirm = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={next => !isPending && onOpenChange(next)}>
      <AlertDialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto"
        aria-busy={isPending || undefined}
        onEscapeKeyDown={event => isPending && event.preventDefault()}
        onCloseAutoFocus={event => {
          event.preventDefault()
          onReturnFocus()
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Сохранить без налоговой системы?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-2 text-foreground">
                <TriangleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-status-warning"
                />
                <span>
                  Прибыль продолжит отображаться до вычета налогов. Финансовые отчёты не смогут
                  показать итог после налога, пока система не настроена.
                </span>
              </p>
              {hasError && (
                <p role="alert" className="text-destructive">
                  Не удалось сохранить настройку. Черновик сохранён — повторите попытку.
                </p>
              )}
              {isPending && (
                <p
                  role="status"
                  aria-label="Состояние сохранения без налоговой системы"
                  aria-live="polite"
                  className="text-foreground"
                >
                  Сохраняем налоговые настройки. Не закрывайте окно.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Вернуться к настройкам</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin motion-reduce:animate-none"
                />
                Сохранение…
              </>
            ) : hasError ? (
              'Повторить сохранение'
            ) : (
              'Сохранить без системы'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
