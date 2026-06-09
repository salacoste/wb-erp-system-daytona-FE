'use client'

/**
 * Supply tariff info notice for WarehouseSection.
 * Extracted from WarehouseSection.tsx for 200-line compliance.
 */

import { formatDecimal } from '@/lib/utils'
import type { ExtractedTariffs } from '@/lib/tariff-system-utils'

interface SupplyTariffInfoProps {
  effectiveTariffs: ExtractedTariffs
}

export function SupplyTariffInfo({ effectiveTariffs }: SupplyTariffInfoProps) {
  return (
    <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-md p-3">
      <p className="font-medium text-blue-700 mb-1">Тарифы SUPPLY</p>
      <p>
        Тарифы на дату поставки уже включают коэффициент склада
        {effectiveTariffs.displayLogisticsCoefficient !== 1.0 && (
          <span className="font-semibold text-blue-600">
            {' '}
            x{formatDecimal(effectiveTariffs.displayLogisticsCoefficient, 2)}
          </span>
        )}
        . Дополнительная настройка коэффициентов не требуется.
      </p>
    </div>
  )
}
