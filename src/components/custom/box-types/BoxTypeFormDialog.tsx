'use client'

/** Create/Edit dialog for Box Types — Epic 75-FE, Story 75.2 (AC: #3, #4, #7) */

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
import { useCreateBoxType, useUpdateBoxType } from '@/hooks/use-box-types'
import { DimensionField } from './DimensionField'
import { getBoxTypeFormErrors, type BoxTypeFormErrors } from './boxTypeFormValidation'
import { useBoxTypeDialogFocus } from './useBoxTypeDialogFocus'
import { parseDecimal } from '@/lib/decimal-utils'
import type { BoxType } from '@/types/shipment-cost'

interface BoxTypeFormDialogProps {
  open: boolean
  boxType: BoxType | null
  onClose: () => void
  returnFocusRef?: RefObject<HTMLButtonElement | null>
  successFocusRef?: RefObject<HTMLElement | null>
  focusFallbackOnSuccess?: boolean
}

export function BoxTypeFormDialog({
  open,
  boxType,
  onClose,
  returnFocusRef,
  successFocusRef,
  focusFallbackOnSuccess = false,
}: BoxTypeFormDialogProps) {
  const isEdit = !!boxType
  const createMutation = useCreateBoxType()
  const updateMutation = useUpdateBoxType()
  const mutation = isEdit ? updateMutation : createMutation

  const [name, setName] = useState('')
  const [lengthCm, setLengthCm] = useState('')
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [errors, setErrors] = useState<BoxTypeFormErrors>({})
  const nameInputRef = useRef<HTMLInputElement>(null)
  const lengthInputRef = useRef<HTMLInputElement>(null)
  const widthInputRef = useRef<HTMLInputElement>(null)
  const heightInputRef = useRef<HTMLInputElement>(null)
  const inFlightRef = useRef(false)
  const { handleCloseAutoFocus, markSuccessFocus, resetSuccessFocus } = useBoxTypeDialogFocus(
    returnFocusRef,
    successFocusRef
  )

  useEffect(() => {
    if (open) {
      resetSuccessFocus()
      if (boxType) {
        setName(boxType.name)
        setLengthCm(String(parseDecimal(boxType.lengthCm)))
        setWidthCm(String(parseDecimal(boxType.widthCm)))
        setHeightCm(String(parseDecimal(boxType.heightCm)))
      } else {
        setName('')
        setLengthCm('')
        setWidthCm('')
        setHeightCm('')
      }
      setErrors({})
    }
  }, [open, boxType])

  const validate = (): boolean => {
    const next = getBoxTypeFormErrors(name, lengthCm, widthCm, heightCm)
    setErrors(next)
    if (next.name) nameInputRef.current?.focus()
    else if (next.lengthCm) lengthInputRef.current?.focus()
    else if (next.widthCm) widthInputRef.current?.focus()
    else if (next.heightCm) heightInputRef.current?.focus()
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (inFlightRef.current) return
    if (!validate()) return
    inFlightRef.current = true
    setErrors({})
    const data = {
      name: name.trim(),
      lengthCm: parseFloat(lengthCm),
      widthCm: parseFloat(widthCm),
      heightCm: parseFloat(heightCm),
    }
    try {
      if (isEdit && boxType) {
        await updateMutation.mutateAsync({ id: boxType.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
      markSuccessFocus(focusFallbackOnSuccess)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения'
      setErrors({ api: msg.includes('409') ? 'Тип коробки с таким названием уже существует' : msg })
    } finally {
      inFlightRef.current = false
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={v => !v && !mutation.isPending && !inFlightRef.current && onClose()}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать тип коробки' : 'Добавить тип коробки'}</DialogTitle>
          <DialogDescription>
            Укажите название и габариты коробки для расчёта логистики поставок.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={e => {
            e.preventDefault()
            handleSubmit()
          }}
          className="space-y-4 py-2"
        >
          {errors.api && (
            <p role="alert" className="text-sm text-destructive">
              {errors.api}
            </p>
          )}

          <p role="status" aria-live="polite" className="sr-only">
            {mutation.isPending ? 'Сохраняем тип коробки' : ''}
          </p>

          <div className="space-y-2">
            <Label htmlFor="bt-name">Название</Label>
            <Input
              ref={nameInputRef}
              id="bt-name"
              value={name}
              onChange={e => setName(e.target.value)}
              aria-describedby={errors.name ? 'bt-name-error' : undefined}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p id="bt-name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <DimensionField
              id="bt-length"
              label="Длина (см)"
              value={lengthCm}
              onChange={setLengthCm}
              error={errors.lengthCm}
              errorId="bt-length-error"
              inputRef={lengthInputRef}
            />
            <DimensionField
              id="bt-width"
              label="Ширина (см)"
              value={widthCm}
              onChange={setWidthCm}
              error={errors.widthCm}
              errorId="bt-width-error"
              inputRef={widthInputRef}
            />
            <DimensionField
              id="bt-height"
              label="Высота (см)"
              value={heightCm}
              onChange={setHeightCm}
              error={errors.heightCm}
              errorId="bt-height-error"
              inputRef={heightInputRef}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => !inFlightRef.current && onClose()}
              disabled={mutation.isPending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
