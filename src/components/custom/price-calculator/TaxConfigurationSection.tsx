'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FieldTooltip } from './FieldTooltip'
import { TaxPresetGrid } from './TaxPresetGrid'
import { TAX_PRESETS, QUICK_TAX_RATES } from './tax-presets'
import { AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { TaxType, TaxPreset } from '@/types/price-calculator'

/** Props for TaxConfigurationSection */
export interface TaxConfigurationSectionProps {
  taxRate: number
  taxType: TaxType
  onTaxRateChange: (value: number) => void
  onTaxTypeChange: (value: TaxType) => void
  disabled?: boolean
  calculatedTaxAmount?: number
  recommendedPrice?: number
}

/**
 * Tax configuration section with rate input, type toggle, and presets
 * Story 44.17-FE: Tax Configuration (Rate + Type)
 *
 * Features:
 * - Tax rate input (0-50%, step 1)
 * - Tax type toggle (income/profit)
 * - Quick preset buttons for common rates
 * - Collapsible section with all tax regime presets
 * - Real-time tax impact preview
 * - High rate warning (>20%)
 */
export function TaxConfigurationSection({
  taxRate,
  taxType,
  onTaxRateChange,
  onTaxTypeChange,
  disabled,
  calculatedTaxAmount,
  recommendedPrice,
}: TaxConfigurationSectionProps) {
  const [presetsOpen, setPresetsOpen] = useState(false)

  // Find matching preset (if any)
  const matchingPreset = TAX_PRESETS.find((p) => p.rate === taxRate && p.type === taxType)

  // Calculate tax percentage of price
  const taxPctOfPrice =
    recommendedPrice && recommendedPrice > 0 && calculatedTaxAmount
      ? (calculatedTaxAmount / recommendedPrice) * 100
      : 0

  const isHighTaxRate = taxRate > 20

  // Handle tax rate input change with validation
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0 && value <= 50) {
      onTaxRateChange(value)
    } else if (e.target.value === '') {
      onTaxRateChange(0)
    }
  }

  // Apply preset
  const applyPreset = (preset: TaxPreset) => {
    onTaxRateChange(preset.rate)
    onTaxTypeChange(preset.type)
  }

  return (
    <div className="space-y-4" data-testid="tax-configuration-section">
      {/* Tax Rate Input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="tax_rate_pct" className="flex-1">
            Ставка налога
          </Label>
          <FieldTooltip content="Процент налога от выручки или прибыли в зависимости от вашего налогового режима. Типичные значения: 6% (УСН), 13% (НДФЛ), 15-20% (прибыль)." />
        </div>

        <div className="flex items-center gap-2">
          <Input
            id="tax_rate_pct"
            type="number"
            value={taxRate}
            onChange={handleRateChange}
            min={0}
            max={50}
            step={1}
            disabled={disabled}
            className="w-24"
            data-testid="tax-rate-input"
          />
          <span className="text-sm text-muted-foreground">%</span>

          {/* Quick rate buttons */}
          <div className="flex gap-1 ml-2">
            {QUICK_TAX_RATES.map((rate) => (
              <Button
                key={rate}
                type="button"
                variant={taxRate === rate ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onTaxRateChange(rate)}
                disabled={disabled}
                className="h-7 px-2"
                data-testid={`tax-rate-preset-${rate}`}
              >
                {rate}%
              </Button>
            ))}
          </div>
        </div>

        {isHighTaxRate && (
          <div className="flex items-center gap-1 text-xs text-yellow-600" data-testid="high-tax-warning">
            <AlertTriangle className="h-3 w-3" />
            Высокая ставка налога
          </div>
        )}
      </div>

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

      {/* Tax Impact Preview */}
      {calculatedTaxAmount !== undefined && calculatedTaxAmount > 0 && (
        <div className="p-3 bg-muted/50 rounded-md text-sm" data-testid="tax-impact-preview">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {taxType === 'income' ? 'Налог с выручки:' : 'Налог с прибыли:'}
            </span>
            <span className="font-medium">
              {formatCurrency(calculatedTaxAmount)}
              {taxType === 'income' && taxPctOfPrice > 0 && (
                <span className="text-muted-foreground ml-1">({taxPctOfPrice.toFixed(1)}%)</span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Tax Presets (Collapsible) */}
      <TaxPresetGrid
        taxRate={taxRate}
        taxType={taxType}
        isOpen={presetsOpen}
        onOpenChange={setPresetsOpen}
        onPresetSelect={applyPreset}
        disabled={disabled}
      />
    </div>
  )
}
