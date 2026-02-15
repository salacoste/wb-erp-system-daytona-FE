/**
 * TaxCard — Story 65.11: Tax Estimate
 *
 * Displays estimated tax based on selected tax system (USN 6%, USN 15%, Manual).
 * Supports tax system switching, period comparison (inverted), and revenue %.
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md
 * @see docs/epics/epic-65-dashboard-metrics-parity/backend-gap-analysis.md
 */

'use client'

import { useRef, useState } from 'react'
import { Receipt, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { StandardMetricSkeleton } from './MetricCardStates'
import {
  calculateTax,
  calculateTaxPct,
  getTaxSystemLabel,
  TAX_SYSTEMS,
  type TaxSystem,
} from '@/lib/tax-calculations'

export interface TaxCardProps {
  taxSystem: TaxSystem | null
  saleGrossTotal: number | null
  previousTaxAmount: number | null
  isLoading: boolean
  logisticsCostTotal?: number
  storageCostTotal?: number
  paidAcceptanceCostTotal?: number
  penaltiesTotal?: number
  otherAdjustmentsNetTotal?: number
  cogsTotal?: number
  advertisingSpend?: number
  manualTaxAmount?: number
  onTaxSystemChange?: (system: TaxSystem) => void
  className?: string
}

function formatRevenuePct(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

export function TaxCard({
  taxSystem,
  saleGrossTotal,
  previousTaxAmount,
  isLoading,
  logisticsCostTotal,
  storageCostTotal,
  paidAcceptanceCostTotal,
  penaltiesTotal,
  otherAdjustmentsNetTotal,
  cogsTotal,
  advertisingSpend,
  manualTaxAmount,
  onTaxSystemChange,
  className,
}: TaxCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />

  const taxAmount = calculateTax(
    taxSystem,
    saleGrossTotal,
    {
      logisticsCostTotal,
      storageCostTotal,
      paidAcceptanceCostTotal,
      penaltiesTotal,
      otherAdjustmentsNetTotal,
      cogsTotal,
      advertisingSpend,
    },
    manualTaxAmount
  )

  const taxPct = calculateTaxPct(taxAmount, saleGrossTotal)
  const hasValue = taxAmount != null && saleGrossTotal != null
  const displayValue = hasValue ? formatCurrency(taxAmount) : '—'

  // Inverted comparison: higher tax is negative (bad)
  const comparison =
    taxAmount != null && previousTaxAmount != null
      ? calculateComparison(taxAmount, previousTaxAmount, true)
      : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Налоги: ${hasValue ? formatCurrency(taxAmount) : 'нет данных'}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-orange-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Налоги</span>
          </div>
          {onTaxSystemChange && taxSystem && (
            <TaxSystemDropdown value={taxSystem} onChange={onTaxSystemChange} />
          )}
        </div>

        <div className="mt-1">
          {taxSystem === null ? (
            <span className="text-sm text-muted-foreground">Настройте систему</span>
          ) : (
            <span className="text-xl font-bold text-orange-600" data-testid="metric-value">
              {displayValue}
            </span>
          )}
        </div>

        {comparison && (
          <div className="mt-1 flex items-center gap-1.5">
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
          </div>
        )}

        {taxPct != null && (
          <div className="mt-1">
            <span className="text-xs text-gray-400">{formatRevenuePct(taxPct)}% от выручки</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Custom dropdown for tax system selection */
function TaxSystemDropdown({
  value,
  onChange,
}: {
  value: TaxSystem
  onChange: (system: TaxSystem) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative" ref={containerRef}>
      <button
        data-testid="tax-system-selector"
        className="flex items-center gap-1 rounded border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(prev => !prev)}
        onBlur={e => {
          if (!containerRef.current?.contains(e.relatedTarget)) {
            setOpen(false)
          }
        }}
      >
        {getTaxSystemLabel(value)}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 rounded border bg-popover shadow-md">
          {TAX_SYSTEMS.filter(sys => sys !== value).map(sys => (
            <button
              key={sys}
              className="block w-full whitespace-nowrap px-3 py-1.5 text-left text-xs hover:bg-accent"
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                onChange(sys)
                setOpen(false)
              }}
            >
              {getTaxSystemLabel(sys)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
