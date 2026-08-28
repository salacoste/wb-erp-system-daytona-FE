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
    <div className="rounded-md border border-status-information/30 bg-status-information/10 p-3 text-xs text-muted-foreground">
      <p className="mb-1 font-medium text-status-information">Тарифы SUPPLY</p>
      <p>
        Тарифы на дату поставки уже включают коэффициент склада
        {effectiveTariffs.displayLogisticsCoefficient !== 1.0 && (
          <span className="font-semibold text-status-information">
            {' '}
            x{formatDecimal(effectiveTariffs.displayLogisticsCoefficient, 2)}
          </span>
        )}
        . Дополнительная настройка коэффициентов не требуется.
      </p>
    </div>
  )
}
