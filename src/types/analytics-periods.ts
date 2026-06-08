/**
 * Analytics Export Types
 * Extracted from analytics.ts for 200-line cap compliance.
 * Story 6.5-FE: Export Analytics Types
 */

// ============================================
// Export Types
// ============================================

/**
 * Export data type options
 */
export type ExportType = 'by-sku' | 'by-brand' | 'by-category' | 'cabinet-summary'

/**
 * Export file format options
 */
export type ExportFormat = 'csv' | 'xlsx'

/**
 * Export request parameters
 * POST /v1/exports/analytics
 */
export interface ExportRequest {
  /** Type of data to export */
  type: ExportType
  /** Start week (ISO format: YYYY-Www) */
  weekStart?: string
  /** End week (ISO format: YYYY-Www) */
  weekEnd?: string
  /** Single week (alternative to range) */
  week?: string
  /** Export file format */
  format: ExportFormat
  /** Whether to include COGS data in export */
  includeCogs?: boolean
  /** Optional filters */
  filters?: {
    brand?: string
    category?: string
  }
}

/**
 * Export creation response
 * POST /v1/exports/analytics response
 */
export interface ExportCreateResponse {
  /** Unique export ID for status polling */
  export_id: string
  /** Estimated time in seconds */
  estimated_time_sec?: number
}

/**
 * Export status response
 * GET /v1/exports/:id response
 */
export interface ExportStatus {
  /** Unique export ID */
  export_id: string
  /** Current export status */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** Download URL (when completed) */
  download_url?: string
  /** File size in bytes (when completed) */
  file_size_bytes?: number
  /** Number of rows exported (when completed) */
  rows_count?: number
  /** Link expiration time (ISO string) */
  expires_at?: string
  /** Error message (when failed) */
  error_message?: string
  /** Estimated time remaining in seconds */
  estimated_time_sec?: number
}
