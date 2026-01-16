'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { EfficiencyStatus } from '@/types/advertising-analytics'
import { efficiencyConfig } from './EfficiencyBadge'

/** Filter value type - all statuses plus 'all' option */
export type EfficiencyFilter = EfficiencyStatus | 'all'

interface EfficiencyFilterDropdownProps {
  /** Current filter value */
  value: EfficiencyFilter
  /** Filter change handler */
  onChange: (value: EfficiencyFilter) => void
  /** Disabled state */
  disabled?: boolean
}

/** All filter options with labels */
const filterOptions: { value: EfficiencyFilter; label: string }[] = [
  { value: 'all', label: 'Все статусы' },
  { value: 'excellent', label: efficiencyConfig.excellent.label },
  { value: 'good', label: efficiencyConfig.good.label },
  { value: 'moderate', label: efficiencyConfig.moderate.label },
  { value: 'poor', label: efficiencyConfig.poor.label },
  { value: 'loss', label: efficiencyConfig.loss.label },
  { value: 'unknown', label: efficiencyConfig.unknown.label },
]

/**
 * Efficiency Filter Dropdown Component
 * Story 33.3-FE: Performance Metrics Table (AC4)
 * Epic 33: Advertising Analytics (Frontend)
 *
 * Features:
 * - Filter by efficiency status
 * - All 6 status options + "All"
 * - Accessible (keyboard navigation)
 */
export function EfficiencyFilterDropdown({
  value,
  onChange,
  disabled = false,
}: EfficiencyFilterDropdownProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="efficiency-filter" className="text-xs">
        Статус
      </Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as EfficiencyFilter)}
        disabled={disabled}
      >
        <SelectTrigger
          id="efficiency-filter"
          className="w-40"
          aria-label="Фильтр по статусу эффективности"
        >
          <SelectValue placeholder="Все статусы" />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
