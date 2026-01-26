'use client'

/**
 * WarehouseTariffsByBoxType Component
 * Story 44.42-FE: Box Type Selection Support
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Displays warehouse tariffs grouped by box type (Boxes, Pallets, Supersafe)
 * so users can compare costs before selecting delivery type.
 */

import { Package, Layers, Shield, Truck, Archive } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import type { BoxTypeTariffs } from '@/hooks/useSupplyTariffs'

/** Box type display configuration */
const BOX_TYPE_CONFIG: Record<number, { icon: React.ElementType; label: string; shortLabel: string }> = {
  2: { icon: Package, label: 'Коробки', shortLabel: 'Короб' },
  5: { icon: Layers, label: 'Монопалеты', shortLabel: 'Палет' },
  6: { icon: Shield, label: 'Суперсейф', shortLabel: 'Сейф' },
}

interface WarehouseTariffsByBoxTypeProps {
  /** Tariffs for each box type */
  tariffsByBoxType: BoxTypeTariffs[]
  /** Selected delivery date for display */
  deliveryDate?: string | null
  /** Compact mode for smaller displays */
  compact?: boolean
}

/**
 * Displays tariffs grouped by box type in a grid layout
 */
export function WarehouseTariffsByBoxType({
  tariffsByBoxType,
  deliveryDate,
  compact = false,
}: WarehouseTariffsByBoxTypeProps) {
  if (!tariffsByBoxType.length) {
    return (
      <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
        Нет данных о тарифах для этого склада
      </div>
    )
  }

  // Format date for display
  const dateLabel = deliveryDate
    ? new Date(deliveryDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : null

  return (
    <div className="space-y-2">
      {/* Header with date */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Тарифы{dateLabel ? ` на ${dateLabel}` : ''}</span>
      </div>

      {/* Tariffs grid - one column per box type */}
      <div className={cn('grid gap-2', tariffsByBoxType.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
        {tariffsByBoxType.map((bt) => (
          <BoxTypeTariffCard key={bt.boxTypeId} tariffs={bt} compact={compact} />
        ))}
      </div>
    </div>
  )
}

/** Single box type tariff card */
function BoxTypeTariffCard({ tariffs, compact }: { tariffs: BoxTypeTariffs; compact?: boolean }) {
  const config = BOX_TYPE_CONFIG[tariffs.boxTypeId] ?? {
    icon: Package,
    label: tariffs.boxTypeName,
    shortLabel: tariffs.boxTypeName.slice(0, 5),
  }
  const Icon = config.icon

  return (
    <div className="p-2 bg-muted/40 rounded-lg space-y-1.5">
      {/* Header with box type name */}
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
          {compact ? config.shortLabel : config.label}
        </span>
        {tariffs.isFixedStorage && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
            фикс.
          </Badge>
        )}
      </div>

      {/* Logistics */}
      <div className="flex items-center gap-1 text-xs">
        <Truck className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">Лог:</span>
        <span className="font-medium">
          {formatCurrency(tariffs.delivery.baseLiterRub)} + {formatCurrency(tariffs.delivery.additionalLiterRub)}/л
        </span>
      </div>

      {/* Storage */}
      <div className="flex items-center gap-1 text-xs">
        <Archive className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">Хран:</span>
        <span className="font-medium">
          {tariffs.storage.baseLiterRub.toFixed(2)}
          {!tariffs.isFixedStorage && ` + ${tariffs.storage.additionalLiterRub.toFixed(2)}/л`}
          <span className="text-muted-foreground">/день</span>
        </span>
      </div>

      {/* Coefficient if not 1.0 */}
      {tariffs.delivery.coefficient !== 1.0 && (
        <div className="text-xs">
          <span className="text-muted-foreground">Коэф:</span>{' '}
          <span className={cn('font-medium', tariffs.delivery.coefficient > 1 && 'text-yellow-600')}>
            ×{tariffs.delivery.coefficient.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}
