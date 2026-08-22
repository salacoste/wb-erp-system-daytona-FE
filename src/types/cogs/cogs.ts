/**
 * COGS — Core Types
 * History types: ./cogs-history.ts | Bulk/Assignment types: ./cogs-bulk.ts
 * Re-exports everything so `import from '@/types/cogs'` stays unchanged.
 */

// Re-export from extracted modules
export type {
  CogsHistoryItem,
  CogsHistoryResponse,
  VersionChainInfo,
  CogsSource,
} from './cogs-history'

export type {
  CogsAssignmentRequest,
  BulkCogsItem,
  BulkCogsUploadRequest,
  BulkCogsWireItem,
  BulkCogsWireRequest,
  BulkCogsResult,
  MarginRecalculationStatus,
  BulkCogsUploadResponse,
  BulkCogsResultSummary,
  BulkCogsUploadResponseLegacy,
  CogsValidationError,
} from './cogs-bulk'

// ============================================================================
// Core COGS Types
// ============================================================================

export type MissingDataReason =
  'NO_SALES_IN_PERIOD' | 'COGS_NOT_ASSIGNED' | 'NO_SALES_DATA' | 'ANALYTICS_UNAVAILABLE' | null

export type MarginCalculationStatus =
  'pending' | 'in_progress' | 'completed' | 'not_found' | 'failed'

export interface MarginCalculationStatusResponse {
  status: MarginCalculationStatus
  estimated_completion?: string
  weeks?: string[]
  enqueued_at?: string
  started_at?: string
  error?: string
}

export interface CogsRecord {
  id: string
  unit_cost_rub: string
  currency?: string
  valid_from: string
  valid_to: string | null
  version?: number
  source?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface ApplicableCogs {
  unit_cost_rub: number
  valid_from: string
  applies_to_week: string
  is_same_as_current: boolean
}
