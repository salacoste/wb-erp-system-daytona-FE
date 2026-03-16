'use client'

/**
 * Shipment detail header with status, cost, dates, and actions
 * Epic 76-FE, Story 76.2 (AC: #1, #2, #3, #7) + Story 76.5 (refactored)
 */

import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'
import { parseDecimal } from '@/lib/decimal-utils'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  DeliveryMode,
  ShipmentStatus,
  type CalculateShipmentResponse,
  type Shipment,
  type ValidationError,
} from '@/types/shipment-cost'
import { STATUS_LABELS, DELIVERY_MODE_LABELS } from './shipments-columns'
import { ShipmentActions } from './ShipmentActions'

interface ShipmentDetailHeaderProps {
  shipment: Shipment
  onCalculateStart?: () => void
  onCalculateSuccess?: (result: CalculateShipmentResponse) => void
  onCalculateError?: (errors: ValidationError[]) => void
}

export function ShipmentDetailHeader({
  shipment,
  onCalculateStart,
  onCalculateSuccess,
  onCalculateError,
}: ShipmentDetailHeaderProps) {
  const isDraft = shipment.status === ShipmentStatus.DRAFT
  const costValue =
    shipment.deliveryMode === DeliveryMode.FIXED_VEHICLE
      ? shipment.totalDeliveryCost
      : shipment.palletRate
  const costLabel =
    shipment.deliveryMode === DeliveryMode.FIXED_VEHICLE
      ? 'Стоимость доставки'
      : 'Стоимость за паллету'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{shipment.name || '—'}</h1>
          <Badge variant={isDraft ? 'outline' : 'default'}>{STATUS_LABELS[shipment.status]}</Badge>
          {!isDraft && <Lock className="h-4 w-4 text-muted-foreground" />}
        </div>
        <ShipmentActions
          shipment={shipment}
          onCalculateStart={onCalculateStart}
          onCalculateSuccess={onCalculateSuccess}
          onCalculateError={onCalculateError}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <div>
          <span className="text-muted-foreground">Способ доставки</span>
          <p className="font-medium">{DELIVERY_MODE_LABELS[shipment.deliveryMode]}</p>
        </div>
        <div>
          <span className="text-muted-foreground">{costLabel}</span>
          <p className="font-medium">{costValue ? formatCurrency(parseDecimal(costValue)) : '—'}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Создано</span>
          <p className="font-medium">{formatDate(shipment.createdAt)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Обновлено</span>
          <p className="font-medium">{formatDate(shipment.updatedAt)}</p>
        </div>
      </div>

      {!isDraft && (shipment.confirmedAt || shipment.confirmedBy) && (
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          {shipment.confirmedBy && (
            <div>
              <span className="text-muted-foreground">Подтвердил</span>
              <p className="font-medium">{shipment.confirmedBy}</p>
            </div>
          )}
          {shipment.confirmedAt && (
            <div>
              <span className="text-muted-foreground">Подтверждено</span>
              <p className="font-medium">{formatDate(shipment.confirmedAt)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
