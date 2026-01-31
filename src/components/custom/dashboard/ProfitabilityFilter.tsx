/**
 * Profitability Filter Component
 * Story 63.10-FE: Unit Economics Table Enhancement
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Multi-select dropdown filter for profitability statuses.
 * @see docs/stories/epic-63/story-63.10-fe-unit-economics-enhancement.md
 */

'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Filter, X } from 'lucide-react'
import {
  type ExtendedProfitabilityStatus,
  ALL_PROFITABILITY_STATUSES,
  EXTENDED_STATUS_CONFIG,
} from '@/lib/profitability-utils'

export interface ProfitabilityFilterProps {
  /** Currently selected statuses */
  selectedStatuses: ExtendedProfitabilityStatus[]
  /** Callback when filter changes */
  onFilterChange: (statuses: ExtendedProfitabilityStatus[]) => void
}

/**
 * Profitability Filter Dropdown
 *
 * Multi-select filter with:
 * - All 6 status options with color indicators
 * - URL parameter synchronization
 * - Clear filter action
 * - Count badge when filters active
 */
export function ProfitabilityFilter({
  selectedStatuses,
  onFilterChange,
}: ProfitabilityFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const toggleStatus = useCallback(
    (status: ExtendedProfitabilityStatus) => {
      const newStatuses = selectedStatuses.includes(status)
        ? selectedStatuses.filter(s => s !== status)
        : [...selectedStatuses, status]

      onFilterChange(newStatuses)

      // Update URL params
      const params = new URLSearchParams(searchParams.toString())
      if (newStatuses.length === 0 || newStatuses.length === ALL_PROFITABILITY_STATUSES.length) {
        params.delete('status')
      } else {
        params.set('status', newStatuses.join(','))
      }
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [selectedStatuses, onFilterChange, router, searchParams]
  )

  const clearFilter = useCallback(() => {
    onFilterChange([])
    const params = new URLSearchParams(searchParams.toString())
    params.delete('status')
    router.push(`?${params.toString()}`, { scroll: false })
  }, [onFilterChange, router, searchParams])

  const hasFilter =
    selectedStatuses.length > 0 && selectedStatuses.length < ALL_PROFITABILITY_STATUSES.length

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Статус
            {hasFilter && (
              <Badge variant="secondary" className="ml-1 px-1.5">
                {selectedStatuses.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Фильтр по статусу</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ALL_PROFITABILITY_STATUSES.map(status => {
            const config = EXTENDED_STATUS_CONFIG[status]
            return (
              <DropdownMenuCheckboxItem
                key={status}
                checked={selectedStatuses.includes(status)}
                onCheckedChange={() => toggleStatus(status)}
              >
                <span
                  className="mr-2 h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: config.color }}
                  aria-hidden="true"
                />
                {config.label}
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilter}
          className="gap-1 text-muted-foreground"
          aria-label="Сбросить фильтр"
        >
          <X className="h-3 w-3" />
          Сбросить
        </Button>
      )}
    </div>
  )
}
