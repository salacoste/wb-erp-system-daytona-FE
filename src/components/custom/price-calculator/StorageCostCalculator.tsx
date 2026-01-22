'use client'

/**
 * StorageCostCalculator Component
 * Story 44.14-FE: Storage Cost Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Complete storage cost calculator with days input, warnings, and breakdown
 */

import { useMemo, useEffect } from 'react'
import { Info, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StorageDaysInput } from './StorageDaysInput'
import { StorageCostBreakdown } from './StorageCostBreakdown'
import {
  calculateStorageCost,
  getStorageWarningLevel,
  DEFAULT_STORAGE_TARIFF,
  type StorageTariff,
} from '@/lib/storage-cost-utils'

export interface StorageCostCalculatorProps {
  /** Product volume in liters (from dimension inputs) */
  volumeLiters: number
  /** Storage tariff from warehouse (null = use defaults) */
  tariff: StorageTariff | null
  /** Current storage days value */
  days: number
  /** Days change handler */
  onDaysChange: (days: number) => void
  /** Calculated storage cost (for display) */
  value: number
  /** Storage cost change handler (for form auto-fill) */
  onChange: (value: number) => void
  /** Disable all inputs */
  disabled?: boolean
}

/**
 * Storage cost calculator with auto-calculation and warnings
 *
 * Features:
 * - Days input with presets (7, 14, 30, 60, 90)
 * - Warning for storage > 30 days (amber)
 * - Critical warning for storage > 60 days (red)
 * - Collapsible calculation breakdown
 * - Fallback to default tariffs when no warehouse selected
 */
export function StorageCostCalculator({
  volumeLiters,
  tariff,
  days,
  onDaysChange,
  onChange,
  disabled,
}: StorageCostCalculatorProps) {
  // Use default tariff if none provided
  const effectiveTariff = tariff ?? DEFAULT_STORAGE_TARIFF
  const isUsingFallback = tariff === null

  // Calculate storage cost
  const result = useMemo(
    () => calculateStorageCost(volumeLiters, days, effectiveTariff),
    [volumeLiters, days, effectiveTariff],
  )

  // Auto-update parent form value when result changes
  useEffect(() => {
    onChange(result.totalCost)
  }, [result.totalCost, onChange])

  // Warning level based on storage duration
  const warningLevel = getStorageWarningLevel(days)

  // Don't render full UI if volume is 0
  if (volumeLiters <= 0) {
    return (
      <div className="space-y-4">
        <StorageDaysInput value={days} onChange={onDaysChange} disabled={disabled} />
        <p className="text-sm text-muted-foreground">
          Введите габариты товара для расчёта стоимости хранения
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Fallback notice */}
      {isUsingFallback && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Используются стандартные тарифы. Для точного расчёта выберите склад.
          </AlertDescription>
        </Alert>
      )}

      {/* Days input with presets */}
      <StorageDaysInput value={days} onChange={onDaysChange} disabled={disabled} />

      {/* Volume display */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Объём товара:</span>
        <span className="font-medium">{volumeLiters.toFixed(2)} л</span>
      </div>

      {/* Daily cost */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Стоимость хранения/день:</span>
        <span className="font-medium">{formatCurrency(result.dailyCost)}/день</span>
      </div>

      {/* Total cost - prominent display */}
      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
        <span className="font-medium">Итого хранение:</span>
        <span className="text-xl font-bold text-primary">
          {formatCurrency(result.totalCost)}
        </span>
      </div>

      {/* Warning for long storage */}
      {warningLevel === 'warning' && (
        <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            Хранение более 30 дней значительно увеличивает расходы. Рассмотрите
            оптимизацию запасов.
          </AlertDescription>
        </Alert>
      )}

      {warningLevel === 'critical' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Хранение более 60 дней: высокие расходы! Рекомендуем пересмотреть объём
            поставки.
          </AlertDescription>
        </Alert>
      )}

      {/* Calculation breakdown */}
      <StorageCostBreakdown result={result} />
    </div>
  )
}
