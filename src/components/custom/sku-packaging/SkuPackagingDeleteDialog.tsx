'use client'
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
import { useDeleteSkuPackaging } from '@/hooks/use-sku-packaging'
import { ApiError } from '@/types/api'
import type { SkuPackaging } from '@/types/shipment-cost'
import { useSkuPackagingDialogFocus } from './useSkuPackagingDialogFocus'
interface Props {
  item: SkuPackaging | null
  onClose: () => void
  onSuccess?: (message: string) => void
  returnFocusRef?: RefObject<HTMLButtonElement | null>
  successFocusRef?: RefObject<HTMLElement | null>
}
export function SkuPackagingDeleteDialog({
  item,
  onClose,
  onSuccess,
  returnFocusRef,
  successFocusRef,
}: Props) {
  const mutation = useDeleteSkuPackaging()
  const [apiError, setApiError] = useState<string | null>(null)
  const inFlightRef = useRef(false)
  const focus = useSkuPackagingDialogFocus(returnFocusRef, successFocusRef)
  useEffect(() => {
    focus.resetSuccessFocus()
    setApiError(null)
  }, [item?.nmId])
  const confirm = async () => {
    if (!item || inFlightRef.current) return
    inFlightRef.current = true
    setApiError(null)
    try {
      await mutation.mutateAsync(item.nmId)
      onSuccess?.(`Привязка упаковки SKU ${item.nmId} удалена.`)
      focus.markSuccessFocus()
      onClose()
    } catch (error) {
      setApiError(
        error instanceof ApiError && error.status === 409
          ? 'Привязка используется в поставке и не может быть удалена.'
          : 'Не удалось удалить привязку. Повторите попытку.'
      )
    } finally {
      inFlightRef.current = false
    }
  }
  return (
    <AlertDialog
      open={!!item}
      onOpenChange={value => !value && !mutation.isPending && !inFlightRef.current && onClose()}
    >
      <AlertDialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={focus.handleCloseAutoFocus}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить привязку упаковки?</AlertDialogTitle>
          <AlertDialogDescription>
            Привязка товара {item?.nmId} к типу коробки &quot;
            {item?.boxType?.name || item?.boxTypeId || 'не указан'}&quot; будет удалена.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {apiError && (
          <p role="alert" className="px-6 text-sm text-destructive">
            {apiError}
          </p>
        )}
        <p role="status" aria-live="polite" className="sr-only">
          {mutation.isPending ? `Удаляем привязку SKU ${item?.nmId}` : ''}
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Отмена</AlertDialogCancel>
          <Button onClick={confirm} disabled={mutation.isPending} variant="destructive">
            {mutation.isPending ? 'Удаление...' : 'Удалить'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
