'use client'

import React, { useMemo, useState } from 'react'
import { Calendar, Megaphone, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatDate } from '@/lib/utils'
import {
  getPredefinedRanges,
  getPeriodLabel,
  type DateRange,
  type PeriodOption,
} from './advertising-empty-state-helpers'

export type { DateRange } from './advertising-empty-state-helpers'

export interface AdvertisingEmptyStateProps {
  availableRange?: DateRange
  requestedRange?: DateRange
  isLoading?: boolean
  onDateRangeChange?: (range: DateRange) => void
  className?: string
}

/**
 * Advertising Empty State Component
 * Story 33.7-FE: Dashboard Widget
 * Story 60.6-FE: Sync with Global Dashboard Period
 */
export function AdvertisingEmptyState({
  availableRange,
  requestedRange: _requestedRange,
  isLoading = false,
  onDateRangeChange,
  className,
}: AdvertisingEmptyStateProps) {
  const predefinedRanges = useMemo(() => getPredefinedRanges(availableRange), [availableRange])

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption | null>(
    predefinedRanges.length > 0 ? predefinedRanges[0].value : null
  )

  const handlePeriodChange = (value: string) => {
    const period = value as PeriodOption
    setSelectedPeriod(period)
    const selectedOption = predefinedRanges.find(opt => opt.value === period)
    if (selectedOption && onDateRangeChange) {
      onDateRangeChange(selectedOption.dateRange)
    }
  }

  const availableRangeText = availableRange
    ? `с ${formatDate(availableRange.from)} по ${formatDate(availableRange.to)}`
    : ''

  return (
    <TooltipProvider>
      <Card className={cn('p-6', className)} data-testid="advertising-empty-state">
        <div className="flex items-start gap-3 mb-4">
          {/* Wave-4 boundary sweep: semantic tokens (icon on info/10 = 4.98/7.32). */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-information/10">
            <Calendar className="h-5 w-5 text-status-information" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Нет данных за выбранный период</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Выберите другой период для просмотра рекламы
            </p>
          </div>
        </div>

        {availableRange && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Megaphone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>Данные {availableRangeText}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center"
                  aria-label="Информация о данных рекламы"
                >
                  <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Данные о рекламных расходах обновляются ежедневно.</p>
                  <p className="text-xs text-muted-foreground">
                    Если вы запустили рекламу, но данные не отображаются:
                  </p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                    <li>Убедитесь, что кампании активны</li>
                    <li>Проверьте настройки интеграции с Wildberries</li>
                    <li>Данные могут появляться с задержкой до 24 часов</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {predefinedRanges.length > 0 && (
          <div className="space-y-2">
            <label htmlFor="period-select" className="text-sm font-medium text-foreground">
              Выбрать период
            </label>
            <Select
              value={selectedPeriod ?? undefined}
              onValueChange={handlePeriodChange}
              disabled={isLoading}
            >
              <SelectTrigger
                id="period-select"
                className="w-full"
                aria-label="Выбрать период для просмотра рекламы"
              >
                <SelectValue placeholder="Выберите период" />
              </SelectTrigger>
              <SelectContent>
                {predefinedRanges.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                      <span>{option.label}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {getPeriodLabel(option.value)}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {predefinedRanges.length === 0 && availableRange && (
          <div className="text-sm text-muted-foreground">Нет доступных данных для отображения</div>
        )}
      </Card>
    </TooltipProvider>
  )
}

export default AdvertisingEmptyState
