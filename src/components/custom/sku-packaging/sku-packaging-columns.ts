/** Column configuration for SKU Packaging table — Epic 75-FE, Story 75.3 (AC: #3) */

interface SkuPackagingColumn {
  key: string
  label: string
  align?: 'right'
  /** Visually hide the header label (icon-only action column) — keeps it accessible via sr-only. */
  srOnly?: boolean
}

export const SKU_PACKAGING_COLUMNS: SkuPackagingColumn[] = [
  { key: 'product', label: 'Товар' },
  { key: 'boxType', label: 'Тип коробки' },
  { key: 'unitsPerBox', label: 'Штук в коробке', align: 'right' },
  { key: 'status', label: 'Статус' },
  { key: 'actions', label: 'Действия', align: 'right', srOnly: true },
]
