/**
 * COGS History Types
 * Extracted from cogs.ts for file-size compliance (Epic 134-FE)
 */

export interface CogsHistoryItem {
  cogs_id: string
  nm_id: string
  unit_cost_rub: number
  currency: string
  valid_from: string
  valid_to: string | null
  source: 'manual' | 'import' | 'system'
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  is_active: boolean
  affected_weeks: string[]
}

export interface CogsHistoryResponse {
  data: CogsHistoryItem[]
  meta: {
    nm_id: string
    product_name: string
    current_cogs: { unit_cost_rub: number; valid_from: string } | null
    total_versions: number
  }
  pagination: {
    total: number
    cursor: string | null
    has_more: boolean
  }
}

export interface VersionChainInfo {
  isCurrentVersion: boolean
  hasPreviousVersion: boolean
  isOnlyVersion: boolean
  previousVersionCost?: number
  previousVersionDate?: string
}
