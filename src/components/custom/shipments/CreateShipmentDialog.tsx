'use client'

/**
 * Create shipment dialog with delivery mode radio + XOR cost fields
 * Epic 76-FE, Story 76.1 (AC: #6)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCreateShipment } from '@/hooks/use-shipments'
import { useAuthStore } from '@/stores/authStore'
import { buildShipmentDetailRoute } from '@/lib/routes'
import { DeliveryMode } from '@/types/shipment-cost'
import { DELIVERY_MODE_LABELS } from './shipments-columns'

interface CreateShipmentDialogProps {
  open: boolean
  onClose: () => void
}

interface FormErrors {
  name?: string
  cost?: string
  submit?: string
}

export function CreateShipmentDialog({ open, onClose }: CreateShipmentDialogProps) {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const { mutateAsync, isPending } = useCreateShipment()

  const [name, setName] = useState('')
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(DeliveryMode.FIXED_VEHICLE)
  const [costValue, setCostValue] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  function resetForm() {
    setName('')
    setDeliveryMode(DeliveryMode.FIXED_VEHICLE)
    setCostValue('')
    setErrors({})
  }

  function handleModeChange(mode: DeliveryMode) {
    setDeliveryMode(mode)
    setCostValue('')
    setErrors(prev => ({ ...prev, cost: undefined }))
  }

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!name.trim()) errs.name = 'Название обязательно'
    const num = Number(costValue)
    if (!costValue || isNaN(num) || num <= 0) {
      errs.cost = 'Введите число больше 0'
    }
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
    try {
      const result = await mutateAsync({
        name: name.trim(),
        deliveryMode,
        ...(deliveryMode === DeliveryMode.FIXED_VEHICLE
          ? { totalDeliveryCost: costNum }
          : { palletRate: costNum }),
        createdBy: user?.email ?? '',
      })
      resetForm()
      onClose()
      router.push(buildShipmentDetailRoute(result.id))
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Ошибка создания отправки' })
    }
  }

  const costLabel =
    deliveryMode === DeliveryMode.FIXED_VEHICLE
      ? 'Общая стоимость доставки (₽)'
      : 'Стоимость за паллету (₽)'

  return (
    <Dialog open={open} onOpenChange={v => !v && !isPending && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Создать отправку</DialogTitle>
          <DialogDescription>Укажите название, способ и стоимость доставки</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sp-name">Название</Label>
            <Input
              id="sp-name"
              value={name}
              onChange={e => {
                setName(e.target.value)
                setErrors(prev => ({ ...prev, name: undefined }))
              }}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'sp-name-error' : undefined}
            />
            {errors.name && (
              <p id="sp-name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Способ доставки</Label>
            <RadioGroup
              value={deliveryMode}
              onValueChange={v => handleModeChange(v as DeliveryMode)}
            >
              {Object.values(DeliveryMode).map(mode => (
                <div key={mode} className="flex items-center space-x-2">
                  <RadioGroupItem value={mode} id={`mode-${mode}`} />
                  <Label htmlFor={`mode-${mode}`}>{DELIVERY_MODE_LABELS[mode]}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sp-cost">{costLabel}</Label>
            <Input
              id="sp-cost"
              type="number"
              min="0"
              step="0.01"
              value={costValue}
              onChange={e => {
                setCostValue(e.target.value)
                setErrors(prev => ({ ...prev, cost: undefined }))
              }}
              aria-invalid={!!errors.cost}
              aria-describedby={errors.cost ? 'sp-cost-error' : undefined}
            />
            {errors.cost && (
              <p id="sp-cost-error" className="text-sm text-destructive">
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
              {isPending ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
