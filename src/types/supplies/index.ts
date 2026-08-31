/**
 * Supplies Module Types
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Barrel re-export — split into domain files for file size compliance.
 * All existing imports from '@/types/supplies' continue to work unchanged.
 */

// Core types: enums, interfaces
export type {
  SupplyStatus,
  StickerFormat,
  DocumentType,
  SuppliesSortField,
  SortOrder,
  SupplyListItem,
  SuppliesPagination,
  SuppliesFilters,
  SuppliesListResponse,
  CreateSupplyRequest,
  CreateSupplyResponse,
  SyncSuppliesResponse,
  SuppliesListParams,
  SuppliesErrorResponse,
} from './core'

// Re-exports from supply-orders.ts (backward compatibility)
export type {
  SupplyOrder,
  SupplyDocument,
  Supply,
  SupplyDetailResponse,
  AddOrdersRequest,
  AddOrdersResponse,
  RemoveOrdersRequest,
  RemoveOrdersResponse,
  CloseSupplyResponse,
  GenerateStickersRequest,
  GenerateStickersResponse,
  SupplyStatusChange,
} from '../supply-orders'

// Acceptance-act (Story O5)
export type {
  AcceptanceActFormat,
  UploadAcceptanceActBody,
  AcceptanceActMeta,
} from './acceptance-act'
