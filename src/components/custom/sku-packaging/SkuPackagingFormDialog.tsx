'use client'
/* eslint-disable max-lines -- cohesive Story-owned dialog retains validation and focus lifecycle */
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateSkuPackaging } from '@/hooks/use-sku-packaging'
import { useBoxTypes } from '@/hooks/use-box-types'
import { ApiError } from '@/types/api'
import type { SkuPackaging } from '@/types/shipment-cost'
import { BoxTypeSelect } from './BoxTypeSelect'
import { SkuPackagingProductCombobox } from './SkuPackagingProductCombobox'
import { useSkuPackagingDialogFocus } from './useSkuPackagingDialogFocus'

interface Props {
  open: boolean
  item: SkuPackaging | null
  onClose: () => void
  onSuccess?: (message: string) => void
  returnFocusRef?: RefObject<HTMLButtonElement | null>
  successFocusRef?: RefObject<HTMLElement | null>
}
interface Errors {
  nmId?: string
  boxTypeId?: string
  unitsPerBox?: string
  api?: string
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
  const [errors, setErrors] = useState<Errors>({})
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
    const next: Errors = {}
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
            ? 'Неактивный тип коробки'
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
          <div ref={productRef} className="space-y-2">
            <Label htmlFor="sp-product">Товар (nmId)</Label>
            {isEdit ? (
              <Input id="sp-product" value={String(nmId ?? '')} disabled />
            ) : (
              <SkuPackagingProductCombobox
                id="sp-product"
                value={nmId}
                onChange={setNmId}
                aria-describedby={errors.nmId ? 'sp-nmid-error' : undefined}
                aria-invalid={!!errors.nmId}
              />
            )}
            {errors.nmId && (
              <p id="sp-nmid-error" className="text-sm text-destructive">
                {errors.nmId}
              </p>
            )}
          </div>
          <div ref={boxRef} className="space-y-2">
            <Label htmlFor="sp-box-type">Тип коробки</Label>
            <BoxTypeSelect
              id="sp-box-type"
              value={boxTypeId}
              onChange={setBoxTypeId}
              aria-describedby={errors.boxTypeId ? 'sp-boxtype-error' : undefined}
              aria-invalid={!!errors.boxTypeId}
            />
            {errors.boxTypeId && (
              <p id="sp-boxtype-error" className="text-sm text-destructive">
                {errors.boxTypeId}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-units">Штук в коробке</Label>
            <Input
              ref={unitsRef}
              id="sp-units"
              type="number"
              min="1"
              step="1"
              value={unitsPerBox}
              onChange={event => setUnitsPerBox(event.target.value)}
              aria-describedby={
                errors.unitsPerBox ? 'sp-units-help sp-units-error' : 'sp-units-help'
              }
              aria-invalid={!!errors.unitsPerBox}
            />
            <p id="sp-units-help" className="text-xs text-muted-foreground">
              Введите целое количество, шт.
            </p>
            {errors.unitsPerBox && (
              <p id="sp-units-error" className="text-sm text-destructive">
                {errors.unitsPerBox}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => !inFlightRef.current && onClose()}
              disabled={mutation.isPending || boxTypesQuery.isLoading || boxTypesQuery.isError}
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
