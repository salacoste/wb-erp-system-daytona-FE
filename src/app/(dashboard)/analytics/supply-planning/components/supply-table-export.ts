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
/**
 * Encode one CSV cell:
 *  - null/undefined → empty cell.
 *  - OWASP CSV-injection: neutralize a leading formula trigger (= + - @ tab CR) by prefixing
 *    `'` so a hostile product name like `=HYPERLINK(...)` can't execute when opened in Excel.
 *    No legitimate column here starts with those chars (numbers are non-negative, the enum/
 *    ids don't), so this is safe.
 *  - RFC 4180: escape embedded double-quotes by doubling, then wrap in quotes (an unescaped `"`
 *    in a product name previously shifted every following column).
 */
function encodeCsvCell(value: unknown): string {
  let s = value == null ? '' : String(value)
  if (/^[=+\-@\t\r\n]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
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
