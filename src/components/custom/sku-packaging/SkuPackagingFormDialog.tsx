'use client'

/** Create/Edit dialog for SKU Packaging — Epic 75-FE, Story 75.3 (AC: #4, #5) */

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
import { useCreateSkuPackaging } from '@/hooks/use-sku-packaging'
import type { SkuPackaging } from '@/types/shipment-cost'
import { ProductCombobox } from './ProductCombobox'
import { BoxTypeSelect } from './BoxTypeSelect'

interface SkuPackagingFormDialogProps {
  open: boolean
  item: SkuPackaging | null
  onClose: () => void
}

interface FormErrors {
  nmId?: string
  boxTypeId?: string
  unitsPerBox?: string
  api?: string
}

export function SkuPackagingFormDialog({ open, item, onClose }: SkuPackagingFormDialogProps) {
  const isEdit = !!item
  const mutation = useCreateSkuPackaging()

  const [nmId, setNmId] = useState<number | null>(null)
  const [boxTypeId, setBoxTypeId] = useState('')
  const [unitsPerBox, setUnitsPerBox] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      if (item) {
        setNmId(item.nmId)
        setBoxTypeId(item.boxTypeId)
        setUnitsPerBox(String(item.unitsPerBox))
      } else {
        setNmId(null)
        setBoxTypeId('')
        setUnitsPerBox('')
      }
      setErrors({})
    }
  }, [open, item])

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!nmId) next.nmId = 'Выберите товар'
    if (!boxTypeId) next.boxTypeId = 'Выберите тип коробки'
    const u = parseInt(unitsPerBox, 10)
    if (!unitsPerBox || isNaN(u) || u <= 0) next.unitsPerBox = 'Штук в коробке должно быть больше 0'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async () => {
    if (!validate() || !nmId) return
    setErrors({})
    try {
      await mutation.mutateAsync({
        nmId,
        boxTypeId,
        unitsPerBox: parseInt(unitsPerBox, 10),
      })
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения'
      setErrors({ api: msg.includes('409') ? 'Неактивный тип коробки' : msg })
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && !mutation.isPending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать упаковку' : 'Добавить упаковку'}</DialogTitle>
          <DialogDescription>
            Свяжите товар с типом коробки и количеством единиц в одной коробке.
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
            <Label>Товар (nmId)</Label>
            {isEdit ? (
              <Input value={String(nmId ?? '')} disabled />
            ) : (
              <ProductCombobox
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

          <div className="space-y-2">
            <Label>Тип коробки</Label>
            <BoxTypeSelect
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
              id="sp-units"
              type="number"
              min="1"
              step="1"
              value={unitsPerBox}
              onChange={e => setUnitsPerBox(e.target.value)}
              aria-describedby={errors.unitsPerBox ? 'sp-units-error' : undefined}
              aria-invalid={!!errors.unitsPerBox}
            />
            {errors.unitsPerBox && (
              <p id="sp-units-error" className="text-sm text-destructive">
                {errors.unitsPerBox}
              </p>
            )}
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
