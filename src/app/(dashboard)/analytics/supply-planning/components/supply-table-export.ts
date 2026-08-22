import type { SupplyPlanningItem } from '@/types/supply-planning'
import { escapeCsvCellAlwaysQuoted } from '@/lib/csv/csv-helpers'

const CSV_HEADERS = [
  'Статус',
  'Артикул',
  'Название',
  'Остаток',
  'В пути',
  'Скорость (шт/день)',
  'Дней до стокаута',
  'Рекомендация (шт)',
  'Сумма заказа (₽)',
  'Цена продажи (₽)',
]

/**
 * Encode one CSV cell:
 *  - null/undefined → empty cell.
 *  - Delegates to escapeCsvCell for OWASP defanging + RFC 4180 quoting.
 */
function encodeCsvCell(value: unknown): string {
  return escapeCsvCellAlwaysQuoted(value == null ? '' : String(value))
}

export function buildSupplyTableCsv(data: SupplyPlanningItem[]): string {
  const rows = data.map(item => [
    item.stockout_risk,
    item.sku_id,
    item.product_name,
    item.current_stock,
    item.in_transit,
    item.avg_daily_sales.toFixed(1),
    item.days_until_stockout ?? '',
    item.reorder_quantity,
    item.reorder_value,
    item.selling_price,
  ])

  return [
    CSV_HEADERS.map(encodeCsvCell).join(','),
    ...rows.map(row => row.map(encodeCsvCell).join(',')),
  ].join('\n')
}

/**
 * Export supply planning data as CSV file.
 * Extracted from SupplyPlanningTable.tsx — Story 6.3.
 */
export function exportSupplyTableCSV(data: SupplyPlanningItem[]) {
  const csvContent = buildSupplyTableCsv(data)

  // Prepend a UTF-8 BOM so Excel on Windows (RU locale) detects UTF-8 instead of CP1251 —
  // without it the Cyrillic headers + product names render as mojibake on double-click open.
  const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `supply-planning-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
