'use client'

/**
 * Edit shipment dialog — name + cost (deliveryMode is read-only)
 * Epic 76-FE, Story 76.2 (AC: #2)
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
import { useUpdateShipment } from '@/hooks/use-shipments'
import { parseDecimal } from '@/lib/decimal-utils'
import { DeliveryMode, type Shipment } from '@/types/shipment-cost'
import { DELIVERY_MODE_LABELS } from './shipments-columns'

interface ShipmentEditDialogProps {
  shipment: Shipment
  open: boolean
  onClose: () => void
}

interface FormErrors {
  name?: string
  cost?: string
  submit?: string
}

export function ShipmentEditDialog({ shipment, open, onClose }: ShipmentEditDialogProps) {
  const { mutateAsync, isPending } = useUpdateShipment()

  const costSource =
    shipment.deliveryMode === DeliveryMode.FIXED_VEHICLE
      ? shipment.totalDeliveryCost
      : shipment.palletRate
  const costLabel =
    shipment.deliveryMode === DeliveryMode.FIXED_VEHICLE
      ? 'Общая стоимость доставки (₽)'
      : 'Стоимость за паллету (₽)'

  const [name, setName] = useState(shipment.name ?? '')
  const [costValue, setCostValue] = useState(String(parseDecimal(costSource)))
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      setName(shipment.name ?? '')
      setCostValue(String(parseDecimal(costSource)))
      setErrors({})
    }
  }, [open, shipment.name, costSource])

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!name.trim()) errs.name = 'Название обязательно'
    const num = Number(costValue)
    if (!costValue || isNaN(num) || num <= 0) errs.cost = 'Введите число больше 0'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const costNum = Number(costValue)
    const costField =
      shipment.deliveryMode === DeliveryMode.FIXED_VEHICLE
        ? { totalDeliveryCost: costNum }
        : { palletRate: costNum }

    try {
      await mutateAsync({ id: shipment.id, data: { name: name.trim(), ...costField } })
      onClose()
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Ошибка обновления' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && !isPending && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редактировать отправку</DialogTitle>
          <DialogDescription>Измените название и стоимость доставки</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="se-name">Название</Label>
            <Input
              id="se-name"
              value={name}
              onChange={e => {
                setName(e.target.value)
                setErrors(prev => ({ ...prev, name: undefined }))
              }}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'se-name-error' : undefined}
            />
            {errors.name && (
              <p id="se-name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Способ доставки</Label>
            <p className="text-sm text-muted-foreground">
              {DELIVERY_MODE_LABELS[shipment.deliveryMode]}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="se-cost">{costLabel}</Label>
            <Input
              id="se-cost"
              type="number"
              min="0"
              step="0.01"
              value={costValue}
              onChange={e => {
                setCostValue(e.target.value)
                setErrors(prev => ({ ...prev, cost: undefined }))
              }}
              aria-invalid={!!errors.cost}
              aria-describedby={errors.cost ? 'se-cost-error' : undefined}
            />
            {errors.cost && (
              <p id="se-cost-error" className="text-sm text-destructive">
                {errors.cost}
              </p>
            )}
          </div>

          {errors.submit && <p className="text-sm text-destructive">{errors.submit}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
