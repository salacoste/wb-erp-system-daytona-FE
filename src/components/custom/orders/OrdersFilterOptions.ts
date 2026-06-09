/**
 * Orders filter option constants
 * Extracted from OrdersFilters.tsx for file-size compliance.
 * Story 40.3-FE: Orders List Page
 */

import type { SupplierStatus, WbStatus } from '@/types/orders'

/** Supplier status options for dropdown */
export const SUPPLIER_STATUS_OPTIONS: Array<{ value: SupplierStatus; label: string }> = [
  { value: 'new', label: 'Новый' },
  { value: 'confirm', label: 'Подтверждён' },
  { value: 'complete', label: 'Выполнен' },
  { value: 'cancel', label: 'Отменён' },
]

/**
 * WB status filter options — backend WbStatus enum (10 values as of Request #200 resolution).
 * All values are accepted by `GET /v1/orders?wb_status=<x>` filter.
 */
export const WB_STATUS_OPTIONS: Array<{ value: WbStatus; label: string }> = [
  { value: 'waiting', label: 'Ожидает' },
  { value: 'sorted', label: 'Отсортирован' },
  { value: 'sold', label: 'Продан' },
  { value: 'ready_for_pickup', label: 'Готов к выдаче' },
  { value: 'canceled', label: 'Отменён' },
  { value: 'canceled_by_client', label: 'Отменён клиентом' },
  { value: 'declined_by_client', label: 'Отклонён клиентом' },
  { value: 'defect', label: 'Брак' },
  { value: 'return_at_pvz', label: 'Возврат в ПВЗ' },
  { value: 'returned_to_seller', label: 'Возвращён продавцу' },
]
