'use client'

// ============================================================================
// Audit Field Filter Component
// Epic 52-FE: Story 52-FE.4 - Audit Log Viewer
// Dropdown filter for audit log field names (21 tracked fields)
// ============================================================================

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TRACKED_TARIFF_FIELDS } from '@/types/tariffs-admin'

/**
 * Russian translations for all 21 tracked tariff fields
 * Keys must match TRACKED_TARIFF_FIELDS from types
 */
const FIELD_LABELS: Record<string, string> = {
  // Acceptance (2 fields)
  acceptanceBoxRatePerLiter: 'Тариф приёмки (₽/л)',
  acceptancePalletRate: 'Тариф паллеты (₽)',

  // Logistics FBO (3 fields)
  logisticsVolumeTiers: 'Тарифные уровни FBO',
  logisticsLargeFirstLiterRate: 'Крупногабарит FBO (первый литр)',
  logisticsLargeAdditionalLiterRate: 'Крупногабарит FBO (доп. литры)',

  // Returns (2 fields)
  returnLogisticsFboRate: 'Возврат FBO (₽)',
  returnLogisticsFbsRate: 'Возврат FBS (₽)',

  // Commission (2 fields)
  defaultCommissionFboPct: 'Комиссия FBO (%)',
  defaultCommissionFbsPct: 'Комиссия FBS (%)',

  // Storage (3 fields)
  storageFreeDays: 'Бесплатные дни хранения',
  fixationClothingDays: 'Фиксация (одежда, дней)',
  fixationOtherDays: 'Фиксация (прочее, дней)',

  // FBS-specific (4 fields)
  fbsUsesFboLogisticsRates: 'FBS использует тарифы FBO',
  logisticsFbsVolumeTiers: 'Тарифные уровни FBS',
  logisticsFbsLargeFirstLiterRate: 'Крупногабарит FBS (первый литр)',
  logisticsFbsLargeAdditionalLiterRate: 'Крупногабарит FBS (доп. литры)',
  clothingCategories: 'Категории одежды',

  // Meta (3 fields)
  effectiveFrom: 'Дата вступления в силу',
  source: 'Источник',
  notes: 'Заметки',
}

/**
 * Special value for "All fields" option
 * Radix Select doesn't allow empty string as value
 */
const ALL_FIELDS_VALUE = '_all'

/**
 * Filter options array for Select component
 * First option is "All fields" with special value
 */
const FILTER_OPTIONS = [
  { value: ALL_FIELDS_VALUE, label: 'Все поля' },
  ...TRACKED_TARIFF_FIELDS.map((field) => ({
    value: field,
    label: FIELD_LABELS[field] || field,
  })),
]

interface AuditFieldFilterProps {
  /** Currently selected field name (empty string for all) */
  value: string
  /** Callback when filter changes */
  onChange: (value: string) => void
  /** Whether filter is disabled (e.g., during loading) */
  disabled?: boolean
}

/**
 * Dropdown filter for audit log field names
 *
 * Features:
 * - "Все поля" option to show all entries
 * - All 21 tracked fields with Russian labels
 * - Accessible with aria-label
 *
 * @example
 * ```tsx
 * const [fieldFilter, setFieldFilter] = useState('')
 *
 * <AuditFieldFilter
 *   value={fieldFilter}
 *   onChange={setFieldFilter}
 * />
 * ```
 */
export function AuditFieldFilter({
  value,
  onChange,
  disabled,
}: AuditFieldFilterProps) {
  // Convert empty string to special value for Select
  const selectValue = value || ALL_FIELDS_VALUE

  // Convert special value back to empty string for parent
  const handleChange = (newValue: string) => {
    onChange(newValue === ALL_FIELDS_VALUE ? '' : newValue)
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="field-filter" className="text-sm text-muted-foreground">
        Фильтр по полю:
      </label>
      <Select
        value={selectValue}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger
          id="field-filter"
          className="w-[280px]"
          aria-label="Фильтр по полю"
        >
          <SelectValue placeholder="Все поля" />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * Get Russian label for field name
 * Useful for displaying field name in table columns
 */
export function getFieldLabel(fieldName: string): string {
  return FIELD_LABELS[fieldName] || fieldName
}
