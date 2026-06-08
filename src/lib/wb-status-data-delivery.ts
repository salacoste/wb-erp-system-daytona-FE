/**
 * WB Status Data — Delivery + Cancellation Categories
 * Merges with core + returns data to produce complete WB_STATUS_CONFIG
 * Extracted from wb-status-mapping.ts (Story 74.5)
 */

import type { WbStatusConfig } from './wb-status-data-core'
import { WB_STATUS_CONFIG_CORE } from './wb-status-data-core'
import { WB_STATUS_CONFIG_RETURNS } from './wb-status-data-returns'

/** WB status entries: delivery, cancellation */
const WB_STATUS_CONFIG_DELIVERY: Record<string, WbStatusConfig> = {
  // === Delivery - Success (3) ===
  received_by_client: {
    label: 'Получен клиентом',
    labelEn: 'Received by client',
    category: 'delivery',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    isFinal: true,
    sortOrder: 40,
  },
  sold: {
    label: 'Продан',
    labelEn: 'Sold',
    category: 'delivery',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    isFinal: true,
    sortOrder: 41,
  },
  delivering: {
    label: 'Доставляется',
    labelEn: 'Delivering',
    category: 'delivery',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    isFinal: false,
    sortOrder: 42,
  },
  // Validation F-11: live backend emits `ready_for_pickup` (~11% of orders) but
  // it was missing here → rendered as a raw code. WB "готов к выдаче" delivery state.
  ready_for_pickup: {
    label: 'Готов к выдаче',
    labelEn: 'Ready for pickup',
    category: 'delivery',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    isFinal: false,
    sortOrder: 43,
  },
  // === Cancellations (7) ===
  canceled: {
    label: 'Отменён',
    labelEn: 'Canceled',
    category: 'cancellation',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    isFinal: true,
    sortOrder: 50,
  },
  canceled_by_seller: {
    label: 'Отменён продавцом',
    labelEn: 'Canceled by seller',
    category: 'cancellation',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    isFinal: true,
    sortOrder: 51,
  },
  canceled_by_wh: {
    label: 'Отменён складом',
    labelEn: 'Canceled by warehouse',
    category: 'cancellation',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    isFinal: true,
    sortOrder: 52,
  },
  canceled_by_client: {
    label: 'Отменён клиентом',
    labelEn: 'Canceled by client',
    category: 'cancellation',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    isFinal: true,
    sortOrder: 53,
  },
  // Validation F-11: live backend emits `declined_by_client` (client refusal at
  // pickup; backend groups it with canceled_by_client as "cancel/refusal" per
  // return-classification.service.ts:493). Was missing → rendered as raw code.
  // isFinal:false — backend FINAL_WB_STATUSES (orders-sync.service.ts) does NOT
  // include declined_by_client (it keeps polling it), so the FE must not show a
  // "final" checkmark (review F3). Label "Отказ при получении" disambiguates it
  // from canceled_by_client "Отменён клиентом" (review F5).
  declined_by_client: {
    label: 'Отказ при получении',
    labelEn: 'Declined by client',
    category: 'cancellation',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    isFinal: false,
    sortOrder: 56,
  },
  canceled_by_wb: {
    label: 'Отменён WB',
    labelEn: 'Canceled by WB',
    category: 'cancellation',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    isFinal: true,
    sortOrder: 54,
  },
  cancel: {
    label: 'Отмена',
    labelEn: 'Cancel',
    category: 'cancellation',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    isFinal: true,
    sortOrder: 55,
  },
}

/** Default config for unknown status codes */
export const UNKNOWN_STATUS_CONFIG: WbStatusConfig = {
  label: 'Неизвестный статус',
  labelEn: 'Unknown status',
  category: 'other',
  color: 'text-gray-500',
  bgColor: 'bg-gray-50',
  isFinal: false,
  sortOrder: 99,
}

/** Complete WB Status Config — merged from core + delivery + returns */
export const WB_STATUS_CONFIG: Record<string, WbStatusConfig> = {
  ...WB_STATUS_CONFIG_CORE,
  ...WB_STATUS_CONFIG_DELIVERY,
  ...WB_STATUS_CONFIG_RETURNS,
}
