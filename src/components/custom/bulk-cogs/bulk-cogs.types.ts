/**
 * Types and constants for BulkCogsForm
 * Story 4.2: Bulk COGS Assignment Capability
 */

/** Form data shape for bulk COGS assignment */
export interface BulkCogsFormData {
  unit_cost_rub: string
  valid_from: string
  notes: string
}

/** Props for the BulkCogsForm component */
export interface BulkCogsFormProps {
  onSuccess?: () => void
}

/** Product item from useProducts hook */
export interface BulkCogsProduct {
  nm_id: string
  sa_name: string
  brand?: string
  has_cogs?: boolean
}

/** Default pagination limit */
export const BULK_COGS_PAGE_LIMIT = 50

/**
 * Translate margin recalculation status to Russian
 * Request #118/119 - Backend fix for automatic margin recalculation
 */
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'В очереди',
    in_progress: 'Выполняется',
    completed: 'Завершено',
  }
  return statusMap[status] || status
}
