'use client'

import { TriangleAlert } from 'lucide-react'
import type { RefObject } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { TAX_SYSTEM_OPTIONS, VAT_RATES, VAT_RATE_LABELS } from '@/types/cabinet'
import type { TaxSystem, VatRate } from '@/types/cabinet'

interface TaxSystemSectionProps {
  taxSystem: TaxSystem | null
  taxRate: string
  error?: string
  disabled: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onTaxSystemChange: (value: TaxSystem | null) => void
  onTaxRateChange: (value: string) => void
}

export function TaxSystemSection({
  taxSystem,
  taxRate,
  error,
  disabled,
  inputRef,
  onTaxSystemChange,
  onTaxRateChange,
}: TaxSystemSectionProps) {
  const descriptionIds = ['tax-rate-help', error ? 'tax-rate-error' : ''].filter(Boolean).join(' ')

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Система налогообложения</h2>
        <p className="text-sm text-muted-foreground">
          Выбранная система влияет на расчёт налога в отчётах и на дашборде.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={taxSystem ?? '__none__'}
          onValueChange={value =>
            onTaxSystemChange(value === '__none__' ? null : (value as TaxSystem))
          }
          aria-label="Система налогообложения"
          disabled={disabled}
          className="gap-3"
        >
          {TAX_SYSTEM_OPTIONS.map(option => {
            const value = option.value ?? '__none__'
            return (
              <div key={value} className="flex min-h-11 items-center gap-3">
                <RadioGroupItem value={value} id={`tax-${value}`} />
                <Label htmlFor={`tax-${value}`} className="leading-normal">
                  {option.label}
                </Label>
              </div>
            )
          })}
        </RadioGroup>

        {taxSystem === null && (
          <div className="flex items-start gap-2 rounded-md border border-status-warning/40 bg-status-warning/10 p-3 text-sm">
            <TriangleAlert
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-status-warning"
            />
            <p>Налоговая система не настроена. Прибыль отображается до вычета налогов.</p>
          </div>
        )}

        {taxSystem === 'manual' && (
          <div className="space-y-2 pt-1">
            <Label htmlFor="tax-rate-input">Ставка налога (%)</Label>
            <div className="flex max-w-xs items-center gap-2">
              <Input
                ref={inputRef}
                id="tax-rate-input"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="0.01"
                value={taxRate}
                onChange={event => onTaxRateChange(event.target.value)}
                disabled={disabled}
                placeholder="Например, 7.5"
                aria-invalid={error ? true : undefined}
                aria-describedby={descriptionIds}
                className="min-h-11 min-w-0"
              />
              <span aria-hidden="true" className="shrink-0 font-medium">
                %
              </span>
            </div>
            <p id="tax-rate-help" className="text-sm text-muted-foreground">
              Допустимое значение: от 0 до 100 процентов.
            </p>
            {error && (
              <p id="tax-rate-error" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface VatSectionProps {
  vatPayer: boolean
  vatRate: number | null
  error?: string
  disabled: boolean
  groupRef: RefObject<HTMLDivElement | null>
  onVatPayerChange: (value: boolean) => void
  onVatRateChange: (value: VatRate) => void
}

export function VatSection({
  vatPayer,
  vatRate,
  error,
  disabled,
  groupRef,
  onVatPayerChange,
  onVatRateChange,
}: VatSectionProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">НДС (Налог на добавленную стоимость)</h2>
        <p className="text-sm text-muted-foreground">
          Ставка НДС сохраняется отдельно и влияет на итог после всех налогов.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex min-h-11 items-center gap-3">
          <Checkbox
            id="vat-payer"
            checked={vatPayer}
            onCheckedChange={value => onVatPayerChange(value === true)}
            disabled={disabled}
          />
          <Label htmlFor="vat-payer" className="leading-normal">
            Являюсь плательщиком НДС
          </Label>
        </div>

        {vatPayer && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Ставка НДС</p>
            <RadioGroup
              ref={groupRef}
              value={vatRate == null ? '' : String(vatRate)}
              onValueChange={value => onVatRateChange(Number(value) as VatRate)}
              aria-label="Ставка НДС"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'vat-rate-error' : undefined}
              disabled={disabled}
              className="gap-3"
            >
              {VAT_RATES.map(rate => (
                <div key={rate} className="flex min-h-11 items-center gap-3">
                  <RadioGroupItem value={String(rate)} id={`vat-${rate}`} />
                  <Label htmlFor={`vat-${rate}`} className="leading-normal">
                    {VAT_RATE_LABELS[rate]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {error && (
              <p id="vat-rate-error" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
