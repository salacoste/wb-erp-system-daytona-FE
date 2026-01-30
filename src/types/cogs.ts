/**
 * COGS (Cost of Goods Sold) related TypeScript types
 * Epic 18 - COGS Management API
 * Reference: docs/request-backend/09-epic-18-backend-response.md
 */

// ============================================================================
// Story 5.1-fe: COGS History Types
// Backend Endpoint: GET /v1/cogs/history
// Reference: frontend/docs/stories/epic-5/story-5.1-fe-cogs-history-view.md
// ============================================================================

/**
 * COGS History item from GET /v1/cogs/history endpoint
 * Story 5.1-fe: View COGS History
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

/**
 * COGS History response from GET /v1/cogs/history endpoint
 * Story 5.1-fe: View COGS History
 */
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

/**
 * Version chain analysis for delete confirmation
 * Story 5.3-fe: COGS Delete Confirmation
 */
export interface VersionChainInfo {
  isCurrentVersion: boolean
  hasPreviousVersion: boolean
  isOnlyVersion: boolean
  previousVersionCost?: number
  previousVersionDate?: string
}

// ============================================================================
// Original types below
// ============================================================================

/**
 * Reason why margin data might be missing
 * Backend uses UPPER_CASE values (Request #15)
 */
export type MissingDataReason =
  | 'NO_SALES_IN_PERIOD' // Product had no sales in last week (margin period)
  | 'COGS_NOT_ASSIGNED' // Product has sales but no COGS assigned
  | 'NO_SALES_DATA' // Product has never had any sales
  | 'ANALYTICS_UNAVAILABLE' // Epic 17 analytics service unavailable (graceful degradation)
  | null // Margin calculated successfully

/**
 * Margin calculation task status (Request #21 - Epic 22)
 * GET /v1/products/:nmId/margin-status
 * Reference: docs/request-backend/21-margin-calculation-status-endpoint-backend.md
 */
export type MarginCalculationStatus =
  | 'pending' // Task is queued but not started
  | 'in_progress' // Task is currently processing
  | 'completed' // Margin calculation finished
  | 'not_found' // No task and no margin data
  | 'failed' // Task failed (within last 24h)

/**
 * Margin calculation status response (Request #21 - Epic 22)
 * GET /v1/products/:nmId/margin-status
 * Reference: docs/request-backend/21-margin-calculation-status-endpoint-backend.md
 */
export interface MarginCalculationStatusResponse {
  /** Current status of margin calculation task */
  status: MarginCalculationStatus
  /** Estimated completion time (only for pending/in_progress) */
  estimated_completion?: string // ISO timestamp
  /** Weeks being calculated (only for pending/in_progress) */
  weeks?: string[] // ISO weeks (e.g., ["2025-W47", "2025-W48"])
  /** When task was enqueued (only for pending/in_progress/failed) */
  enqueued_at?: string // ISO timestamp
  /** When task started processing (only for in_progress) */
  started_at?: string // ISO timestamp
  /** Error message (only for failed) */
  error?: string
}

/**
 * COGS record with temporal versioning
 */
export interface CogsRecord {
  id: string // COGS record ID (e.g., "cogs_abc123")
  unit_cost_rub: string // Unit cost in RUB (decimal string)
  currency?: string // Currency code (default: 'RUB')
  valid_from: string // ISO date when COGS becomes effective
  valid_to: string | null // ISO date when COGS expires (null = current)
  version?: number // Version number for temporal versioning
  source?: string // Source of COGS data ('manual', 'excel_import', 'api')
  notes?: string // Optional notes about COGS assignment
  created_at?: string // ISO timestamp
  updated_at?: string // ISO timestamp
}

/**
 * Request #31: COGS record that is actually used for margin calculation
 * When latest COGS has future valid_from date, the previous COGS is used.
 * This shows which COGS is actually applied for the last completed week.
 *
 * Uses Week Midpoint Strategy: COGS is selected based on midpoint of the week (~Thursday)
 * Reference: docs/request-backend/29-cogs-temporal-versioning-and-margin-calculation.md
 */
export interface ApplicableCogs {
  /** COGS value used for margin calculation (₽) */
  unit_cost_rub: number
  /** When this COGS became effective (ISO date) */
  valid_from: string
  /** Which ISO week this COGS applies to (last completed week) */
  applies_to_week: string
  /** True if applicable COGS is the same as current (latest) COGS */
  is_same_as_current: boolean
}

/**
 * Product with COGS and margin data
 * Epic 18 Phase 1: Enhanced ProductResponseDto with 9 new fields
 */
export interface ProductWithCogs {
  nm_id: string // WB article ID (артикул)
  sa_name: string // Product name
  brand?: string // Brand name
  category?: string // Category name

  // COGS data
  has_cogs: boolean // Whether COGS is assigned
  cogs: CogsRecord | null // Current COGS record (null if not assigned)

  // NEW: Epic 18 Phase 1 fields (2025-11-23)
  barcode?: string // Product barcode from WB API

  // Margin calculation (from Epic 17 analytics)
  current_margin_pct: number | null // Margin percentage (e.g., 35.5 = 35.5%)
  current_margin_period: string | null // ISO week for margin calculation (e.g., "2025-W46")
  current_margin_sales_qty: number | null // Sales quantity for margin period
  current_margin_revenue: number | null // Revenue for margin period
  missing_data_reason: MissingDataReason // Reason if margin missing

  // Sales statistics (all-time)
  last_sale_date: string | null // Last sale date (ISO date)
  total_sales_qty: number // Total quantity sold (all-time)

  // Orphan products: Products from financial reports (wb_finance_raw) not in WB Products API
  // Reference: Backend getOrphanProductsFromFinance() method
  /** True if product exists only in financial reports, not in WB Products API */
  is_orphan?: boolean
}

/**
 * Product list item
 * When include_cogs=true, backend returns ProductWithCogs fields (margin data)
 * When include_cogs=false, only basic fields are returned (for performance)
 */
export interface ProductListItem {
  nm_id: string
  sa_name: string
  brand?: string
  category?: string
  /** Vendor code / Supplier article (Артикул поставщика) */
  vendor_code?: string
  has_cogs: boolean
  cogs?: CogsRecord | null
  barcode?: string
  last_sale_date: string | null
  total_sales_qty: number

  // Margin fields (present when include_cogs=true in API request)
  current_margin_pct?: number | null
  current_margin_period?: string | null
  current_margin_sales_qty?: number | null
  current_margin_revenue?: number | null
  missing_data_reason?: MissingDataReason

  // Story 4.9 / Story 23.9: Historical margin context fields
  // Populated only when missing_data_reason === "NO_SALES_DATA"
  // Reference: docs/request-backend/25-historical-margin-discovery-endpoint-backend.md
  /** ISO week of last sale (e.g., "2025-W44"). Null if no sales in 12 weeks. */
  last_sales_week?: string | null
  /** Margin % from last sales week. Null if no data. */
  last_sales_margin_pct?: number | null
  /** Units sold in last sales week. */
  last_sales_qty?: number | null
  /** Weeks since last sale (current - last). */
  weeks_since_last_sale?: number | null

  // Request #31: Applicable COGS (may differ from current cogs if future valid_from)
  // Reference: docs/request-backend/31-cogs-display-improvement-show-applicable-cogs-backend.md
  /** COGS actually used for margin calculation (may differ from latest COGS) */
  applicable_cogs?: ApplicableCogs | null

  // Story 24.5 / Epic 24: Storage cost fields (present when include_storage=true in API request)
  // Reference: docs/request-backend/36-epic-24-paid-storage-analytics-api.md
  /** Average daily storage cost in ₽ (e.g., 12.50) */
  storage_cost_daily_avg?: number | null
  /** Total weekly storage cost in ₽ (e.g., 87.50) */
  storage_cost_weekly?: number | null
  /** ISO week of storage data (e.g., "2025-W47") */
  storage_period?: string | null

  // Orphan products: Products from financial reports (wb_finance_raw) not in WB Products API
  // Reference: Backend getOrphanProductsFromFinance() method
  /** True if product exists only in financial reports, not in WB Products API */
  is_orphan?: boolean
}

/**
 * Pagination metadata
 * Backend uses cursor-based pagination (not page-based)
 * Reference: docs/api-integration-guide.md
 */
export interface Pagination {
  total: number // Total number of items
  next_cursor?: string // Cursor for next page (cursor-based pagination)
  // Legacy page-based fields (deprecated, kept for backward compatibility)
  limit?: number
  page?: number
  total_pages?: number
}

/**
 * Product list response
 */
export interface ProductListResponse {
  products: ProductListItem[]
  pagination: Pagination
}

/**
 * Single COGS assignment request
 */
export interface CogsAssignmentRequest {
  unit_cost_rub: number // Unit cost in RUB (>= 0)
  valid_from: string // ISO date (YYYY-MM-DD)
  currency?: string // Currency code (default: 'RUB', supports: USD, EUR, CNY)
  source?: string // Source of COGS data (default: 'manual')
  notes?: string // Optional notes
}

/**
 * Bulk COGS assignment item
 */
export interface BulkCogsItem {
  nm_id: string // WB article ID
  sa_name?: string // Optional product name for validation
  unit_cost_rub: number // Unit cost in RUB (>= 0)
  valid_from: string // ISO date (YYYY-MM-DD)
  currency?: string // Currency code (default: 'RUB')
  source?: string // Source of COGS data (default: 'manual')
  notes?: string // Optional notes
}

/**
 * Bulk COGS upload request
 * Epic 18 Phase 2: Supports both 'items' and 'assignments' field names
 */
export interface BulkCogsUploadRequest {
  items?: BulkCogsItem[] // Original backend format
  assignments?: BulkCogsItem[] // Request #09 format (alias)
}

/**
 * Bulk COGS upload result (per item)
 */
export interface BulkCogsResult {
  nm_id: string
  sa_name?: string
  success: boolean
  cogs_id?: string // COGS record ID if successful
  version?: number // Version number if successful
  error_code?: string // Error code if failed ('PRODUCT_NOT_FOUND', 'DUPLICATE_ENTRY', etc.)
  error_message?: string // Error message if failed
}

/**
 * Margin recalculation status from bulk COGS upload
 * Backend automatically enqueues margin calculation after bulk upload
 * Request #118/119 - Backend fix for automatic margin recalculation
 * Reference: docs/pages/products/COGS-BULK-UPLOAD-CHANGES.md
 */
export interface MarginRecalculationStatus {
  /** ISO weeks affected by bulk COGS upload (e.g., ["2026-W03", "2026-W04"]) */
  weeks: string[]
  /** Current status of margin recalculation task */
  status: 'pending' | 'in_progress' | 'completed'
  /** Task UUID for tracking margin calculation progress */
  taskId: string
}

/**
 * Bulk COGS upload response (V2 format)
 * Use query parameter: ?format=v2
 * UPDATED: Now includes marginRecalculation field (optional)
 */
export interface BulkCogsUploadResponse {
  data: {
    succeeded: number // Count of successful assignments
    failed: number // Count of failed assignments
    results: BulkCogsResult[] // Detailed results for each item
    message: string // Summary message in Russian
    /** Automatic margin recalculation info (optional - only if sales data exists) */
    marginRecalculation?: MarginRecalculationStatus
  }
}

/**
 * Bulk COGS upload response (default format, backward compatible)
 */
export interface BulkCogsUploadResponseLegacy {
  totalItems: number
  createdItems: number
  skippedItems: number
  errors: Array<{
    nm_id: string
    error: string
  }>
}

/**
 * COGS validation error
 */
export interface CogsValidationError {
  field: string // Field name with error
  message: string // Error message in Russian
  code?: string // Error code
  value?: unknown // Invalid value
}

/**
 * Margin analytics data (from Epic 17)
 * Used in Stories 4.5, 4.6, 4.7
 * Story 6.3-FE: Added profit_per_unit, roi fields
 * DEFER-001: Added weeks_with_sales, weeks_with_cogs (date range queries)
 * Epic 26: Added operating expenses and operating profit
 */
export interface MarginAnalyticsSku {
  nm_id: string
  sa_name: string
  revenue_net: number // Net revenue (after all deductions)
  qty: number // Quantity sold

  // COGS & Margin fields (when includeCogs=true)
  cogs?: number // unit_cost × qty
  profit?: number // revenue_net - cogs
  margin_pct?: number // (profit / |revenue_net|) × 100
  markup_percent?: number // (profit / |cogs|) × 100
  missing_cogs_flag: boolean // true if COGS not assigned

  // Story 6.3-FE: ROI & Profit per Unit metrics
  profit_per_unit?: number | null // profit / qty (null if qty = 0)
  roi?: number | null // (profit / cogs) × 100% (null if cogs = 0)

  // DEFER-001: Weeks coverage (only present in date range queries with weekStart/weekEnd)
  // Reference: docs/request-backend/README.md - DEFER-001 section
  weeks_with_sales?: number // Number of weeks with sales data in the period
  weeks_with_cogs?: number // Number of weeks with COGS data in the period

  // Epic 26 / Request #60: Operating Expenses (when includeCogs=true)
  logistics_cost_rub?: string // Логистика (доставка + возврат)
  storage_cost_rub?: string // Хранение
  penalties_rub?: string // Штрафы
  paid_acceptance_cost_rub?: string // Платная приёмка
  acquiring_fee_rub?: string // Эквайринг
  loyalty_fee_rub?: string // Лояльность
  loyalty_compensation_rub?: string // Компенсация лояльности
  commission_rub?: string // Комиссия
  other_adjustments_rub?: string // Прочие корректировки
  // Request #60: Placeholder for future advertising costs
  advertising_cost_rub?: string // Реклама (будущее)
  total_expenses_rub?: string // Сумма всех расходов (deprecated string)
  total_expenses?: number // Сумма всех расходов (number for filtering)
  operating_profit_rub?: string // Операционная прибыль (может быть отрицательной!) - deprecated
  operating_profit?: number | null // Операционная прибыль (number from API)
  operating_margin_pct?: number | null // Операционная маржа %
  has_revenue?: boolean // false = товар с расходами без продаж
  // Epic 30: Net profit after all operational costs
  net_profit?: number // Чистая прибыль = revenue - cogs - logistics - storage - penalties
  net_margin_pct?: number | null // Чистая маржа % = net_profit / revenue × 100%
  storage_data_source?: 'paid_storage_api' | 'unavailable' // Источник данных о хранении
}

/**
 * Margin analytics aggregated by brand/category
 * Story 6.3-FE: Added profit_per_unit, roi fields
 * Epic 26: Added operating expenses and operating profit
 */
export interface MarginAnalyticsAggregated {
  brand?: string // Brand name (for by-brand endpoint)
  category?: string // Category name (for by-category endpoint)
  revenue_gross?: number // Request #69: Gross revenue (before WB commission) for UI consistency
  revenue_net: number // Aggregated net revenue (after WB commission)
  qty: number // Total units sold

  // Aggregated COGS & Margin fields
  cogs?: number // Sum of all COGS
  profit?: number // Sum of all profit
  margin_pct?: number // Weighted average margin
  markup_percent?: number // Weighted average markup
  missing_cogs_count?: number // Count of SKUs without COGS

  // Story 6.3-FE: ROI & Profit per Unit metrics (aggregated)
  profit_per_unit?: number | null // avg profit per unit
  roi?: number | null // (total profit / total cogs) × 100%

  // Epic 26: Operating Expenses (aggregated, when includeCogs=true)
  storage_cost?: number // Хранение
  penalties?: number // Штрафы
  paid_acceptance_cost?: number // Платная приёмка
  acquiring_fee?: number // Эквайринг
  loyalty_fee?: number // Лояльность
  loyalty_compensation?: number // Компенсация лояльности
  commission?: number // Комиссия
  other_adjustments?: number // Прочие корректировки
  total_expenses?: number // Общие расходы
  operating_profit?: number // Операционная прибыль
  operating_margin_pct?: number | null // Операционная маржа %
  skus_with_expenses_only?: number // SKU без продаж с расходами
}

/**
 * Margin analytics response (by-sku)
 */
export interface MarginAnalyticsSkuResponse {
  data: MarginAnalyticsSku[]
  meta?: {
    week: string
    cabinet_id: string
    generated_at: string
  }
}

/**
 * Margin analytics response (by-brand or by-category)
 */
export interface MarginAnalyticsAggregatedResponse {
  data: MarginAnalyticsAggregated[]
  meta?: {
    week: string
    cabinet_id: string
    generated_at: string
  }
}
