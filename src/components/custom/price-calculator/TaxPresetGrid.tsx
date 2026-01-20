'use client'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TAX_PRESETS } from './tax-presets'
import type { TaxType, TaxPreset } from '@/types/price-calculator'

/**
 * Props for TaxPresetGrid component
 */
export interface TaxPresetGridProps {
  /** Current tax rate */
  taxRate: number
  /** Current tax type */
  taxType: TaxType
  /** Whether presets section is open */
  isOpen: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when preset is selected */
  onPresetSelect: (preset: TaxPreset) => void
  /** Disable all inputs */
  disabled?: boolean
}

/**
 * Collapsible grid of tax regime presets
 * Story 44.17-FE: Tax Configuration
 *
 * Extracted component for tax preset selection
 */
export function TaxPresetGrid({
  taxRate,
  taxType,
  isOpen,
  onOpenChange,
  onPresetSelect,
  disabled,
}: TaxPresetGridProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-between h-auto py-2"
          data-testid="tax-presets-trigger"
        >
          Популярные налоговые режимы
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2" data-testid="tax-presets-content">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TAX_PRESETS.map((preset) => {
            const isActive = preset.rate === taxRate && preset.type === taxType

            return (
              <Button
                key={preset.id}
                type="button"
                variant={isActive ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onPresetSelect(preset)}
                disabled={disabled}
                className="h-auto py-2 justify-start"
                data-testid={`tax-preset-${preset.id}`}
              >
                <div className="text-left">
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {preset.rate}% {preset.type === 'income' ? 'с выручки' : 'с прибыли'}
                  </div>
                </div>
              </Button>
            )
          })}
        </div>

        <a
          href="https://www.nalog.gov.ru/rn77/taxation/taxes/usn/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
          Подробнее о налоговых режимах
        </a>
      </CollapsibleContent>
    </Collapsible>
  )
}
