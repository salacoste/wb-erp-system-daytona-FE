/**
 * Column configuration for Box Types table
 * Epic 75-FE, Story 75.2 (AC: #2)
 */

interface BoxTypesColumn {
  key: string
  label: string
  align?: 'right'
}

export const BOX_TYPES_COLUMNS: BoxTypesColumn[] = [
  { key: 'name', label: 'Название' },
  { key: 'dimensions', label: 'Размеры (Д×Ш×В, см)', align: 'right' },
  { key: 'volume', label: 'Объём (см³)', align: 'right' },
  { key: 'status', label: 'Статус' },
  { key: 'actions', label: 'Действия', align: 'right' },
]
