'use client'

/**
 * Add/edit box line dialog with product search and pre-flight warnings
 * Epic 76-FE, Story 76.3 (AC: #1, #3, #5, #6)
 */

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAddBoxLine, useUpdateBoxLine } from '@/hooks/use-box-lines'
import { ProductCombobox } from '@/components/custom/sku-packaging/ProductCombobox'
import { PreflightWarnings } from './PreflightWarnings'
import type { BoxLine } from '@/types/shipment-cost'

interface BoxLineFormProps {
  open: boolean
  onClose: () => void
  shipmentId: string
  palletId: string
  editingLine: BoxLine | null
}

export function BoxLineForm({
  open,
  onClose,
  shipmentId,
  palletId,
  editingLine,
}: BoxLineFormProps) {
  const [nmId, setNmId] = useState<number | null>(null)
  const [boxCount, setBoxCount] = useState('')
  const [totalUnits, setTotalUnits] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!isEdit && !nmId) errs.nmId = 'Выберите товар'
    const count = Number(boxCount)
    if (!boxCount || isNaN(count) || count <= 0 || !Number.isInteger(count)) {
      errs.boxCount = 'Укажите целое число > 0'
    }
    if (totalUnits) {
      const units = Number(totalUnits)
      if (isNaN(units) || units <= 0 || !Number.isInteger(units)) {
        errs.totalUnits = 'Укажите целое число > 0'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    try {
      if (isEdit && editingLine) {
        await updateAsync({
          boxLineId: editingLine.id,
          data: {
            boxCount: Number(boxCount),
            ...(totalUnits ? { totalUnits: Number(totalUnits) } : {}),
          },
        })
      } else {
        await addAsync({
          nmId: nmId!,
          boxCount: Number(boxCount),
          ...(totalUnits ? { totalUnits: Number(totalUnits) } : {}),
        })
      }
      onClose()
    } catch {
      setErrors({ form: 'Ошибка сохранения. Попробуйте ещё раз.' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && !isPending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать товар' : 'Добавить товар'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Измените количество коробок или штук'
              : 'Выберите товар и укажите количество'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="boxline-nmid">Товар</Label>
            {isEdit ? (
              <Input id="boxline-nmid" value={editingLine?.nmId ?? ''} disabled />
            ) : (
              <ProductCombobox
                value={nmId}
                onChange={setNmId}
                aria-describedby={errors.nmId ? 'nmid-error' : undefined}
                aria-invalid={!!errors.nmId}
              />
            )}
            {errors.nmId && (
              <p id="nmid-error" className="text-sm text-destructive">
                {errors.nmId}
              </p>
            )}
          </div>

          {!isEdit && <PreflightWarnings nmId={nmId} />}

          <div className="space-y-2">
            <Label htmlFor="boxline-count">Количество коробок</Label>
            <Input
              id="boxline-count"
              type="number"
              min={1}
              step={1}
              value={boxCount}
              onChange={e => setBoxCount(e.target.value)}
              aria-describedby={errors.boxCount ? 'count-error' : undefined}
              aria-invalid={!!errors.boxCount}
            />
            {errors.boxCount && (
              <p id="count-error" className="text-sm text-destructive">
                {errors.boxCount}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="boxline-units">
              Всего штук <span className="text-muted-foreground">(необязательно)</span>
            </Label>
            <Input
              id="boxline-units"
              type="number"
              min={1}
              step={1}
              value={totalUnits}
              onChange={e => setTotalUnits(e.target.value)}
              placeholder="По умолчанию = коробок × штук/коробку"
              aria-describedby={errors.totalUnits ? 'units-error' : undefined}
              aria-invalid={!!errors.totalUnits}
            />
            {errors.totalUnits && (
              <p id="units-error" className="text-sm text-destructive">
                {errors.totalUnits}
              </p>
            )}
          </div>

          {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}

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
