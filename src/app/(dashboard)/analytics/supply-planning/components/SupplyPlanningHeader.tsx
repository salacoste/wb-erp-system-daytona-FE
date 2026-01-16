'use client'

import { RefreshCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

/**
 * Supply Planning Page Header
 * Story 6.2: Page Structure & Risk Dashboard
 *
 * Contains page title, safety stock selector, velocity weeks,
 * refresh button with timestamp, and export button.
 */

interface SupplyPlanningHeaderProps {
  safetyStockDays: number
  velocityWeeks: number
  onSafetyStockChange: (days: number) => void
  onVelocityWeeksChange: (weeks: number) => void
  onRefresh: () => void
  isRefreshing?: boolean
  lastUpdated?: Date
}

const SAFETY_STOCK_OPTIONS = [
  { value: 7, label: '7 дней' },
  { value: 14, label: '14 дней' },
  { value: 21, label: '21 день' },
  { value: 30, label: '30 дней' },
  { value: 45, label: '45 дней' },
  { value: 60, label: '60 дней' },
]

const VELOCITY_WEEKS_OPTIONS = [
  { value: 1, label: '1 неделя' },
  { value: 2, label: '2 недели' },
  { value: 4, label: '4 недели' },
  { value: 8, label: '8 недель' },
  { value: 13, label: '13 недель' },
]

export function SupplyPlanningHeader({
  safetyStockDays,
  velocityWeeks,
  onSafetyStockChange,
  onVelocityWeeksChange,
  onRefresh,
  isRefreshing = false,
  lastUpdated,
}: SupplyPlanningHeaderProps) {
  // Format last updated time
  const lastUpdatedText = lastUpdated
    ? formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ru })
    : null

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Планирование поставок
        </h1>
        <p className="text-sm text-muted-foreground">
          Прогноз стокаутов и рекомендации по заказам
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Safety Stock Days Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Запас:
          </span>
          <Select
            value={String(safetyStockDays)}
            onValueChange={(value) => onSafetyStockChange(Number(value))}
          >
            <SelectTrigger className="w-[110px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SAFETY_STOCK_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Velocity Weeks Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Скорость:
          </span>
          <Select
            value={String(velocityWeeks)}
            onValueChange={(value) => onVelocityWeeksChange(Number(value))}
          >
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VELOCITY_WEEKS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Refresh Button with Timestamp */}
        <div className="flex items-center gap-2">
          {lastUpdatedText && (
            <span className="text-xs text-muted-foreground hidden lg:inline">
              {lastUpdatedText}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>

        {/* Export Button (Future) */}
        <Button variant="outline" size="sm" disabled className="h-9">
          <Download className="h-4 w-4 mr-2" />
          CSV
        </Button>
      </div>
    </div>
  )
}
