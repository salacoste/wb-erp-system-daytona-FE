'use client'

/**
 * WarehouseTariffDisplay Component
 * Story 44.40-FE: Two Tariff Systems Integration
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Displays warehouse tariffs with system indicator (INVENTORY vs SUPPLY)
 */

import { Truck, Package } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  getTariffSystemLabel,
  getTariffSystemBadgeVariant,
  type TariffSystem,
  type ExtractedTariffs,
} from '@/lib/tariff-system-utils'
import type { Warehouse } from '@/types/warehouse'

export interface WarehouseTariffDisplayProps {
  /** Selected warehouse */
  warehouse: Warehouse
  /** Active tariff system */
  tariffSystem?: TariffSystem
  /** Effective tariffs from the active system */
  effectiveTariffs?: ExtractedTariffs
  /** Selected delivery date for label display */
  deliveryDate?: string | null
}

/**
 * Displays warehouse tariffs with system badge
 */
export function WarehouseTariffDisplay({
  warehouse,
  tariffSystem,
  effectiveTariffs,
  deliveryDate,
}: WarehouseTariffDisplayProps) {
  // Use effectiveTariffs if provided, otherwise fall back to warehouse tariffs
  const deliveryBase = effectiveTariffs?.deliveryBaseLiterRub ?? warehouse.tariffs.deliveryBaseLiterRub
  const deliveryPerLiter = effectiveTariffs?.deliveryPerLiterRub ?? warehouse.tariffs.deliveryPerLiterRub
  const storageBase = effectiveTariffs?.storageBaseLiterRub ?? warehouse.tariffs.storageBaseLiterRub
  const storagePerLiter = effectiveTariffs?.storagePerLiterRub ?? warehouse.tariffs.storagePerLiterRub
  // Use displayLogisticsCoefficient for UI (original from API), not calculation coefficient
  const logisticsCoeff = effectiveTariffs?.displayLogisticsCoefficient ?? 1.0

  return (
    <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-xs">
      {/* Tariff system indicator badge */}
      {tariffSystem && (
        <div className="flex items-center justify-between mb-2">
          <Badge variant={getTariffSystemBadgeVariant(tariffSystem)}>
            {getTariffSystemLabel(tariffSystem, deliveryDate ?? null)}
          </Badge>
        </div>
      )}

      {/* Logistics tariffs */}
      <div className="flex items-center gap-2 text-muted-foreground font-medium">
        <Truck className="h-3.5 w-3.5" />
        <span>Логистика:</span>
        <span className="text-foreground">
          {formatCurrency(deliveryBase)} (1л) + {formatCurrency(deliveryPerLiter)}/л
        </span>
      </div>

      {/* Storage tariffs */}
      <div className="flex items-center gap-2 text-muted-foreground font-medium">
        <Package className="h-3.5 w-3.5" />
        <span>Хранение:</span>
        <span className="text-foreground">
          {storageBase.toFixed(2)} ₽/день (1л) + {storagePerLiter.toFixed(2)} ₽/л/день
        </span>
      </div>

      {/* Logistics coefficient (only when using SUPPLY tariffs with coefficient != 1.0) */}
      {effectiveTariffs && logisticsCoeff !== 1.0 && (
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          <span>Коэффициент логистики:</span>
          <span className={cn('text-foreground', logisticsCoeff > 1 && 'text-yellow-600')}>
            ×{logisticsCoeff.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}
