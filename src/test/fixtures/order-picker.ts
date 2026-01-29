/**
 * Test Fixtures for Order Picker Drawer
 * Story 53.5-FE: Order Picker Drawer
 * Epic 53-FE: Supply Management UI
 *
 * Comprehensive test data for OrderPickerDrawer virtualized component tests.
 * Includes 1000+ mock orders for virtualization testing.
 */

import type { OrderFbsItem, SupplierStatus, WbStatus } from '@/types/orders'

// =============================================================================
// Constants
// =============================================================================

export const ELIGIBLE_SUPPLIER_STATUSES: SupplierStatus[] = ['confirm', 'complete']
export const INELIGIBLE_SUPPLIER_STATUSES: SupplierStatus[] = ['new', 'cancel']
export const MAX_ORDER_SELECTION = 1000
export const DEFAULT_ROW_HEIGHT = 48
export const SEARCH_DEBOUNCE_MS = 300

// =============================================================================
// Individual Order Fixtures
// =============================================================================

export const mockEligibleOrderConfirm: OrderFbsItem = {
  orderId: '1234567890',
  orderUid: 'order-uid-confirm-001',
  nmId: 12345678,
  vendorCode: 'SKU-CONFIRM-001',
  productName: 'Test Product Confirmed',
  price: 1500.0,
  salePrice: 1200.0,
  supplierStatus: 'confirm',
  wbStatus: 'sorted',
  warehouseId: 507,
  deliveryType: 'fbs',
  isB2B: false,
  cargoType: 'MGT',
  createdAt: '2026-01-15T10:30:00.000Z',
  statusUpdatedAt: '2026-01-15T12:00:00.000Z',
}

export const mockEligibleOrderComplete: OrderFbsItem = {
  ...mockEligibleOrderConfirm,
  orderId: '1234567891',
  orderUid: 'order-uid-complete-001',
  vendorCode: 'SKU-COMPLETE-001',
  productName: 'Test Product Completed',
  supplierStatus: 'complete',
  wbStatus: 'sold',
  salePrice: 2500.0,
}

export const mockIneligibleOrderNew: OrderFbsItem = {
  ...mockEligibleOrderConfirm,
  orderId: '1234567892',
  orderUid: 'order-uid-new-001',
  vendorCode: 'SKU-NEW-001',
  productName: 'Test Product New (Ineligible)',
  supplierStatus: 'new',
  wbStatus: 'waiting',
}

export const mockIneligibleOrderCanceled: OrderFbsItem = {
  ...mockEligibleOrderConfirm,
  orderId: '1234567893',
  orderUid: 'order-uid-cancel-001',
  vendorCode: 'SKU-CANCEL-001',
  productName: 'Test Product Canceled (Ineligible)',
  supplierStatus: 'cancel',
  wbStatus: 'canceled',
}

export const mockOrderNoProductName: OrderFbsItem = {
  ...mockEligibleOrderConfirm,
  orderId: '1234567894',
  orderUid: 'order-uid-no-name-001',
  vendorCode: 'SKU-NONAME-001',
  productName: null,
}

// =============================================================================
// Order List Generators
// =============================================================================

/**
 * Creates mock orders for virtualization testing
 * @param count Number of orders to generate
 * @param eligibleOnly If true, only creates confirm/complete status orders
 */
export function createMockOrdersForPicker(count: number, eligibleOnly = true): OrderFbsItem[] {
  return Array.from({ length: count }, (_, i) => {
    const supplierStatus: SupplierStatus = eligibleOnly
      ? i % 2 === 0
        ? 'confirm'
        : 'complete'
      : (['new', 'confirm', 'complete', 'cancel'] as SupplierStatus[])[i % 4]

    const wbStatus: WbStatus =
      supplierStatus === 'new'
        ? 'waiting'
        : supplierStatus === 'confirm'
          ? 'sorted'
          : supplierStatus === 'complete'
            ? 'sold'
            : 'canceled'

    return {
      orderId: `order-${String(i + 1).padStart(10, '0')}`,
      orderUid: `order-uid-${String(i + 1).padStart(6, '0')}`,
      nmId: 10000000 + i,
      vendorCode: `SKU-${String(i + 1).padStart(5, '0')}`,
      productName: `Product ${i + 1}`,
      price: 1000 + i * 10,
      salePrice: 800 + i * 10,
      supplierStatus,
      wbStatus,
      warehouseId: 507 + (i % 3),
      deliveryType: 'fbs',
      isB2B: i % 10 === 0,
      cargoType: i % 5 === 0 ? 'KGT' : 'MGT',
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      statusUpdatedAt: new Date(Date.now() - i * 1800000).toISOString(),
    }
  })
}

/**
 * Large dataset for virtualization performance testing
 */
export const mockOrdersLargeDataset = createMockOrdersForPicker(1000, true)

/**
 * Medium dataset for typical use cases
 */
export const mockOrdersMediumDataset = createMockOrdersForPicker(100, true)

/**
 * Small dataset for basic functionality tests
 */
export const mockOrdersSmallDataset = createMockOrdersForPicker(10, true)

/**
 * Mixed status dataset (includes ineligible orders)
 */
export const mockOrdersMixedStatuses = createMockOrdersForPicker(50, false)

/**
 * Empty dataset
 */
export const mockOrdersEmpty: OrderFbsItem[] = []

// =============================================================================
// Filter Test Data
// =============================================================================

export const mockOrdersForSearchTest: OrderFbsItem[] = [
  {
    ...mockEligibleOrderConfirm,
    orderId: 'ABC-12345',
    vendorCode: 'WIDGET-RED-XL',
    productName: 'Red Widget Extra Large',
  },
  {
    ...mockEligibleOrderConfirm,
    orderId: 'DEF-67890',
    vendorCode: 'GADGET-BLUE-SM',
    productName: 'Blue Gadget Small',
  },
  {
    ...mockEligibleOrderComplete,
    orderId: 'GHI-11111',
    vendorCode: 'WIDGET-GREEN-MD',
    productName: 'Green Widget Medium',
  },
  {
    ...mockEligibleOrderComplete,
    orderId: 'JKL-22222',
    vendorCode: 'ACCESSORY-PURPLE',
    productName: 'Purple Accessory',
  },
]

// =============================================================================
// Add Orders Response Fixtures
// =============================================================================

export interface AddOrdersResult {
  added: string[]
  failed: Array<{ orderId: string; reason: string }>
  supply: {
    id: string
    ordersCount: number
  }
}

export const mockAddOrdersResponseSuccess: AddOrdersResult = {
  added: ['order-0000000001', 'order-0000000002', 'order-0000000003'],
  failed: [],
  supply: {
    id: 'supply-001',
    ordersCount: 10,
  },
}

export const mockAddOrdersResponsePartial: AddOrdersResult = {
  added: ['order-0000000001', 'order-0000000002'],
  failed: [
    {
      orderId: 'order-0000000003',
      reason: 'Order already in supply sup_abc123',
    },
    {
      orderId: 'order-0000000004',
      reason: 'Order status changed to cancel',
    },
  ],
  supply: {
    id: 'supply-001',
    ordersCount: 7,
  },
}

export const mockAddOrdersResponseAllFailed: AddOrdersResult = {
  added: [],
  failed: [
    {
      orderId: 'order-0000000001',
      reason: 'Order already in supply sup_abc123',
    },
    {
      orderId: 'order-0000000002',
      reason: 'Order already in supply sup_def456',
    },
  ],
  supply: {
    id: 'supply-001',
    ordersCount: 5,
  },
}

// =============================================================================
// Selection State Fixtures
// =============================================================================

export function createMockSelectedIds(count: number): Set<string> {
  return new Set(
    Array.from({ length: count }, (_, i) => `order-${String(i + 1).padStart(10, '0')}`)
  )
}

export const mockSelectedIdsSmall = createMockSelectedIds(5)
export const mockSelectedIdsMedium = createMockSelectedIds(50)
export const mockSelectedIdsNearLimit = createMockSelectedIds(950)
export const mockSelectedIdsAtLimit = createMockSelectedIds(1000)

// =============================================================================
// Error Fixtures
// =============================================================================

export const mockOrderPickerErrors = {
  networkError: {
    code: 'NETWORK_ERROR',
    message: 'Не удалось загрузить заказы. Проверьте соединение.',
  },
  serverError: {
    code: 'INTERNAL_ERROR',
    message: 'Ошибка сервера. Попробуйте позже.',
  },
  forbiddenError: {
    code: 'FORBIDDEN',
    message: 'Нет доступа к заказам кабинета.',
  },
  supplyNotFound: {
    code: 'SUPPLY_NOT_FOUND',
    message: 'Поставка не найдена.',
  },
  rateLimitError: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Слишком много запросов. Подождите.',
    details: { retryAfter: 60 },
  },
  orderLimitExceeded: {
    code: 'ORDER_LIMIT_EXCEEDED',
    message: 'Превышен лимит заказов в поставке (максимум 1000).',
  },
}

// =============================================================================
// Russian Labels (for UI testing)
// =============================================================================

export const ORDER_PICKER_LABELS = {
  drawerTitle: 'Добавить заказы в поставку',
  searchPlaceholder: 'Поиск по ID или артикулу...',
  selectAllLabel: 'Выбрать все',
  selectedCountPrefix: 'Выбрано:',
  selectedCountSuffix: 'заказов',
  clearSelectionButton: 'Очистить выбор',
  addButtonPrefix: 'Добавить выбранные',
  addButtonLoading: 'Добавление...',
  statusFilterLabel: 'Статус',
  statusFilterAll: 'Все',
  emptyStateTitle: 'Нет доступных заказов',
  emptyStateDescription: 'Нет доступных заказов для добавления',
  errorStateTitle: 'Не удалось загрузить заказы',
  retryButton: 'Повторить',
  closeButton: 'Закрыть',
  loadingText: 'Загрузка заказов...',
  selectionLimitWarning: 'Приближается к лимиту (максимум 1000)',
  successToast: 'Добавлено:',
  partialSuccessToast: 'Не удалось добавить:',
  errorToast: 'Не удалось добавить заказы',
} as const

// =============================================================================
// Status Config (matching order-status-config.ts pattern)
// =============================================================================

export const SUPPLIER_STATUS_LABELS: Record<SupplierStatus, string> = {
  new: 'Новый',
  confirm: 'Подтвержден',
  complete: 'Завершен',
  cancel: 'Отменен',
}

export const ELIGIBLE_STATUS_LABELS = {
  confirm: 'Подтвержден',
  complete: 'Завершен',
} as const
