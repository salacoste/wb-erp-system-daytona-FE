/**
 * Storage Analytics Types
 * Story 24.1-FE: TypeScript Types & API Client
 * Epic 24: Paid Storage Analytics (Frontend)
 * Reference: docs/request-backend/36-epic-24-paid-storage-analytics-api.md
 *
 * Barrel re-export — split into domain files for file size compliance.
 * All existing imports from '@/types/storage-analytics' continue to work unchanged.
 */

// By SKU: period, item, summary, pagination, response
export type {
  StoragePeriod,
  StorageBySkuItem,
  StorageSummary,
  StoragePagination,
  StorageBySkuResponse,
} from './by-sku'

// Top consumers & query params
export type {
  TopConsumerItem,
  TopConsumersResponse,
  StorageBySkuParams,
  StorageTopConsumersParams,
} from './top-consumers'

// Re-exports from storage-analytics-trends.ts (backward compatibility)
export type {
  StorageTrendPoint,
  MetricSummary,
  MoneyMetricSummary,
  StorageTrendsResponse,
  PaidStorageImportRequest,
  ImportStatus,
  PaidStorageImportResponse,
  ImportStatusResponse,
  StorageSummaryResponse,
  StorageSummaryParams,
  StorageTrendsParams,
} from '../storage-analytics-trends'
