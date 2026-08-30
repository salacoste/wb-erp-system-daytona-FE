'use client'

/**
 * Form fields sub-component for CreateShipmentDialog
 * Extracted for file-size compliance.
 * Epic 76-FE, Story 76.1 (AC: #6)
 */

import type { RefObject } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DeliveryMode } from '@/types/shipment-cost'
import { DELIVERY_MODE_LABELS } from './shipments-columns'

interface FormErrors {
  name?: string
  cost?: string
  submit?: string
}

interface ShipmentFormFieldsProps {
  name: string
  deliveryMode: DeliveryMode
  costValue: string
  costLabel: string
  errors: FormErrors
  onNameChange: (value: string) => void
  onModeChange: (mode: DeliveryMode) => void
  onCostChange: (value: string) => void
  nameInputRef?: RefObject<HTMLInputElement | null>
  costInputRef?: RefObject<HTMLInputElement | null>
}

export function ShipmentFormFields({
  name,
  deliveryMode,
  costValue,
  costLabel,
  errors,
  onNameChange,
  onModeChange,
  onCostChange,
  nameInputRef,
  costInputRef,
}: ShipmentFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="sp-name">Название</Label>
        <Input
          ref={nameInputRef}
          id="sp-name"
          value={name}
          onChange={e => onNameChange(e.target.value)}
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
        <span id="sp-delivery-mode-label" className="text-sm font-medium leading-none">
          Способ доставки
        </span>
        <RadioGroup
          aria-labelledby="sp-delivery-mode-label"
          value={deliveryMode}
          onValueChange={v => onModeChange(v as DeliveryMode)}
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
          ref={costInputRef}
          id="sp-cost"
          type="number"
          min="0"
          step="0.01"
          value={costValue}
          onChange={e => onCostChange(e.target.value)}
          aria-invalid={!!errors.cost}
          aria-describedby={errors.cost ? 'sp-cost-error' : undefined}
        />
        {errors.cost && (
          <p id="sp-cost-error" className="text-sm text-destructive">
            {errors.cost}
          </p>
        )}
      </div>

      {errors.submit && (
        <p role="alert" className="text-sm text-destructive">
          {errors.submit}
        </p>
      )}
    </>
  )
}
