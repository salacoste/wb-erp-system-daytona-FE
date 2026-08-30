'use client'
import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCreateSkuPackaging } from '@/hooks/use-sku-packaging'
import { useBoxTypes } from '@/hooks/use-box-types'
import { ApiError } from '@/types/api'
import type { SkuPackaging } from '@/types/shipment-cost'
import { SkuPackagingFormFields, type SkuPackagingFormErrors } from './SkuPackagingFormFields'
import { useSkuPackagingDialogFocus } from './useSkuPackagingDialogFocus'

interface Props {
  open: boolean
  item: SkuPackaging | null
  onClose: () => void
  onSuccess?: (message: string) => void
  returnFocusRef?: RefObject<HTMLButtonElement | null>
  successFocusRef?: RefObject<HTMLElement | null>
}
export function SkuPackagingFormDialog({
  open,
  item,
  onClose,
  onSuccess,
  returnFocusRef,
  successFocusRef,
}: Props) {
  const mutation = useCreateSkuPackaging()
  const boxTypesQuery = useBoxTypes()
  const isEdit = !!item
  const [nmId, setNmId] = useState<number | null>(null)
  const [boxTypeId, setBoxTypeId] = useState('')
  const [unitsPerBox, setUnitsPerBox] = useState('')
  const [errors, setErrors] = useState<SkuPackagingFormErrors>({})
  const productRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const unitsRef = useRef<HTMLInputElement>(null)
  const inFlightRef = useRef(false)
  const focus = useSkuPackagingDialogFocus(returnFocusRef, successFocusRef)
  useEffect(() => {
    if (open) {
      focus.resetSuccessFocus()
      setNmId(item?.nmId ?? null)
      setBoxTypeId(item?.boxTypeId ?? '')
      setUnitsPerBox(item ? String(item.unitsPerBox) : '')
      setErrors({})
    }
  }, [open, item])
  const validate = () => {
    const next: SkuPackagingFormErrors = {}
    if (!nmId) next.nmId = 'Выберите товар'
    if (!boxTypeId) next.boxTypeId = 'Выберите тип коробки'
    if (!/^\d+$/.test(unitsPerBox) || Number(unitsPerBox) <= 0)
      next.unitsPerBox = 'Штук в коробке должно быть больше 0'
    setErrors(next)
    if (next.nmId) productRef.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus()
    else if (next.boxTypeId)
      boxRef.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus()
    else if (next.unitsPerBox) unitsRef.current?.focus()
    return Object.keys(next).length === 0
  }
  const submit = async () => {
    if (inFlightRef.current || !validate() || !nmId) return
    inFlightRef.current = true
    setErrors({})
    try {
      await mutation.mutateAsync({ nmId, boxTypeId, unitsPerBox: Number(unitsPerBox) })
      onSuccess?.(isEdit ? `Упаковка SKU ${nmId} сохранена.` : `Упаковка SKU ${nmId} создана.`)
      focus.markSuccessFocus()
      onClose()
    } catch (error) {
      setErrors({
        api:
          error instanceof ApiError && error.status === 409
            ? 'Привязка уже существует или выбранный тип коробки неактивен.'
            : 'Не удалось сохранить привязку. Повторите попытку.',
      })
    } finally {
      inFlightRef.current = false
    }
  }
  const fieldErrors = [errors.nmId, errors.boxTypeId, errors.unitsPerBox].filter(Boolean)
  return (
    <Dialog
      open={open}
      onOpenChange={value => !value && !mutation.isPending && !inFlightRef.current && onClose()}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={focus.handleCloseAutoFocus}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать упаковку' : 'Добавить упаковку'}</DialogTitle>
          <DialogDescription>
            Свяжите товар с типом коробки и количеством единиц в одной коробке.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={event => {
            event.preventDefault()
            submit()
          }}
          className="space-y-4 py-2"
        >
          {fieldErrors.length > 0 && (
            <div
              role="alert"
              tabIndex={-1}
              className="rounded-md border border-destructive/40 p-3 text-sm"
            >
              <p className="font-medium">Проверьте поля формы:</p>
              <ul className="list-disc pl-5">
                {fieldErrors.map(error => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {errors.api && (
            <p role="alert" className="text-sm text-destructive">
              {errors.api}
            </p>
          )}
          <p role="status" aria-live="polite" className="sr-only">
            {mutation.isPending ? `Сохраняем упаковку${nmId ? ` SKU ${nmId}` : ''}` : ''}
          </p>
          <SkuPackagingFormFields
            isEdit={isEdit}
            nmId={nmId}
            boxTypeId={boxTypeId}
            unitsPerBox={unitsPerBox}
            errors={errors}
            productRef={productRef}
            boxRef={boxRef}
            unitsRef={unitsRef}
            onNmIdChange={setNmId}
            onBoxTypeIdChange={setBoxTypeId}
            onUnitsPerBoxChange={setUnitsPerBox}
          />
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => !inFlightRef.current && onClose()}
              disabled={mutation.isPending}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || boxTypesQuery.isLoading || boxTypesQuery.isError}
            >
              {mutation.isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
