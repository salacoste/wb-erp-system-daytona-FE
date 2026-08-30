'use client'

/**
 * Shipment detail header with status, cost, dates, and actions
 * Epic 76-FE, Story 76.2 (AC: #1, #2, #3, #7) + Story 76.5 (refactored)
 */

import { ContextBar } from '@/components/product/ContextBar'
import { PageHeader } from '@/components/product/PageHeader'
import { parseDecimal } from '@/lib/decimal-utils'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  DeliveryMode,
  ShipmentStatus,
  type CalculateShipmentResponse,
  type Shipment,
  type ValidationError,
} from '@/types/shipment-cost'
import { DELIVERY_MODE_LABELS } from './shipments-columns'
import { ShipmentActions } from './ShipmentActions'
import { ShipmentStatusBadge } from './ShipmentStatusBadge'

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
  const identity = shipment.name?.trim() || `Отправка ${shipment.id}`
  const contextItems = [
    {
      id: 'delivery-mode',
      label: 'Способ доставки',
      value: DELIVERY_MODE_LABELS[shipment.deliveryMode],
    },
    {
      id: 'cost',
      label: costLabel,
      value: costValue ? formatCurrency(parseDecimal(costValue)) : 'Не указана',
    },
    { id: 'created-at', label: 'Создано', value: formatDate(shipment.createdAt) },
    { id: 'updated-at', label: 'Обновлено', value: formatDate(shipment.updatedAt) },
    ...(shipment.confirmedBy
      ? [{ id: 'confirmed-by', label: 'Подтвердил', value: shipment.confirmedBy }]
      : []),
    ...(shipment.confirmedAt
      ? [{ id: 'confirmed-at', label: 'Подтверждено', value: formatDate(shipment.confirmedAt) }]
      : []),
  ]

  return (
    <PageHeader
      title={identity}
      description={!shipment.name?.trim() ? 'Название не указано' : 'Состав и стоимость отправки'}
      breadcrumbs={[
        { label: 'Главная', href: '/dashboard' },
        { label: 'Отправки', href: '/shipments' },
        { label: identity },
      ]}
      compact
      status={<ShipmentStatusBadge status={shipment.status} />}
      actions={
        <ShipmentActions
          shipment={shipment}
          onCalculateStart={onCalculateStart}
          onCalculateSuccess={onCalculateSuccess}
          onCalculateError={onCalculateError}
        />
      }
    >
      <ContextBar
        items={contextItems}
        state={isDraft ? 'default' : 'fresh'}
        stateLabel={isDraft ? 'Черновик доступен для редактирования' : 'Жизненный цикл завершён'}
      />
    </PageHeader>
  )
}
