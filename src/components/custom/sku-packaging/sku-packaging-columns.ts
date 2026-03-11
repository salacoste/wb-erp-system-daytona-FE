/** Column configuration for SKU Packaging table — Epic 75-FE, Story 75.3 (AC: #3) */

interface SkuPackagingColumn {
  key: string
  label: string
  align?: 'right'
}

export const SKU_PACKAGING_COLUMNS: SkuPackagingColumn[] = [
  { key: 'product', label: 'Товар' },
  { key: 'boxType', label: 'Тип коробки' },
  { key: 'unitsPerBox', label: 'Штук в коробке', align: 'right' },
  { key: 'actions', label: '', align: 'right' },
]
