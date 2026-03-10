/**
 * Export Dialog Constants
 * Story 6.5-FE: Export Analytics UI
 *
 * Export type labels and shared constants for ExportDialog.
 */

import type { ExportType } from '@/types/analytics'

/**
 * Export type labels in Russian
 */
export const EXPORT_TYPE_LABELS: Record<ExportType, string> = {
  'by-sku': 'По товарам (SKU)',
  'by-brand': 'По брендам',
  'by-category': 'По категориям',
  'cabinet-summary': 'Сводка по кабинету',
}
