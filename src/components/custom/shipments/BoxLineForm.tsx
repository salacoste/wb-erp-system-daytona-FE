'use client'

/**
 * Add/edit box line dialog with product search and pre-flight warnings
 * Epic 76-FE, Story 76.3 (AC: #1, #3, #5, #6)
 */

import { useEffect, useRef, useState, type RefObject } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAddBoxLine, useUpdateBoxLine } from '@/hooks/use-box-lines'
import type { BoxLine } from '@/types/shipment-cost'
import {
  validateBoxLineForm,
  buildBoxLinePayload,
  type BoxLineFormErrors,
} from './box-line-form-helpers'
import { BoxLineFormFields } from './BoxLineFormFields'

interface BoxLineFormProps {
  open: boolean
  onClose: () => void
  shipmentId: string
  palletId: string
  editingLine: BoxLine | null
  returnFocusRef?: RefObject<HTMLButtonElement | null>
  onSuccess?: (action: 'add' | 'update') => void
}

export function BoxLineForm({
  open,
  onClose,
  shipmentId,
  palletId,
  editingLine,
  returnFocusRef,
  onSuccess,
}: BoxLineFormProps) {
  const [nmId, setNmId] = useState<number | null>(null)
  const [boxCount, setBoxCount] = useState('')
  const [totalUnits, setTotalUnits] = useState('')
  const [errors, setErrors] = useState<BoxLineFormErrors>({})
  const productFieldRef = useRef<HTMLDivElement>(null)
  const boxCountRef = useRef<HTMLInputElement>(null)
  const totalUnitsRef = useRef<HTMLInputElement>(null)

  const { mutateAsync: addAsync, isPending: isAdding } = useAddBoxLine(shipmentId, palletId)
  const { mutateAsync: updateAsync, isPending: isUpdating } = useUpdateBoxLine(shipmentId)
  const isPending = isAdding || isUpdating
  const isEdit = editingLine !== null

  useEffect(() => {
    if (open) {
      if (editingLine) {
        setNmId(editingLine.nmId)
        setBoxCount(String(editingLine.boxCount))
        setTotalUnits(editingLine.totalUnits != null ? String(editingLine.totalUnits) : '')
      } else {
        setNmId(null)
        setBoxCount('')
        setTotalUnits('')
      }
      setErrors({})
    }
  }, [open, editingLine])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateBoxLineForm({ nmId, boxCount, totalUnits }, isEdit)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      if (errs.nmId) {
        productFieldRef.current?.querySelector<HTMLButtonElement>('[role="combobox"]')?.focus()
      } else if (errs.boxCount) boxCountRef.current?.focus()
      else if (errs.totalUnits) totalUnitsRef.current?.focus()
      return
    }

    const payload = buildBoxLinePayload({ nmId, boxCount, totalUnits })
    try {
      if (isEdit && editingLine) {
        await updateAsync({
          boxLineId: editingLine.id,
          data: {
            boxCount: payload.boxCount,
            ...(payload.totalUnits != null ? { totalUnits: payload.totalUnits } : {}),
          },
        })
        onSuccess?.('update')
      } else {
        await addAsync(payload)
        onSuccess?.('add')
      }
      onClose()
    } catch {
      setErrors({ form: 'Ошибка сохранения. Попробуйте ещё раз.' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && !isPending && onClose()}>
      <DialogContent
        onCloseAutoFocus={event => {
          if (!returnFocusRef?.current) return
          event.preventDefault()
          returnFocusRef.current.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать товар' : 'Добавить товар'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Измените количество коробок или штук'
              : 'Выберите товар и укажите количество'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <BoxLineFormFields
            isEdit={isEdit}
            nmId={nmId}
            boxCount={boxCount}
            totalUnits={totalUnits}
            editingLineNmId={editingLine?.nmId ?? null}
            errors={errors}
            onNmIdChange={setNmId}
            onBoxCountChange={setBoxCount}
            onTotalUnitsChange={setTotalUnits}
            productFieldRef={productFieldRef}
            boxCountRef={boxCountRef}
            totalUnitsRef={totalUnitsRef}
          />

          {isPending && (
            <p className="sr-only" role="status" aria-live="polite">
              {isEdit ? 'Сохраняем изменения товарной строки' : 'Добавляем товарную строку'}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
