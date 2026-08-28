'use client'

import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FieldTooltip } from './FieldTooltip'
import { formatPercentageInt } from '@/lib/utils'

/** Common VAT rates in Russia (including 5% for small business, 22% for special categories) */
const VAT_RATES = [0, 5, 10, 20, 22] as const

export interface TaxVatSectionProps {
  isVatPayer: boolean
  vatRate: number
  onVatPayerChange: (isPayer: boolean) => void
  onVatRateChange: (rate: number) => void
  disabled?: boolean
}

/**
 * VAT configuration sub-section
 * Extracted from TaxConfigurationSection for file size compliance (Story 74.8)
 */
export function TaxVatSection({
  isVatPayer,
  vatRate,
  onVatPayerChange,
  onVatRateChange,
  disabled,
}: TaxVatSectionProps) {
  return (
    <div className="space-y-2 border-t border-status-warning/30 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="vat-toggle" className="text-sm">
            Плательщик НДС
          </Label>
          <FieldTooltip content="Если вы на ОСН, вы обязаны платить НДС. Комиссия WB рассчитывается от цены с НДС. УСН и самозанятые не платят НДС." />
        </div>
        <Button
          id="vat-toggle"
          type="button"
          variant={isVatPayer ? 'default' : 'outline'}
          size="sm"
          onClick={() => onVatPayerChange(!isVatPayer)}
          disabled={disabled}
          className="h-7 px-3"
          data-testid="vat-toggle"
        >
          {isVatPayer ? 'Да' : 'Нет'}
        </Button>
      </div>

      {isVatPayer && (
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Ставка НДС:</Label>
          <div className="flex gap-1">
            {VAT_RATES.map(rate => (
              <Button
                key={rate}
                type="button"
                variant={vatRate === rate ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onVatRateChange(rate)}
                disabled={disabled}
                className="h-7 px-2"
                data-testid={`vat-rate-${rate}`}
              >
                {formatPercentageInt(rate)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
