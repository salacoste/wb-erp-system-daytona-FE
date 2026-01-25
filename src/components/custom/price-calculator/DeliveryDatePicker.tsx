'use client'

import { useMemo, useState } from 'react'
import { Calendar, Package, Layers, Shield, HelpCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CoefficientCalendar } from './CoefficientCalendar'
import {
  formatDateLongRu,
  formatCoefficient,
  getCoefficientStatusConfig,
  getTomorrowDate,
  getFirstAvailableDate,
  getCoefficientStatus,
  type NormalizedCoefficient,
} from '@/lib/coefficient-utils'
import { cn } from '@/lib/utils'
import type { BoxTypeCoefficients, BoxType } from '@/hooks/useAcceptanceCoefficients'

/** Box type icons mapping */
const BOX_TYPE_ICONS: Record<BoxType, React.ElementType> = {
  boxes: Package,
  pallets: Layers,
  supersafe: Shield,
}

interface DeliveryDatePickerProps {
  /** Array of coefficients for the next 14 days (legacy, default box type) */
  coefficients: NormalizedCoefficient[]
  /** Coefficients grouped by box type */
  byBoxType?: BoxTypeCoefficients[]
  /** Currently selected date (ISO format) */
  selectedDate: string | null
  /** Callback when date is selected */
  onDateSelect: (date: string, coefficient: number) => void
  /** Whether the coefficients are loading */
  isLoading?: boolean
  /** Error message if coefficients failed to load */
  error?: string | null
  /** Label for the picker (default: "Дата сдачи товара") */
  label?: string
  /** Show hint icon */
  showHint?: boolean
  /** Show fallback mode when API has no data (simple date picker with default coefficient) */
  showFallback?: boolean
}

/**
 * Delivery date picker with coefficient display and calendar
 * Story 44.26a-FE: Date selection for logistics calculation
 *
 * Features:
 * - Shows selected date in Russian long format
 * - Displays coefficient next to date
 * - Collapsible calendar with click-to-select
 * - Auto-selects tomorrow or first available date
 * - Box type tabs (Коробы, Монопалеты, Суперсейф) when data available
 */
export function DeliveryDatePicker({
  coefficients,
  byBoxType = [],
  selectedDate,
  onDateSelect,
  isLoading = false,
  error = null,
  label = 'Дата сдачи товара',
  showHint = true,
  showFallback: _showFallback = false,
}: DeliveryDatePickerProps) {
  // Use first available box type as default, or 'boxes' if none
  const defaultBoxType = byBoxType.length > 0 ? byBoxType[0].boxType : 'boxes'
  const [selectedBoxType, setSelectedBoxType] = useState<BoxType>(defaultBoxType)

  // Get coefficients for selected box type, or fallback to legacy coefficients
  const activeCoefficients: NormalizedCoefficient[] = useMemo(() => {
    if (byBoxType.length > 0) {
      const boxData = byBoxType.find((b) => b.boxType === selectedBoxType)
      if (boxData) {
        return boxData.dailyCoefficients.map((c) => ({
          date: c.date,
          coefficient: c.coefficient,
          status: getCoefficientStatus(c.coefficient),
          isAvailable: c.isAvailable,
        }))
      }
    }
    return coefficients
  }, [byBoxType, selectedBoxType, coefficients])

  // Check if API returned no data (this is an error condition)
  const hasNoApiData = coefficients.length === 0 && byBoxType.length === 0

  // Get current coefficient for selected date
  const selectedCoefficient = useMemo(() => {
    if (!selectedDate || !activeCoefficients.length) return null
    return activeCoefficients.find((c) => c.date === selectedDate)
  }, [selectedDate, activeCoefficients])

  // Determine default date if none selected
  const effectiveDate = useMemo(() => {
    if (selectedDate) return selectedDate

    const tomorrow = getTomorrowDate()
    const tomorrowCoeff = activeCoefficients.find((c) => c.date === tomorrow)
    if (tomorrowCoeff && tomorrowCoeff.isAvailable) {
      return tomorrow
    }

    const firstAvailable = getFirstAvailableDate(activeCoefficients)
    return firstAvailable?.date ?? null
  }, [selectedDate, activeCoefficients])

  // Check if any dates are available (use isAvailable flag, not coefficient value)
  // coefficient=0 with isAvailable=true means FREE slot (no markup)
  const hasAvailableDates = useMemo(() => {
    return activeCoefficients.some((c) => c.isAvailable)
  }, [activeCoefficients])

  // Check if we have multiple box types to show tabs
  const hasMultipleBoxTypes = byBoxType.length > 1

  if (isLoading) {
    return <DeliveryDatePickerSkeleton label={label} />
  }

  if (error) {
    return <DeliveryDatePickerError message={error} label={label} />
  }

  // Story 44.XX: Show error when API returns no data (should always return coefficients)
  if (hasNoApiData) {
    return (
      <DeliveryDatePickerError
        message="API не вернул данные о коэффициентах приёмки для этого склада"
        label={label}
      />
    )
  }

  const config = selectedCoefficient ? getCoefficientStatusConfig(selectedCoefficient.coefficient) : null

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {showHint && <DeliveryDateHelpPopover />}
      </Label>

      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-md border',
              'bg-background hover:bg-accent/50 transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label="Выбрать дату сдачи товара"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {effectiveDate ? formatDateLongRu(effectiveDate) : 'Выберите дату'}
              </span>
            </div>

            {selectedCoefficient && config && (
              <div className={cn('flex items-center gap-1 text-sm', config.textColor)}>
                <span>Коэфф. приёмки:</span>
                <span className={cn('font-medium px-1.5 py-0.5 rounded', config.bgColor)}>
                  ×{formatCoefficient(selectedCoefficient.coefficient)}
                </span>
              </div>
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3">
          <div className="p-3 border rounded-md bg-muted/20 space-y-3">
            {/* Box Type Tabs */}
            {hasMultipleBoxTypes && (
              <BoxTypeTabs
                boxTypes={byBoxType}
                selectedBoxType={selectedBoxType}
                onBoxTypeChange={setSelectedBoxType}
              />
            )}

            {/* Calendar */}
            {hasAvailableDates ? (
              <CoefficientCalendar
                coefficients={activeCoefficients}
                selectedDate={effectiveDate}
                onDateSelect={onDateSelect}
                maxDays={15}
              />
            ) : (
              <div className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                Нет доступных дат для типа «{byBoxType.find((b) => b.boxType === selectedBoxType)?.label}»
              </div>
            )}

          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

/** Tabs for selecting box type */
function BoxTypeTabs({
  boxTypes,
  selectedBoxType,
  onBoxTypeChange,
}: {
  boxTypes: BoxTypeCoefficients[]
  selectedBoxType: BoxType
  onBoxTypeChange: (boxType: BoxType) => void
}) {
  return (
    <Tabs value={selectedBoxType} onValueChange={(v) => onBoxTypeChange(v as BoxType)}>
      <TabsList className="w-full grid grid-cols-3 h-8">
        {boxTypes.map((bt) => {
          const Icon = BOX_TYPE_ICONS[bt.boxType]
          const availableDays = bt.dailyCoefficients.filter((c) => c.isAvailable).length
          return (
            <TabsTrigger key={bt.boxType} value={bt.boxType} className="text-xs gap-1 px-2">
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{bt.label}</span>
              <span className="sm:hidden">{bt.boxType === 'boxes' ? 'Кор' : bt.boxType === 'pallets' ? 'Пал' : 'Сейф'}</span>
              <span className="text-muted-foreground">({availableDays})</span>
            </TabsTrigger>
          )
        })}
      </TabsList>
      {/* TabsContent not needed - we render calendar below */}
    </Tabs>
  )
}

function DeliveryDatePickerSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="h-10 rounded-md bg-muted animate-pulse" />
    </div>
  )
}

function DeliveryDatePickerError({ message, label }: { message: string; label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="px-3 py-2 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
        {message}
      </div>
    </div>
  )
}

/** Help popover with detailed explanation */
function DeliveryDateHelpPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Справка по дате сдачи</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm" side="right" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold mb-1">📅 Дата сдачи товара</h4>
            <p className="text-muted-foreground">
              Выберите дату, когда планируете сдать товар на склад WB.
              От даты зависит коэффициент логистики.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">📦 Типы поставки</h4>
            <ul className="text-muted-foreground space-y-1">
              <li><strong>Коробы</strong> — стандартная поставка в коробках</li>
              <li><strong>Монопалеты</strong> — поставка на палетах</li>
              <li><strong>Суперсейф</strong> — безопасная упаковка</li>
            </ul>
            <p className="text-muted-foreground mt-1">Число в скобках — количество доступных дней.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">🎨 Цвета коэффициентов приёмки</h4>
            <ul className="text-muted-foreground space-y-0.5">
              <li><span className="inline-block w-3 h-3 rounded bg-green-200 mr-1" />≤1.0 — базовый тариф</li>
              <li><span className="inline-block w-3 h-3 rounded bg-yellow-200 mr-1" />1.0-1.5 — повышенный</li>
              <li><span className="inline-block w-3 h-3 rounded bg-orange-200 mr-1" />1.5-2.0 — высокий</li>
              <li><span className="inline-block w-3 h-3 rounded bg-red-200 mr-1" />&gt;2.0 — пиковый</li>
              <li><span className="inline-block w-3 h-3 rounded bg-gray-200 mr-1" />н/д — недоступно</li>
            </ul>
          </div>

          <div className="pt-2 border-t text-xs text-muted-foreground">
            💡 Коэффициент приёмки умножается на базовый тариф приёмки товара на склад.
            Например, ×1.5 означает +50% к стоимости приёмки.
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
