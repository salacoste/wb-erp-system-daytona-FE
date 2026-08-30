import { StatusBadge } from '@/components/product/metrics'
import { ShipmentStatus } from '@/types/shipment-cost'

import { STATUS_LABELS } from './shipments-columns'

const STATUS_PRESENTATION = {
  [ShipmentStatus.DRAFT]: 'pending',
  [ShipmentStatus.CONFIRMED]: 'success',
} as const

interface ShipmentStatusBadgeProps {
  status: ShipmentStatus | string
}

export function ShipmentStatusBadge({ status }: ShipmentStatusBadgeProps) {
  const knownStatus = status as ShipmentStatus
  const label = STATUS_LABELS[knownStatus]

  if (!label) {
    return (
      <StatusBadge
        status="unknown"
        label="НЕИЗВЕСТНЫЙ СТАТУС"
        sourceValue={status || 'пустое значение'}
      />
    )
  }

  return <StatusBadge status={STATUS_PRESENTATION[knownStatus]} label={label} />
}
