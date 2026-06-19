'use client'

/** Create/Edit dialog for Box Types — Epic 75-FE, Story 75.2 (AC: #3, #4, #7) */

import { useEffect, useState } from 'react'
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
import { parseDecimal } from '@/lib/decimal-utils'
import type { BoxType } from '@/types/shipment-cost'

interface BoxTypeFormDialogProps {
  open: boolean
  boxType: BoxType | null
  onClose: () => void
}

interface FormErrors {
  name?: string
  lengthCm?: string
  widthCm?: string
  heightCm?: string
  api?: string
}

export function BoxTypeFormDialog({ open, boxType, onClose }: BoxTypeFormDialogProps) {
  const isEdit = !!boxType
  const createMutation = useCreateBoxType()
  const updateMutation = useUpdateBoxType()
  const mutation = isEdit ? updateMutation : createMutation

  const [name, setName] = useState('')
  const [lengthCm, setLengthCm] = useState('')
  const [widthCm, setWidthCm] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
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
    const next: FormErrors = {}
    if (!name.trim()) next.name = 'Название обязательно'
    const l = parseFloat(lengthCm)
    const w = parseFloat(widthCm)
    const h = parseFloat(heightCm)
    if (!lengthCm || isNaN(l) || l <= 0) next.lengthCm = 'Длина должна быть больше 0'
    if (!widthCm || isNaN(w) || w <= 0) next.widthCm = 'Ширина должна быть больше 0'
    if (!heightCm || isNaN(h) || h <= 0) next.heightCm = 'Высота должна быть больше 0'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
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
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения'
      setErrors({ api: msg.includes('409') ? 'Тип коробки с таким названием уже существует' : msg })
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && !mutation.isPending && onClose()}>
      <DialogContent>
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
          {errors.api && <p className="text-sm text-destructive">{errors.api}</p>}

          <div className="space-y-2">
            <Label htmlFor="bt-name">Название</Label>
            <Input
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

          <div className="grid grid-cols-3 gap-4">
            <DimensionField
              id="bt-length"
              label="Длина (см)"
              value={lengthCm}
              onChange={setLengthCm}
              error={errors.lengthCm}
              errorId="bt-length-error"
            />
            <DimensionField
              id="bt-width"
              label="Ширина (см)"
              value={widthCm}
              onChange={setWidthCm}
              error={errors.widthCm}
              errorId="bt-width-error"
            />
            <DimensionField
              id="bt-height"
              label="Высота (см)"
              value={heightCm}
              onChange={setHeightCm}
              error={errors.heightCm}
              errorId="bt-height-error"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={mutation.isPending}>
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
