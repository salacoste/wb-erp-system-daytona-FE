/**
 * COGS History Types
 * Extracted from cogs.ts for file-size compliance (Epic 134-FE)
 */

/**
 * Provenance of a COGS unit-cost record (single source of truth — referenced by
 * the boundary type, `SourceCell`, and the display helpers).
 * BD-13: `moysklad` added — backend МойСклад sync emits it (moysklad-sync.service.ts);
 * without it the sourceConfig/manual fallback mislabels synced rows as «Ручной ввод».
 */
export type CogsSource = 'manual' | 'import' | 'system' | 'moysklad'

export interface CogsHistoryItem {
  cogs_id: string
  nm_id: string
  unit_cost_rub: number
  currency: string
  valid_from: string
  valid_to: string | null
  source: CogsSource
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
