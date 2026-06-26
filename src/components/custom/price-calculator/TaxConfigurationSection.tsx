'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Receipt } from 'lucide-react'
import { FieldTooltip } from './FieldTooltip'
import { TaxPresetGrid } from './TaxPresetGrid'
import { TaxVatSection } from './TaxVatSection'
import { TaxImpactPreview } from './TaxImpactPreview'
import { TAX_PRESETS } from './tax-presets'
import { TaxRateInput } from './TaxRateInput'
import type { TaxType, TaxPreset } from '@/types/price-calculator'

/** Props for TaxConfigurationSection */
export interface TaxConfigurationSectionProps {
  taxRate: number
  taxType: TaxType
  onTaxRateChange: (value: number) => void
  onTaxTypeChange: (value: TaxType) => void
  isVatPayer: boolean
  vatRate: number
  onVatPayerChange: (isPayer: boolean) => void
  onVatRateChange: (rate: number) => void
  disabled?: boolean
  calculatedTaxAmount?: number
  recommendedPrice?: number
}

/**
 * Tax configuration section with rate input, type toggle, and presets
 * Story 44.17-FE: Tax Configuration (Rate + Type)
 */
export function TaxConfigurationSection({
  taxRate,
  taxType,
  onTaxRateChange,
  onTaxTypeChange,
  isVatPayer,
  vatRate,
  onVatPayerChange,
  onVatRateChange,
  disabled,
  calculatedTaxAmount,
  recommendedPrice,
}: TaxConfigurationSectionProps) {
  const [presetsOpen, setPresetsOpen] = useState(false)
  const matchingPreset = TAX_PRESETS.find(p => p.rate === taxRate && p.type === taxType)

  const applyPreset = (preset: TaxPreset) => {
    onTaxRateChange(preset.rate)
    onTaxTypeChange(preset.type)
  }

  return (
    <div
      className="bg-amber-50 rounded-lg p-4 border-l-4 border-l-amber-400"
      data-testid="tax-configuration-section"
    >
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="h-4 w-4 text-amber-600" aria-hidden="true" />
        <div className="text-sm font-medium text-amber-900">Налоги</div>
      </div>

      <div className="space-y-4">
        {/* Tax Rate Input */}
        <TaxRateInput taxRate={taxRate} onTaxRateChange={onTaxRateChange} disabled={disabled} />

        {/* Tax Type Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="flex-1">Тип налога</Label>
            <FieldTooltip content="Налог с выручки — % от общей суммы продаж (УСН Доходы, Самозанятый). Налог с прибыли — % от прибыли после всех расходов (УСН Доходы-Расходы, ОСН)." />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={taxType === 'income' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onTaxTypeChange('income')}
              disabled={disabled}
              className="flex-1"
              data-testid="tax-type-income"
            >
              С выручки
            </Button>
            <Button
              type="button"
              variant={taxType === 'profit' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onTaxTypeChange('profit')}
              disabled={disabled}
              className="flex-1"
              data-testid="tax-type-profit"
            >
              С прибыли
            </Button>
          </div>
          {matchingPreset && (
            <Badge variant="outline" className="text-xs" data-testid="matching-preset-badge">
              {matchingPreset.name}
            </Badge>
          )}
        </div>

        <TaxVatSection
          isVatPayer={isVatPayer}
          vatRate={vatRate}
          onVatPayerChange={onVatPayerChange}
          onVatRateChange={onVatRateChange}
          disabled={disabled}
        />

        <TaxImpactPreview
          taxType={taxType}
          calculatedTaxAmount={calculatedTaxAmount}
          recommendedPrice={recommendedPrice}
        />

        <TaxPresetGrid
          taxRate={taxRate}
          taxType={taxType}
          isOpen={presetsOpen}
          onOpenChange={setPresetsOpen}
          onPresetSelect={applyPreset}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
