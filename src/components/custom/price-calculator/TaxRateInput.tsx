'use client'

/**
 * Tax rate input with quick-select buttons and high-rate warning
 * Story 44.17-FE: Tax Configuration
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { formatPercentageInt } from '@/lib/utils'
import { QUICK_TAX_RATES } from './tax-presets'
import { FieldTooltip } from './FieldTooltip'

interface TaxRateInputProps {
  taxRate: number
  onTaxRateChange: (value: number) => void
  disabled?: boolean
}

export function TaxRateInput({ taxRate, onTaxRateChange, disabled }: TaxRateInputProps) {
  const isHighTaxRate = taxRate > 20

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value) && value >= 0 && value <= 50) {
      onTaxRateChange(value)
    } else if (e.target.value === '') {
      onTaxRateChange(0)
    }
  }

  return (
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
        <div className="flex gap-1 ml-2">
          {QUICK_TAX_RATES.map(rate => (
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
              {formatPercentageInt(rate)}
            </Button>
          ))}
        </div>
      </div>
      {isHighTaxRate && (
        <div
          className="flex items-center gap-1 text-xs text-status-warning"
          data-testid="high-tax-warning"
        >
          <AlertTriangle className="h-3 w-3" />
          Высокая ставка налога
        </div>
      )}
    </div>
  )
}
