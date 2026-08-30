'use client'

/**
 * Create shipment dialog with delivery mode radio + XOR cost fields
 * Epic 76-FE, Story 76.1 (AC: #6)
 */

import { useRef, useState, type RefObject } from 'react'
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
import { useCreateShipment } from '@/hooks/use-shipments'
import { useAuthStore } from '@/stores/authStore'
import { buildShipmentDetailRoute } from '@/lib/routes'
import { DeliveryMode } from '@/types/shipment-cost'
import { ShipmentFormFields } from './ShipmentFormFields'

interface CreateShipmentDialogProps {
  open: boolean
  onClose: () => void
  returnFocusRef?: RefObject<HTMLButtonElement | null>
}

interface FormErrors {
  name?: string
  cost?: string
  submit?: string
}

export function CreateShipmentDialog({ open, onClose, returnFocusRef }: CreateShipmentDialogProps) {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const { mutateAsync, isPending } = useCreateShipment()

  const [name, setName] = useState('')
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(DeliveryMode.FIXED_VEHICLE)
  const [costValue, setCostValue] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const nameInputRef = useRef<HTMLInputElement>(null)
  const costInputRef = useRef<HTMLInputElement>(null)

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
      if (errs.name) nameInputRef.current?.focus()
      else if (errs.cost) costInputRef.current?.focus()
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
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-[425px]"
        onCloseAutoFocus={event => {
          if (!returnFocusRef?.current) return
          event.preventDefault()
          returnFocusRef.current.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle>Создать отправку</DialogTitle>
          <DialogDescription>Укажите название, способ и стоимость доставки</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ShipmentFormFields
            name={name}
            deliveryMode={deliveryMode}
            costValue={costValue}
            costLabel={costLabel}
            errors={errors}
            onNameChange={v => {
              setName(v)
              setErrors(prev => ({ ...prev, name: undefined }))
            }}
            onModeChange={handleModeChange}
            onCostChange={v => {
              setCostValue(v)
              setErrors(prev => ({ ...prev, cost: undefined }))
            }}
            nameInputRef={nameInputRef}
            costInputRef={costInputRef}
          />

          <p role="status" aria-live="polite" className="sr-only">
            {isPending ? 'Создаём отправку' : ''}
          </p>

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
