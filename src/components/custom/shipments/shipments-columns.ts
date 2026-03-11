/**
 * Column configuration and label maps for Shipments table
 * Epic 76-FE, Story 76.1 (AC: #2)
 */

import { DeliveryMode, ShipmentStatus } from '@/types/shipment-cost'

interface ShipmentsColumn {
  key: string
  label: string
  align?: 'right'
}

export const SHIPMENTS_COLUMNS: ShipmentsColumn[] = [
  { key: 'name', label: 'Название' },
  { key: 'status', label: 'Статус' },
  { key: 'deliveryMode', label: 'Способ доставки' },
  { key: 'pallets', label: 'Паллет', align: 'right' },
  { key: 'createdAt', label: 'Дата создания' },
  { key: 'actions', label: '', align: 'right' },
]

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  [ShipmentStatus.DRAFT]: 'ЧЕРНОВИК',
  [ShipmentStatus.CONFIRMED]: 'ПОДТВЕРЖДЕНА',
}

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  [DeliveryMode.FIXED_VEHICLE]: 'Фиксированная стоимость',
  [DeliveryMode.PER_PALLET]: 'За паллету',
}

export const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Все' },
  { value: ShipmentStatus.DRAFT, label: 'Черновик' },
  { value: ShipmentStatus.CONFIRMED, label: 'Подтверждена' },
] as const
