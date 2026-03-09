/**
 * Storage Analytics React Query Hooks
 * Story 24.1-FE: TypeScript Types & API Client
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * BARREL RE-EXPORT - Split into individual files for Story 74.4 (file size compliance)
 * All named exports preserved for backward compatibility (44 consumers).
 */

// Query keys & shared types
export { storageQueryKeys } from './storage-analytics-query-keys'
export type {
  UseStorageBySkuOptions,
  UseStorageTopConsumersOptions,
  UseStorageTrendsOptions,
  UseStorageSummaryOptions,
  UsePaidStorageImportOptions,
  UseImportStatusOptions,
} from './storage-analytics-query-keys'

// Query hooks
export { useStorageBySku } from './useStorageBySku'
export { useStorageTopConsumers } from './useStorageTopConsumers'
export { useStorageTrends } from './useStorageTrends'
export { useStorageSummary } from './useStorageSummary'

// Mutation hooks
export { usePaidStorageImport } from './usePaidStorageImport'

// Import status polling
export { useImportStatus } from './useImportStatus'

// Helper hooks
export { useInvalidateStorageQueries } from './useInvalidateStorageQueries'
