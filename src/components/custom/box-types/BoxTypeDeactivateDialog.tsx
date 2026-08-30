'use client'

/**
 * Deactivate confirmation dialog for Box Types
 * Epic 75-FE, Story 75.2 (AC: #5, #7)
 */

import { useEffect, useRef, useState, type RefObject } from 'react'
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
import { useDeactivateBoxType } from '@/hooks/use-box-types'
import type { BoxType } from '@/types/shipment-cost'
import { useBoxTypeDialogFocus } from './useBoxTypeDialogFocus'

interface BoxTypeDeactivateDialogProps {
  boxType: BoxType | null
  onClose: () => void
  returnFocusRef?: RefObject<HTMLButtonElement | null>
  successFocusRef?: RefObject<HTMLElement | null>
}

export function BoxTypeDeactivateDialog({
  boxType,
  onClose,
  returnFocusRef,
  successFocusRef,
}: BoxTypeDeactivateDialogProps) {
  const deactivateMutation = useDeactivateBoxType()
  const [apiError, setApiError] = useState<{ boxTypeId: string; message: string } | null>(null)
  const inFlightRef = useRef(false)
  const { handleCloseAutoFocus, markSuccessFocus, resetSuccessFocus } = useBoxTypeDialogFocus(
    returnFocusRef,
    successFocusRef
  )

  useEffect(() => {
    resetSuccessFocus()
    setApiError(null)
  }, [boxType?.id])

  const visibleApiError = apiError && apiError.boxTypeId === boxType?.id ? apiError.message : null

  const handleConfirm = async () => {
    if (!boxType || inFlightRef.current) return
    inFlightRef.current = true
    resetSuccessFocus()
    setApiError(null)
    try {
      await deactivateMutation.mutateAsync(boxType.id)
      markSuccessFocus()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка деактивации'
      setApiError({
        boxTypeId: boxType.id,
        message: msg.includes('409')
          ? 'Невозможно деактивировать — есть привязки к товарам. Удалите привязки упаковки сначала.'
          : msg,
      })
    } finally {
      inFlightRef.current = false
    }
  }

  return (
    <AlertDialog
      open={!!boxType}
      onOpenChange={v => !v && !deactivateMutation.isPending && !inFlightRef.current && onClose()}
    >
      <AlertDialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Деактивировать тип коробки?</AlertDialogTitle>
          <AlertDialogDescription>
            Тип коробки &quot;{boxType?.name}&quot; будет деактивирован и не сможет использоваться
            для новых привязок. Существующие привязки сохранятся.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {visibleApiError && (
          <p role="alert" className="px-6 text-sm text-destructive">
            {visibleApiError}
          </p>
        )}

        <p role="status" aria-live="polite" className="sr-only">
          {deactivateMutation.isPending ? 'Деактивируем тип коробки' : ''}
        </p>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deactivateMutation.isPending}>Отмена</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={deactivateMutation.isPending}
            variant="destructive"
          >
            {deactivateMutation.isPending ? 'Деактивация...' : 'Деактивировать'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
