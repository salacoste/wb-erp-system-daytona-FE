/**
 * Orders Components - Public API
 * Story 40.3-FE: Orders List Page
 * Story 40.4-FE: Order Details Modal
 * Story 40.7-FE: Integration & Polish
 * Epic 40-FE: Orders UI & WB Native Status History
 */

// ============================================================================
// Story 40.3-FE: Orders List Page Components
// ============================================================================

// Page components
export { OrdersPageHeader } from './OrdersPageHeader'
export { OrdersFilters } from './OrdersFilters'
export { OrdersTable, type SortField, type SortOrder } from './OrdersTable'
export { OrdersTableRow } from './OrdersTableRow'
export { OrdersPagination } from './OrdersPagination'
export {
  OrderStatusBadge,
  getSupplierStatusConfig,
  getSupplierStatusLabel,
} from './OrderStatusBadge'
export { OrdersEmptyState } from './OrdersEmptyState'
export { OrdersLoadingSkeleton } from './OrdersLoadingSkeleton'

// ============================================================================
// Story 40.7-FE: Integration & Polish Components
// ============================================================================

// Error boundary
export { OrdersErrorBoundary } from './OrdersErrorBoundary'
export type { OrdersErrorBoundaryProps } from './OrdersErrorBoundary'

// Suspense fallback
export { OrdersSuspenseFallback } from './OrdersSuspenseFallback'
export type { OrdersSuspenseFallbackProps } from './OrdersSuspenseFallback'

// ============================================================================
// Story 40.4-FE: Order Details Modal Components
// ============================================================================

// Main modal component
export { OrderDetailsModal } from './OrderDetailsModal'
export type { OrderDetailsModalProps } from './OrderDetailsModal'

// Modal header
export { OrderModalHeader } from './OrderModalHeader'
export type { OrderModalHeaderProps } from './OrderModalHeader'

// History tabs container
export { OrderHistoryTabs } from './OrderHistoryTabs'
export type { OrderHistoryTabsProps } from './OrderHistoryTabs'

// Tab content components
export { FullHistoryTab } from './FullHistoryTab'
export type { FullHistoryTabProps } from './FullHistoryTab'

export { WbHistoryTab } from './WbHistoryTab'
export type { WbHistoryTabProps } from './WbHistoryTab'

export { LocalHistoryTab } from './LocalHistoryTab'
export type { LocalHistoryTabProps } from './LocalHistoryTab'

// Utility components
export { ModalLoadingSkeleton } from './ModalLoadingSkeleton'
export type { ModalLoadingSkeletonProps } from './ModalLoadingSkeleton'
