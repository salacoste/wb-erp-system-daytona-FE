import type { SupplyPlanningItem } from '@/types/supply-planning'

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
]

/**
 * Build the supply-planning CSV content (pure, testable).
 * The "Дней до стокаута" column stays NUMERIC for spreadsheet sorting (the 999 "never
 * stocks out" sentinel exports as-is). A null exports as an EMPTY cell — not English "N/A",
 * which leaked into this Russian-locale export.
 */
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
  ])

  return [CSV_HEADERS.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join(
    '\n'
  )
}

/**
 * Export supply planning data as CSV file.
 * Extracted from SupplyPlanningTable.tsx — Story 6.3.
 */
export function exportSupplyTableCSV(data: SupplyPlanningItem[]) {
  const csvContent = buildSupplyTableCsv(data)

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `supply-planning-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
