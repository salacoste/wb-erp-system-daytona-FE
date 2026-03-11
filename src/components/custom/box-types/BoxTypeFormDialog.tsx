'use client'

/** Create/Edit dialog for Box Types — Epic 75-FE, Story 75.2 (AC: #3, #4, #7) */

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateBoxType, useUpdateBoxType } from '@/hooks/use-box-types'
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
            <div className="space-y-2">
              <Label htmlFor="bt-length">Длина (см)</Label>
              <Input
                id="bt-length"
                type="number"
                min="0"
                step="any"
                value={lengthCm}
                onChange={e => setLengthCm(e.target.value)}
                aria-describedby={errors.lengthCm ? 'bt-length-error' : undefined}
                aria-invalid={!!errors.lengthCm}
              />
              {errors.lengthCm && (
                <p id="bt-length-error" className="text-sm text-destructive">
                  {errors.lengthCm}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bt-width">Ширина (см)</Label>
              <Input
                id="bt-width"
                type="number"
                min="0"
                step="any"
                value={widthCm}
                onChange={e => setWidthCm(e.target.value)}
                aria-describedby={errors.widthCm ? 'bt-width-error' : undefined}
                aria-invalid={!!errors.widthCm}
              />
              {errors.widthCm && (
                <p id="bt-width-error" className="text-sm text-destructive">
                  {errors.widthCm}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bt-height">Высота (см)</Label>
              <Input
                id="bt-height"
                type="number"
                min="0"
                step="any"
                value={heightCm}
                onChange={e => setHeightCm(e.target.value)}
                aria-describedby={errors.heightCm ? 'bt-height-error' : undefined}
                aria-invalid={!!errors.heightCm}
              />
              {errors.heightCm && (
                <p id="bt-height-error" className="text-sm text-destructive">
                  {errors.heightCm}
                </p>
              )}
            </div>
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
