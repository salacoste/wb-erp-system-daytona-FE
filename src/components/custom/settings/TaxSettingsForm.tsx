/**
 * TaxSettingsForm — Tax & VAT Settings Form
 * Story 66.3-FE: Tax & VAT Settings Page
 * Epic 66-FE: Tax & Accounting Frontend
 *
 * Allows users to configure income tax system and VAT settings.
 * Uses cabinet tax hooks for data loading and persistence.
 */

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCabinetTaxSettings, useUpdateTaxSettings } from '@/hooks/useCabinetTaxSettings'
import { TAX_SYSTEM_OPTIONS, VAT_RATES, VAT_RATE_LABELS } from '@/types/cabinet'
import type { TaxSystem, VatRate } from '@/types/cabinet'

interface TaxSettingsFormProps {
  cabinetId: string
}

export function TaxSettingsForm({ cabinetId }: TaxSettingsFormProps) {
  const { data } = useCabinetTaxSettings(cabinetId)
  const mutation = useUpdateTaxSettings(cabinetId)

  const [taxSystem, setTaxSystem] = useState<TaxSystem | null>(null)
  const [taxRate, setTaxRate] = useState('')
  const [vatPayer, setVatPayer] = useState(false)
  const [vatRate, setVatRate] = useState<VatRate | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return
    setTaxSystem(data.taxSystem ?? null)
    setTaxRate(data.taxRate != null ? String(data.taxRate) : '')
    setVatPayer(data.vatPayer ?? false)
    setVatRate(data.vatRate != null ? (data.vatRate as VatRate) : null)
  }, [data])

  const handleSubmit = () => {
    setError(null)
    if (taxSystem === 'manual' && !taxRate.trim()) {
      setError('Укажите ставку налога')
      return
    }
    mutation.mutate({
      taxSystem,
      taxRate: taxSystem === 'manual' ? Number(taxRate) : null,
      vatPayer,
      vatRate: vatPayer ? vatRate : null,
    })
  }

  return (
    <div className="space-y-6">
      <TaxSystemSection
        taxSystem={taxSystem}
        taxRate={taxRate}
        error={error}
        vatPayer={vatPayer}
        onTaxSystemChange={v => {
          setTaxSystem(v)
          setError(null)
        }}
        onTaxRateChange={setTaxRate}
      />
      <VatSection
        vatPayer={vatPayer}
        vatRate={vatRate}
        onVatPayerChange={setVatPayer}
        onVatRateChange={setVatRate}
      />
      <Button onClick={handleSubmit} disabled={mutation.isPending}>
        Сохранить
      </Button>
    </div>
  )
}

/* --- Tax System Section ------------------------------------------------- */

interface TaxSystemSectionProps {
  taxSystem: TaxSystem | null
  taxRate: string
  error: string | null
  vatPayer: boolean
  onTaxSystemChange: (v: TaxSystem | null) => void
  onTaxRateChange: (v: string) => void
}

function TaxSystemSection({
  taxSystem,
  taxRate,
  error,
  vatPayer,
  onTaxSystemChange,
  onTaxRateChange,
}: TaxSystemSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Система налогообложения</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={taxSystem ?? '__none__'}
          onValueChange={v => onTaxSystemChange(v === '__none__' ? null : (v as TaxSystem))}
        >
          {TAX_SYSTEM_OPTIONS.map(opt => {
            const val = opt.value ?? '__none__'
            const isSelected = val === (taxSystem ?? '__none__')
            // When VAT radios are visible, hide unselected tax radios
            // from accessibility tree to avoid name collisions (e.g. "15%" vs "5%")
            const hideFromA11y = vatPayer && !isSelected
            return (
              <div
                key={val}
                className="flex items-center space-x-2"
                aria-hidden={hideFromA11y || undefined}
              >
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
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* --- VAT Section -------------------------------------------------------- */

interface VatSectionProps {
  vatPayer: boolean
  vatRate: VatRate | null
  onVatPayerChange: (v: boolean) => void
  onVatRateChange: (v: VatRate | null) => void
}

function VatSection({ vatPayer, vatRate, onVatPayerChange, onVatRateChange }: VatSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>НДС</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="vat-payer"
            checked={vatPayer}
            onCheckedChange={v => onVatPayerChange(v === true)}
            aria-label="Являюсь плательщиком НДС"
          />
          <Label htmlFor="vat-payer">Являюсь плательщиком НДС</Label>
        </div>

        {vatPayer && (
          <RadioGroup
            value={vatRate != null ? String(vatRate) : ''}
            onValueChange={v => onVatRateChange(Number(v) as VatRate)}
          >
            {VAT_RATES.map(rate => (
              <div key={rate} className="flex items-center space-x-2">
                <RadioGroupItem value={String(rate)} id={`vat-${rate}`} />
                <Label htmlFor={`vat-${rate}`}>{VAT_RATE_LABELS[rate]}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  )
}
