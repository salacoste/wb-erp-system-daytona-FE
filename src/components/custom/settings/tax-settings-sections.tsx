/** Tax Settings form sections — extracted from TaxSettingsForm.tsx for 200-line limit */

'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TAX_SYSTEM_OPTIONS, VAT_RATES, VAT_RATE_LABELS } from '@/types/cabinet'
import type { TaxSystem, VatRate } from '@/types/cabinet'

/* --- Tax System Section ------------------------------------------------- */

export interface TaxSystemSectionProps {
  taxSystem: TaxSystem | null
  taxRate: string
  error: string | null
  onTaxSystemChange: (v: TaxSystem | null) => void
  onTaxRateChange: (v: string) => void
}

export function TaxSystemSection({
  taxSystem,
  taxRate,
  error,
  onTaxSystemChange,
  onTaxRateChange,
}: TaxSystemSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Система налогообложения</CardTitle>
        <CardDescription>
          Выбранная система влияет на расчёт налога в отчётах и на дашборде
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={taxSystem ?? '__none__'}
          onValueChange={v => onTaxSystemChange(v === '__none__' ? null : (v as TaxSystem))}
          aria-label="Система налогообложения"
        >
          {TAX_SYSTEM_OPTIONS.map(opt => {
            const val = opt.value ?? '__none__'
            return (
              <div key={val} className="flex items-center space-x-2">
                <RadioGroupItem value={val} id={`tax-${val}`} />
                <Label htmlFor={`tax-${val}`}>{opt.label}</Label>
              </div>
            )
          })}
        </RadioGroup>

        {taxSystem === 'manual' && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="tax-rate-input">Ставка налога (%)</Label>
            <Input
              id="tax-rate-input"
              type="number"
              min={0}
              max={100}
              value={taxRate}
              onChange={e => onTaxRateChange(e.target.value)}
              placeholder="Введите ставку"
              aria-describedby={error ? 'tax-rate-error' : undefined}
            />
            {error && (
              <p id="tax-rate-error" className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* --- VAT Section -------------------------------------------------------- */

export interface VatSectionProps {
  vatPayer: boolean
  vatRate: VatRate | null
  vatError: string | null
  onVatPayerChange: (v: boolean) => void
  onVatRateChange: (v: VatRate | null) => void
}

export function VatSection({
  vatPayer,
  vatRate,
  vatError,
  onVatPayerChange,
  onVatRateChange,
}: VatSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>НДС (Налог на добавленную стоимость)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="vat-payer"
            checked={vatPayer}
            onCheckedChange={v => onVatPayerChange(v === true)}
          />
          <Label htmlFor="vat-payer">Являюсь плательщиком НДС</Label>
        </div>

        {vatPayer && (
          <div className="space-y-2">
            <RadioGroup
              value={vatRate != null ? String(vatRate) : ''}
              onValueChange={v => onVatRateChange(Number(v) as VatRate)}
              aria-label="Ставка НДС"
            >
              {VAT_RATES.map(rate => (
                <div key={rate} className="flex items-center space-x-2">
                  <RadioGroupItem value={String(rate)} id={`vat-${rate}`} />
                  <Label htmlFor={`vat-${rate}`}>{VAT_RATE_LABELS[rate]}</Label>
                </div>
              ))}
            </RadioGroup>
            {vatError && (
              <p className="text-sm text-destructive" role="alert">
                {vatError}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
